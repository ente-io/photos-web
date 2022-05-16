import HTTPService from 'services/HTTPService';
import { getEndpoint, getUploadEndpoint } from 'utils/common/apiUtil';
import { getToken } from 'utils/common/key';
import { logError } from 'utils/sentry';
import { EnteFile } from 'types/file';
import { CustomError, handleUploadError } from 'utils/error';
import { UploadFile, UploadURL, MultipartUploadURLs } from 'types/upload';
import { retryHTTPCall } from 'utils/upload/uploadRetrier';

const ENDPOINT = getEndpoint();
const MAX_URL_REQUESTS = 50;
const UPLOAD_URL = getUploadEndpoint();

class UploadHttpClient {
    private uploadURLFetchInProgress = null;

    async uploadFile(uploadFile: UploadFile): Promise<EnteFile> {
        try {
            const token = getToken();
            if (!token) {
                return;
            }
            const response = await retryHTTPCall(
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

    async fetchMultipartUploadsObjectKey(count: number): Promise<string> {
        try {
            const token = getToken();
            if (!token) {
                return;
            }
            const response = await HTTPService.get(
                `${UPLOAD_URL}/multipart-key`,
                {
                    count,
                },
                { 'X-Auth-Token': token }
            );

            return response.data['objectKey'];
        } catch (e) {
            logError(e, 'fetch multipart-upload-object-key failed');
            throw e;
        }
    }

    async putFile(
        fileUploadURL: UploadURL,
        file: Uint8Array,
        progressTracker
    ): Promise<string> {
        try {
            await retryHTTPCall(() =>
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

    async putFileV2(file: Uint8Array, progressTracker): Promise<string> {
        try {
            const token = getToken();
            let objectKey: string;
            await retryHTTPCall(async () => {
                const resp = await HTTPService.put(
                    `${UPLOAD_URL}/single-upload`,
                    file,
                    null,
                    {
                        'X-Auth-Token': token,
                    },
                    progressTracker
                );
                objectKey = resp.data['objectKey'];
            });
            return objectKey;
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
            const response = await retryHTTPCall(async () => {
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

    async putFilePartV2(
        objectKey: string,
        index: number,
        filePart: Uint8Array,
        progressTracker
    ) {
        try {
            const response = await retryHTTPCall(async () => {
                const resp = await HTTPService.put(
                    `${UPLOAD_URL}/multipart-uploads`,
                    filePart,
                    null,
                    {
                        'PART-INDEX': index,
                        'OBJECT-KEY': objectKey,
                    },
                    progressTracker
                );
                if (!resp?.data?.eTag) {
                    const err = Error(CustomError.ETAG_MISSING);
                    logError(err, 'putFile in parts failed');
                    throw err;
                }
                return resp;
            });
            return response.data.eTag as string;
        } catch (e) {
            logError(e, 'put filePart failed');
            throw e;
        }
    }

    async completeMultipartUpload(completeURL: string, reqBody: any) {
        try {
            await retryHTTPCall(() =>
                HTTPService.post(completeURL, reqBody, null, {
                    'content-type': 'text/xml',
                })
            );
        } catch (e) {
            logError(e, 'put file in parts failed');
            throw e;
        }
    }

    async completeMultipartUploadV2(objectKey: string, reqBody: any) {
        try {
            await retryHTTPCall(() =>
                HTTPService.post(
                    `${UPLOAD_URL}/multipart-complete`,
                    reqBody,
                    null,
                    {
                        'content-type': 'text/xml',
                        'OBJECT-KEY': objectKey,
                    }
                )
            );
        } catch (e) {
            logError(e, 'put file in parts failed');
            throw e;
        }
    }
}

export default new UploadHttpClient();
