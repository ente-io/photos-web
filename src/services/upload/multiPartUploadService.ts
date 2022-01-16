import {
    FILE_CHUNKS_COMBINED_FOR_A_UPLOAD_PART,
    RANDOM_PERCENTAGE_PROGRESS_FOR_PUT,
} from 'constants/upload';
import UIService from './uiService';
import UploadHttpClient from './uploadHttpClient';
import * as convert from 'xml-js';
import { CustomError } from 'utils/error';
import { DataStream, MultipartUploadURLs } from 'types/upload';

interface PartEtag {
    PartNumber: number;
    ETag: string;
}

function calculatePartCount(chunkCount: number) {
    const partCount = Math.ceil(
        chunkCount / FILE_CHUNKS_COMBINED_FOR_A_UPLOAD_PART
    );
    return partCount;
}
export async function uploadStreamUsingMultipart(
    filename: string,
    dataStream: DataStream
) {
    const uploadPartCount = calculatePartCount(dataStream.chunkCount);
    const multipartUploadURLs = await UploadHttpClient.fetchMultipartUploadURLs(
        uploadPartCount
    );
    const fileObjectKey = await uploadStreamInParts(
        multipartUploadURLs,
        dataStream.stream,
        filename,
        uploadPartCount
    );
    return fileObjectKey;
}

export async function uploadStreamInParts(
    multipartUploadURLs: MultipartUploadURLs,
    dataStream: ReadableStream<Uint8Array>,
    filename: string,
    uploadPartCount: number
) {
    const streamReader = dataStream.getReader();
    const percentPerPart = getRandomProgressPerPartUpload(uploadPartCount);

    const partEtags: PartEtag[] = [];
    for (const [
        index,
        fileUploadURL,
    ] of multipartUploadURLs.partURLs.entries()) {
        const uploadChunk = await combineChunksToFormUploadPart(streamReader);
        const progressTracker = UIService.trackUploadProgress(
            filename,
            percentPerPart,
            index
        );

        const eTag = await UploadHttpClient.putFilePart(
            fileUploadURL,
            uploadChunk,
            progressTracker
        );
        partEtags.push({ PartNumber: index + 1, ETag: eTag });
    }
    const { done } = await streamReader.read();
    if (!done) {
        throw Error(CustomError.CHUNK_MORE_THAN_EXPECTED);
    }
    await completeMultipartUpload(partEtags, multipartUploadURLs.completeURL);
    return multipartUploadURLs.objectKey;
}

function getRandomProgressPerPartUpload(uploadPartCount: number) {
    const percentPerPart =
        RANDOM_PERCENTAGE_PROGRESS_FOR_PUT() / uploadPartCount;
    return percentPerPart;
}

async function combineChunksToFormUploadPart(
    streamReader: ReadableStreamDefaultReader<Uint8Array>
) {
    const combinedChunks = [];
    for (let i = 0; i < FILE_CHUNKS_COMBINED_FOR_A_UPLOAD_PART; i++) {
        const { done, value: chunk } = await streamReader.read();
        if (done) {
            break;
        }
        for (let index = 0; index < chunk.length; index++) {
            combinedChunks.push(chunk[index]);
        }
    }
    return Uint8Array.from(combinedChunks);
}

async function completeMultipartUpload(
    partEtags: PartEtag[],
    completeURL: string
) {
    const options = { compact: true, ignoreComment: true, spaces: 4 };
    const body = convert.js2xml(
        { CompleteMultipartUpload: { Part: partEtags } },
        options
    );
    await UploadHttpClient.completeMultipartUpload(completeURL, body);
}
