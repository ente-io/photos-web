import { getToken } from 'utils/common/key';
import { getFileUrl, getThumbnailUrl } from 'utils/common/apiUtil';
import CryptoWorker from 'utils/crypto';
import { generateStreamFromArrayBuffer, convertForPreview } from 'utils/file';
import HTTPService from './HTTPService';
import { File } from './fileService';
import { logError } from 'utils/sentry';
import QueueProcessor, { RequestCanceller } from './upload/queueProcessor';
import { CustomError } from 'utils/common/errorUtil';

const MAX_CONCURRENT_THUMBNAIL_DOWNLOAD = 500;
const MAX_CONCURRENT_FILE_DOWNLOAD = 5;

class DownloadManager {
    private fileObjectUrlPromise = new Map<string, Promise<string>>();
    private thumbnailObjectUrlPromise = new Map<number, Promise<string>>();

    private getThumbnailProcessor = new QueueProcessor<string>(
        MAX_CONCURRENT_THUMBNAIL_DOWNLOAD
    );
    private getFileProcessor = new QueueProcessor<string>(
        MAX_CONCURRENT_FILE_DOWNLOAD
    );

    async getThumbnail(file: File) {
        const response = this.getThumbnailProcessor.queueUpRequest(
            (canceller: RequestCanceller) =>
                this.getThumbnailHelper(file, canceller)
        );
        return response;
    }

    private async getThumbnailHelper(file: File, canceller: RequestCanceller) {
        try {
            const token = getToken();
            if (!token) {
                return null;
            }
            const thumbnailCache = await caches.open('thumbs');
            const cacheResp: Response = await thumbnailCache.match(
                file.id.toString()
            );
            if (cacheResp) {
                return URL.createObjectURL(await cacheResp.blob());
            }
            if (!this.thumbnailObjectUrlPromise.get(file.id)) {
                const downloadPromise = this.downloadThumb(
                    token,
                    thumbnailCache,
                    file,
                    canceller
                );
                this.thumbnailObjectUrlPromise.set(file.id, downloadPromise);
            }
            return await this.thumbnailObjectUrlPromise.get(file.id);
        } catch (e) {
            this.thumbnailObjectUrlPromise.delete(file.id);
            logError(e, 'get preview Failed');
        }
    }

    private async downloadThumb(
        token: string,
        thumbnailCache: Cache,
        file: File,
        canceller: RequestCanceller
    ) {
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
            await thumbnailCache.put(
                file.id.toString(),
                new Response(new Blob([decrypted]))
            );
        } catch (e) {
            // TODO: handle storage full exception.
        }
        return URL.createObjectURL(new Blob([decrypted]));
    }

    public getFile(file: File, forPreview = false) {
        const response = this.getFileProcessor.queueUpRequest(
            (canceller: RequestCanceller) =>
                this.getFileHelper(file, forPreview, canceller)
        );
        return response;
    }

    public async getFileHelper(
        file: File,
        forPreview: boolean,
        canceller?: RequestCanceller
    ) {
        const fileUID = `${file.id}_${forPreview}`;
        try {
            const getFilePromise = (async () => {
                const fileStream = await this.downloadFile(file, canceller);
                let fileBlob = await new Response(fileStream).blob();
                if (forPreview) {
                    fileBlob = await convertForPreview(file, fileBlob);
                }
                return URL.createObjectURL(fileBlob);
            })();
            if (!this.fileObjectUrlPromise.get(fileUID)) {
                this.fileObjectUrlPromise.set(
                    `${file.id}_${forPreview}`,
                    getFilePromise
                );
            }
            return await this.fileObjectUrlPromise.get(fileUID);
        } catch (e) {
            this.fileObjectUrlPromise.delete(fileUID);
            if (e.message === CustomError.REQUEST_CANCELLED) {
                // ignore
            } else {
                logError(e, 'Failed to get File');
            }
        }
    }

    async downloadFile(file: File, canceller?: RequestCanceller) {
        const worker = await new CryptoWorker();
        const token = getToken();
        if (!token) {
            return null;
        }
        const resp = await HTTPService.get(
            getFileUrl(file.id),
            null,
            { 'X-Auth-Token': token },
            { responseType: 'arraybuffer', canceller }
        );
        const decrypted: any = await worker.decryptFile(
            new Uint8Array(resp.data),
            await worker.fromB64(file.file.decryptionHeader),
            file.key
        );
        return generateStreamFromArrayBuffer(decrypted);

        //  This code will not run in any case but is needed for streaming which will be added later

        // const controller = new AbortController();
        // const { signal } = controller;
        // canceller.exec = () => controller.abort();

        // let resp = null;
        // try {
        //     resp = await fetch(getFileUrl(file.id), {
        //         signal,
        //         headers: {
        //             'X-Auth-Token': token,
        //         },
        //     });
        // } catch (e) {
        //     if (e.name === 'AbortError') {
        //         throw CustomError.REQUEST_CANCELLED;
        //     } else {
        //         throw e;
        //     }
        // }
        // const reader = resp.body.getReader();
        // const stream = new ReadableStream({
        //     async start(controller) {
        //         const decryptionHeader = await worker.fromB64(
        //             file.file.decryptionHeader
        //         );
        //         const fileKey = await worker.fromB64(file.key);
        //         const { pullState, decryptionChunkSize } =
        //             await worker.initDecryption(decryptionHeader, fileKey);
        //         let data = new Uint8Array();
        //         // The following function handles each data chunk
        //         function push() {
        //             // "done" is a Boolean and value a "Uint8Array"
        //             reader.read().then(async ({ done, value }) => {
        //                 // Is there more data to read?
        //                 if (!done) {
        //                     const buffer = new Uint8Array(
        //                         data.byteLength + value.byteLength
        //                     );
        //                     buffer.set(new Uint8Array(data), 0);
        //                     buffer.set(new Uint8Array(value), data.byteLength);
        //                     if (buffer.length > decryptionChunkSize) {
        //                         const fileData = buffer.slice(
        //                             0,
        //                             decryptionChunkSize
        //                         );
        //                         const { decryptedData } =
        //                             await worker.decryptChunk(
        //                                 fileData,
        //                                 pullState
        //                             );
        //                         controller.enqueue(decryptedData);
        //                         data = buffer.slice(decryptionChunkSize);
        //                     } else {
        //                         data = buffer;
        //                     }
        //                     push();
        //                 } else {
        //                     if (data) {
        //                         const { decryptedData } =
        //                             await worker.decryptChunk(data, pullState);
        //                         controller.enqueue(decryptedData);
        //                         data = null;
        //                     }
        //                     controller.close();
        //                 }
        //             });
        //         }

        //         push();
        //     },
        // });
        // return stream;
    }
}

export default new DownloadManager();
