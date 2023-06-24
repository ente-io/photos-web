import { getToken } from 'utils/common/key';
import { getFileURL, getThumbnailURL } from 'utils/common/apiUtil';
import {
    generateStreamFromArrayBuffer,
    getRenderableFileURL,
    createTypedObjectURL,
} from 'utils/file';
import HTTPService from './HTTPService';
import { EnteFile } from 'types/file';

import { logError } from 'utils/sentry';
import { FILE_TYPE } from 'constants/file';
import { CustomError } from 'utils/error';
import ComlinkCryptoWorker from 'utils/comlink/ComlinkCryptoWorker';
import { CacheStorageService } from './cache/cacheStorageService';
import { CACHES } from 'constants/cache';
import { Remote } from 'comlink';
import { DedicatedCryptoWorker } from 'worker/crypto.worker';
import { LimitedCache } from 'types/cache';
import { addLocalLog } from 'utils/logging';

class DownloadManager {
    private fileObjectURLPromise = new Map<
        string,
        Promise<{ original: string[]; converted: string[] }>
    >();
    private thumbnailObjectURLPromise = new Map<number, Promise<string>>();

    private async getThumbnailCache() {
        try {
            const thumbnailCache = await CacheStorageService.open(
                CACHES.THUMBS
            );
            return thumbnailCache;
        } catch (e) {
            return null;
            // ignore
        }
    }

    public async getCachedThumbnail(
        file: EnteFile,
        thumbnailCache?: LimitedCache
    ) {
        try {
            if (!thumbnailCache) {
                thumbnailCache = await this.getThumbnailCache();
            }
            const cacheResp: Response = await thumbnailCache?.match(
                file.id.toString()
            );

            if (cacheResp) {
                return URL.createObjectURL(await cacheResp.blob());
            }
            return null;
        } catch (e) {
            logError(e, 'failed to get cached thumbnail');
            throw e;
        }
    }

    public async getThumbnail(
        file: EnteFile,
        tokenOverride?: string,
        usingWorker?: Remote<DedicatedCryptoWorker>,
        timeout?: number
    ) {
        try {
            const token = tokenOverride || getToken();
            if (!token) {
                return null;
            }
            if (!this.thumbnailObjectURLPromise.has(file.id)) {
                const downloadPromise = async () => {
                    const thumbnailCache = await this.getThumbnailCache();
                    const cachedThumb = await this.getCachedThumbnail(
                        file,
                        thumbnailCache
                    );
                    if (cachedThumb) {
                        return cachedThumb;
                    }
                    const thumb = await this.downloadThumb(
                        token,
                        file,
                        usingWorker,
                        timeout
                    );
                    const thumbBlob = new Blob([thumb]);

                    thumbnailCache
                        ?.put(file.id.toString(), new Response(thumbBlob))
                        .catch((e) => {
                            logError(e, 'cache put failed');
                            // TODO: handle storage full exception.
                        });
                    return URL.createObjectURL(thumbBlob);
                };
                this.thumbnailObjectURLPromise.set(file.id, downloadPromise());
            }

            return await this.thumbnailObjectURLPromise.get(file.id);
        } catch (e) {
            this.thumbnailObjectURLPromise.delete(file.id);
            logError(e, 'get DownloadManager preview Failed');
            throw e;
        }
    }

    downloadThumb = async (
        token: string,
        file: EnteFile,
        usingWorker?: Remote<DedicatedCryptoWorker>,
        timeout?: number
    ) => {
        const resp = await HTTPService.get(
            getThumbnailURL(file.id),
            null,
            { 'X-Auth-Token': token },
            { responseType: 'arraybuffer', timeout }
        );
        if (typeof resp.data === 'undefined') {
            throw Error(CustomError.REQUEST_FAILED);
        }
        const cryptoWorker =
            usingWorker || (await ComlinkCryptoWorker.getInstance());
        const decrypted = await cryptoWorker.decryptThumbnail(
            new Uint8Array(resp.data),
            await cryptoWorker.fromB64(file.thumbnail.decryptionHeader),
            file.key
        );
        return decrypted;
    };

