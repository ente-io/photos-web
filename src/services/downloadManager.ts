import { getToken } from 'utils/common/key';
import { getFileUrl, getThumbnailUrl } from 'utils/common/apiUtil';
import CryptoWorker from 'utils/crypto';
import { generateStreamFromArrayBuffer, convertForPreview } from 'utils/file';
import HTTPService, { RequestCanceller } from './HTTPService';
import { File, FILE_TYPE } from './fileService';
import { logError } from 'utils/sentry';

const MAX_RUNNING_PROCESSES = 5;
interface getPreviewRequest {
    file: File;
    callback: (response) => void;
    isCanceled: { status: boolean };
    canceller: { exec: () => void };
}

interface getFileRequest {
    file: File;
    forPreview: boolean;
    callback: (response) => void;
}
class DownloadManager {
    private fileObjectUrlPromise = new Map<string, Promise<string>>();
    private thumbnailObjectUrlPromise = new Map<number, Promise<string>>();

    private getPreviewQueue: getPreviewRequest[] = [];
    private getFileQueue: getFileRequest[] = [];

    private runningGetPreviewProcesses = 0;
    private runningGetFileProcesses = 0;
    private cache: Cache;

    async initCache() {
        this.cache = await caches.open('thumbs');
    }

    // get preview queue
    public queueUpGetPreviewRequest(file: File) {
        const isCanceled = { status: false };
        const canceller: RequestCanceller = {
            exec: () => {
                isCanceled.status = true;
            },
        };

        const urlPromise = new Promise<string>((resolve) => {
            this.getPreviewQueue.push({
                file,
                callback: resolve,
                isCanceled,
                canceller,
            });
            this.pollGetPreviewQueue();
        });

        return { urlPromise, canceller };
    }

    async pollGetPreviewQueue() {
        if (this.runningGetPreviewProcesses < MAX_RUNNING_PROCESSES) {
            this.runningGetPreviewProcesses++;
            await this.processGetPreviewQueue();
            this.runningGetPreviewProcesses--;
        }
    }

    public async processGetPreviewQueue() {
        while (this.getPreviewQueue.length > 0) {
            const request = this.getPreviewQueue.pop();
            let response: string;

            if (request.isCanceled.status) {
                response = null;
            } else {
                response = await this.getPreview(
                    request.file,
                    request.canceller
                );
            }
            request.callback(response);
            await this.processGetPreviewQueue();
        }
    }

    // get file queue

    public async queueUpGetFileRequest(file: File, forPreview: boolean) {
        const url: string = await new Promise((resolve) => {
            this.getFileQueue.push({ file, forPreview, callback: resolve });
            this.pollGetFileQueue();
        });
        return url;
    }

    async pollGetFileQueue() {
        if (this.runningGetFileProcesses < MAX_RUNNING_PROCESSES) {
            this.runningGetFileProcesses++;
            await this.processGetFileQueue();
            this.runningGetFileProcesses--;
        }
    }
    public async processGetFileQueue() {
        while (this.getFileQueue.length > 0) {
            const request = this.getFileQueue.pop();
            if (!request) {
                return;
            }
            const response = await this.getFile(
                request.file,
                request.forPreview
            );
            request.callback(response);
            await this.processGetFileQueue();
        }
    }

    public async getPreview(file: File, canceller: RequestCanceller) {
        try {
            const token = getToken();
            if (!token) {
                return null;
            }
            if (!this.thumbnailObjectUrlPromise.get(file.id)) {
                if (!this.cache) {
                    await this.initCache();
                }
                const cacheResp: Response = await this.cache.match(
                    file.id.toString()
                );
                if (cacheResp) {
                    return URL.createObjectURL(await cacheResp.blob());
                }
                const download = this.downloadThumb(token, file, canceller);
                this.thumbnailObjectUrlPromise.set(file.id, download);
            }
            return this.thumbnailObjectUrlPromise.get(file.id);
        } catch (e) {
            this.thumbnailObjectUrlPromise.delete(file.id);
            logError(e, 'get preview Failed');
        }
    }
    downloadThumb = async (
        token: string,
        file: File,
        canceller: RequestCanceller
    ) => {
        const resp = await HTTPService.get(
            getThumbnailUrl(file.id),
            null,
            { 'X-Auth-Token': token },
            { responseType: 'arraybuffer', canceller }
        );
        const worker = await new CryptoWorker();
        const decrypted: any = await worker.decryptThumbnail(
            new Uint8Array(resp.data),
            await worker.fromB64(file.thumbnail.decryptionHeader),
            file.key
        );
        try {
            if (!this.cache) {
                await this.initCache();
            }
            await this.cache.put(
                file.id.toString(),
                new Response(new Blob([decrypted]))
            );
        } catch (e) {
            // TODO: handle storage full exception.
        }
        return URL.createObjectURL(new Blob([decrypted]));
    };

    getFile = async (file: File, forPreview = false) => {
        try {
            const getFilePromise = (async () => {
                const fileStream = await this.downloadFile(file);
                let fileBlob = await new Response(fileStream).blob();
                if (forPreview) {
                    fileBlob = await convertForPreview(file, fileBlob);
                }
                return URL.createObjectURL(fileBlob);
            })();
            if (!this.fileObjectUrlPromise.get(`${file.id}_${forPreview}`)) {
                this.fileObjectUrlPromise.set(
                    `${file.id}_${forPreview}`,
                    getFilePromise
                );
            }
            return await this.fileObjectUrlPromise.get(
                `${file.id}_${forPreview}`
            );
        } catch (e) {
            logError(e, 'Failed to get File');
        }
    };

    async downloadFile(file: File) {
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
                getFileUrl(file.id),
                null,
                { 'X-Auth-Token': token },
                { responseType: 'arraybuffer' }
            );
            const decrypted: any = await worker.decryptFile(
                new Uint8Array(resp.data),
                await worker.fromB64(file.file.decryptionHeader),
                file.key
            );
            return generateStreamFromArrayBuffer(decrypted);
        }
        const resp = await fetch(getFileUrl(file.id), {
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
