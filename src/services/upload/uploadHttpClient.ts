import HTTPService from 'services/HTTPService';
import { getEndpoint } from 'utils/common/apiUtil';
import { getToken } from 'utils/common/key';
import { UploadFile, UploadURL } from './uploadService';
import { File } from '../fileService';
import {
    CustomError,
    errorWithContext,
    handleUploadError,
} from 'utils/common/errorUtil';
import { retryAsyncFunction } from 'utils/network';
import { MultipartUploadURLs } from './multiPartUploadService';

const ENDPOINT = getEndpoint();
const MAX_URL_REQUESTS = 50;

class UploadHttpClient {
    private uploadURLFetchInProgress = null;

    async uploadFile(uploadFile: UploadFile): Promise<File> {
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
            throw errorWithContext(e, 'upload Files Failed');
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
                    this.uploadURLFetchInProgress = await retryAsyncFunction(
                        () =>
                            HTTPService.get(
                                `${ENDPOINT}/files/upload-urls`,
                                {
                                    count: Math.min(
                                        MAX_URL_REQUESTS,
                                        count * 2
                                    ),
                                },
                                { 'X-Auth-Token': token }
                            ),
                        handleUploadError
                    );
                    const response = await this.uploadURLFetchInProgress;
                    urlStore.push(...response.data['urls']);
                } finally {
                    this.uploadURLFetchInProgress = null;
                }
            }
            return this.uploadURLFetchInProgress;
        } catch (e) {
            const err = errorWithContext(e, 'fetch upload-url failed ', 1);
            console.log(err);
            throw err;
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
            const response = await retryAsyncFunction(
                () =>
                    HTTPService.get(
                        `${ENDPOINT}/files/multipart-upload-urls`,
                        {
                            count,
                        },
                        { 'X-Auth-Token': token }
                    ),
                handleUploadError
            );

            return response.data['urls'];
        } catch (e) {
            throw errorWithContext(e, 'fetch multipart-upload-url failed');
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
            throw errorWithContext(e, 'putFile to dataStore failed ');
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
                    throw errorWithContext(err, 'putFile in parts failed');
                }
                return resp;
            });
            return response.headers.etag as string;
        } catch (e) {
            throw errorWithContext(e, 'put filePart failed');
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
            throw errorWithContext(e, 'put file in parts failed');
        }
    }
}

export default new UploadHttpClient();