    getFile = async (file: EnteFile, forPreview = false) => {
        const fileKey = forPreview ? `${file.id}_preview` : `${file.id}`;
        addLocalLog(() => `getFile: ${fileKey}`);

        try {
            const getFilePromise = async () => {
                let fileStream: ReadableStream;
                if (file.metadata.fileType === FILE_TYPE.IMAGE) {
                    addLocalLog(() => `getFile: ${fileKey} is image`);
                    const fileCache = await CacheStorageService.open(
                        CACHES.FILES
                    );
                    const cachedFile = await fileCache?.match(fileKey);
                    if (cachedFile) {
                        addLocalLog(() => `getFile: ${fileKey} is cached`);
                        fileStream = cachedFile.body;
                    } else {
                        addLocalLog(() => `getFile: ${fileKey} is not cached`);
                    }
                } else {
                    const originalFileCache = await CacheStorageService.open(
                        CACHES.ORIGINAL_FILES
                    );
                    const cachedOriginalFile = await originalFileCache?.match(
                        fileKey
                    );
                    if (cachedOriginalFile) {
                        addLocalLog(
                            () => `getFile: ${fileKey} is cached original`
                        );
                        fileStream = cachedOriginalFile.body;
                    } else {
                        addLocalLog(
                            () => `getFile: ${fileKey} is not cached original`
                        );
                    }
                }
                let fileBlob: Blob;

                if (!fileStream) {
                    addLocalLog(() => `getFile: ${fileKey} is not cached`);
                    fileStream = await this.downloadFile(file);
                    fileBlob = await new Response(fileStream).blob();
                    if (file.metadata.fileType === FILE_TYPE.IMAGE) {
                        const fileCache = await CacheStorageService.open(
                            CACHES.FILES
                        );
                        fileCache?.put(fileKey, new Response(fileBlob));
                    } else {
                        const originalFileCache =
                            await CacheStorageService.open(
                                CACHES.ORIGINAL_FILES
                            );
                        originalFileCache?.put(fileKey, new Response(fileBlob));
                    }
                } else {
                    fileBlob = await new Response(fileStream).blob();
                }

                if (forPreview) {
                    return await getRenderableFileURL(file, fileBlob);
                } else {
                    const fileURL = await createTypedObjectURL(
                        fileBlob,
                        file.metadata.title
                    );
                    return { converted: [fileURL], original: [fileURL] };
                }
            };
            if (!this.fileObjectURLPromise.get(fileKey)) {
                this.fileObjectURLPromise.set(fileKey, getFilePromise());
            }
            const fileURLs = await this.fileObjectURLPromise.get(fileKey);
            return fileURLs;
        } catch (e) {
            this.fileObjectURLPromise.delete(fileKey);
            logError(e, 'download manager Failed to get File');
            throw e;
        }
    };

    public async getCachedOriginalFile(file: EnteFile) {
        return await this.fileObjectURLPromise.get(file.id.toString());
    }

    async downloadFile(
        file: EnteFile,
        tokenOverride?: string,
        usingWorker?: Remote<DedicatedCryptoWorker>,
        timeout?: number
    ) {
        const cryptoWorker =
            usingWorker || (await ComlinkCryptoWorker.getInstance());
        const token = tokenOverride || getToken();
        if (!token) {
            return null;
        }
        if (
            file.metadata.fileType === FILE_TYPE.IMAGE ||
            file.metadata.fileType === FILE_TYPE.LIVE_PHOTO
        ) {
            const resp = await HTTPService.get(
                getFileURL(file.id),
                null,
                { 'X-Auth-Token': token },
                { responseType: 'arraybuffer', timeout }
            );
            if (typeof resp.data === 'undefined') {
                throw Error(CustomError.REQUEST_FAILED);
            }
            const decrypted = await cryptoWorker.decryptFile(
                new Uint8Array(resp.data),
                await cryptoWorker.fromB64(file.file.decryptionHeader),
                file.key
            );
            return generateStreamFromArrayBuffer(decrypted);
        }
        const resp = await fetch(getFileURL(file.id), {
            headers: {
                'X-Auth-Token': token,
            },
        });
        const reader = resp.body.getReader();
        const stream = new ReadableStream({
            async start(controller) {
                const decryptionHeader = await cryptoWorker.fromB64(
                    file.file.decryptionHeader
                );
                const fileKey = await cryptoWorker.fromB64(file.key);
                const { pullState, decryptionChunkSize } =
                    await cryptoWorker.initChunkDecryption(
                        decryptionHeader,
                        fileKey
                    );
                let data = new Uint8Array();
                // The following function handles each data chunk
                function push() {
                    // "done" is a Boolean and value a "Uint8Array"
                    reader.read().then(async ({ done, value }) => {
                        // Is there more data to read?
                        if (!done) {
                            const buffer = new Uint8Array(
                                data.byteLength + value.byteLength
                            );
                            buffer.set(new Uint8Array(data), 0);
                            buffer.set(new Uint8Array(value), data.byteLength);
                            if (buffer.length > decryptionChunkSize) {
                                const fileData = buffer.slice(
                                    0,
                                    decryptionChunkSize
                                );
                                const { decryptedData } =
                                    await cryptoWorker.decryptFileChunk(
                                        fileData,
                                        pullState
                                    );
                                controller.enqueue(decryptedData);
                                data = buffer.slice(decryptionChunkSize);
                            } else {
                                data = buffer;
                            }
                            push();
                        } else {
                            if (data) {
                                const { decryptedData } =
                                    await cryptoWorker.decryptFileChunk(
                                        data,
                                        pullState
                                    );
                                controller.enqueue(decryptedData);
                                data = null;
                            }
                            controller.close();
                        }
                    });
                }

                push();
            },
        });
        return stream;
    }
}

export default new DownloadManager();
