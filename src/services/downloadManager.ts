import { getToken } from 'utils/common/key';
import { getFileURL, getThumbnailURL } from 'utils/common/apiUtil';
import CryptoWorker from 'utils/crypto';
import {
    generateStreamFromArrayBuffer,
    convertForPreview,
    needsConversionForPreview,
    createTypedObjectURL,
} from 'utils/file';
import HTTPService from './HTTPService';
import { EnteFile } from 'types/file';

import { logError } from 'utils/sentry';
import { FILE_TYPE } from 'constants/file';
import { CustomError } from 'utils/error';

class DownloadManager {
    private fileObjectURLPromise = new Map<string, Promise<string[]>>();
    private thumbnailObjectURLPromise = new Map<number, Promise<string>>();

    public async getThumbnail(file: EnteFile) {
        try {
            const token = getToken();
            if (!token) {
                return null;
            }
            if (!this.thumbnailObjectURLPromise.get(file.id)) {
                const downloadPromise = async () => {
                    const thumbnailCache = await (async () => {
                        try {
                            return await caches.open('thumbs');
                        } catch (e) {
                            return null;
                            // ignore
                        }
                    })();

                    const cacheResp: Response = await thumbnailCache?.match(
                        file.id.toString()
                    );
                    if (cacheResp) {
                        return URL.createObjectURL(await cacheResp.blob());
                    }
                    const thumb = await this.downloadThumb(token, file);
                    const thumbBlob = new Blob([thumb]);
                    try {
                        await thumbnailCache?.put(
                            file.id.toString(),
                            new Response(thumbBlob)
                        );
                    } catch (e) {
                        // TODO: handle storage full exception.
                    }
                    return URL.createObjectURL(thumbBlob);
                };
                this.thumbnailObjectURLPromise.set(file.id, downloadPromise());
            }

            return await this.thumbnailObjectURLPromise.get(file.id);
        } catch (e) {
            this.thumbnailObjectURLPromise.delete(file.id);
            logError(e, 'get preview Failed');
            throw e;
        }
    }

    downloadThumb = async (token: string, file: EnteFile) => {
        const resp = await HTTPService.get(
            getThumbnailURL(file.id),
            null,
            { 'X-Auth-Token': token },
            { responseType: 'arraybuffer' }
        );
        if (typeof resp.data === 'undefined') {
            throw Error(CustomError.REQUEST_FAILED);
        }
        const worker = await new CryptoWorker();
        const decrypted: Uint8Array = await worker.decryptThumbnail(
            new Uint8Array(resp.data),
            await worker.fromB64(file.thumbnail.decryptionHeader),
            file.key
        );
        return decrypted;
    };

    getFile = async (file: EnteFile, forPreview = false) => {
        const shouldBeConverted = forPreview && needsConversionForPreview(file);
        const fileKey = shouldBeConverted
            ? `${file.id}_converted`
            : `${file.id}`;
        try {
            const getFilePromise = async (convert: boolean) => {
                const fileStream = await this.downloadFile(file);
                const fileBlob = await new Response(fileStream).blob();
                if (convert) {
                    const convertedBlobs = await convertForPreview(
                        file,
                        fileBlob
                    );
                    return await Promise.all(
                        convertedBlobs.map(
                            async (blob) =>
                                await createTypedObjectURL(
                                    blob,
                                    file.metadata.title
                                )
                        )
                    );
                }
                return [
                    await createTypedObjectURL(fileBlob, file.metadata.title),
                ];
            };
            if (!this.fileObjectURLPromise.get(fileKey)) {
                this.fileObjectURLPromise.set(
                    fileKey,
                    getFilePromise(shouldBeConverted)
                );
            }
            const fileURLs = await this.fileObjectURLPromise.get(fileKey);
            return fileURLs;
        } catch (e) {
            this.fileObjectURLPromise.delete(fileKey);
            logError(e, 'Failed to get File');
            throw e;
        }
    };

    public async getCachedOriginalFile(file: EnteFile) {
        return await this.fileObjectURLPromise.get(file.id.toString());
    }

    async downloadFile(file: EnteFile) {
        const worker = await new CryptoWorker();
        const token = getToken();
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
                { responseType: 'arraybuffer' }
            );
            if (typeof resp.data === 'undefined') {
                throw Error(CustomError.REQUEST_FAILED);
            }
            const decrypted: any = await worker.decryptFile(
                new Uint8Array(resp.data),
                await worker.fromB64(file.file.decryptionHeader),
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
                const decryptionHeader = await worker.fromB64(
                    file.file.decryptionHeader
                );
                const fileKey = await worker.fromB64(file.key);
                const { pullState, decryptionChunkSize } =
                    await worker.initDecryption(decryptionHeader, fileKey);
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
                                    await worker.decryptChunk(
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
                                    await worker.decryptChunk(data, pullState);
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
