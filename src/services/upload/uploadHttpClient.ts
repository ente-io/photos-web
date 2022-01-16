import HTTPService from 'services/HTTPService';
import { getEndpoint } from 'utils/common/apiUtil';
import { getToken } from 'utils/common/key';
import { logError } from 'utils/sentry';
import { EnteFile } from 'types/file';
import { CustomError, handleUploadError } from 'utils/error';
import { retryAsyncFunction } from 'utils/network';
import { UploadFile, UploadURL, MultipartUploadURLs } from 'types/upload';

const ENDPOINT = getEndpoint();
const MAX_URL_REQUESTS = 50;

class UploadHttpClient {
    private uploadURLFetchInProgress = null;

    async uploadFile(uploadFile: UploadFile): Promise<EnteFile> {
        try {
            const token = getToken();
            if (!token) {
                return;
            }
            const response = await retryAsyncFunction(
                () =>
                    HTTPService.post(`${ENDPOINT}/files`, uploadFile, null, {
                        'X-Auth-Token': token,
                    }),
                handleUploadError
            );
            return response.data;
        } catch (e) {
            logError(e, 'upload Files Failed');
            throw e;
        }
    }

    async fetchUploadURLs(count: number, urlStore: UploadURL[]): Promise<void> {
        try {
            if (!this.uploadURLFetchInProgress) {
                try {
                    const token = getToken();
                    if (!token) {
                        return;
                    }
                    this.uploadURLFetchInProgress = HTTPService.get(
                        `${ENDPOINT}/files/upload-urls`,
                        {
                            count: Math.min(MAX_URL_REQUESTS, count * 2),
                        },
                        { 'X-Auth-Token': token }
                    );
                    const response = await this.uploadURLFetchInProgress;
                    urlStore.push(...response.data['urls']);
                } finally {
                    this.uploadURLFetchInProgress = null;
                }
            }
            return this.uploadURLFetchInProgress;
        } catch (e) {
            logError(e, 'fetch upload-url failed ');
            throw e;
        }
    }

    async fetchMultipartUploadURLs(
        count: number
    ): Promise<MultipartUploadURLs> {
        try {
            const token = getToken();
            if (!token) {
                return;
            }
            const response = await HTTPService.get(
                `${ENDPOINT}/files/multipart-upload-urls`,
                {
                    count,
                },
                { 'X-Auth-Token': token }
            );

            return response.data['urls'];
        } catch (e) {
            logError(e, 'fetch multipart-upload-url failed');
            throw e;
        }
    }

    async putFile(
        fileUploadURL: UploadURL,
        file: Uint8Array,
        progressTracker
    ): Promise<string> {
        try {
            await retryAsyncFunction(() =>
                HTTPService.put(
                    fileUploadURL.url,
                    file,
                    null,
                    null,
                    progressTracker
                )
            );
            return fileUploadURL.objectKey;
        } catch (e) {
            logError(e, 'putFile to dataStore failed ');
            throw e;
        }
    }

    async putFilePart(
        partUploadURL: string,
        filePart: Uint8Array,
        progressTracker
    ) {
        try {
            const response = await retryAsyncFunction(async () => {
                const resp = await HTTPService.put(
                    partUploadURL,
                    filePart,
                    null,
                    null,
                    progressTracker
                );
                if (!resp?.headers?.etag) {
                    const err = Error(CustomError.ETAG_MISSING);
                    logError(err, 'putFile in parts failed');
                    throw err;
                }
                return resp;
            });
            return response.headers.etag as string;
        } catch (e) {
            logError(e, 'put filePart failed');
            throw e;
        }
    }

    async completeMultipartUpload(completeURL: string, reqBody: any) {
        try {
            await retryAsyncFunction(() =>
                HTTPService.post(completeURL, reqBody, null, {
                    'content-type': 'text/xml',
                })
            );
        } catch (e) {
            logError(e, 'put file in parts failed');
            throw e;
        }
    }
}

export default new UploadHttpClient();
