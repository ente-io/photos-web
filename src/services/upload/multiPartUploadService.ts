import {
    FILE_CHUNKS_COMBINED_FOR_A_UPLOAD_PART,
    RANDOM_PERCENTAGE_PROGRESS_FOR_PUT,
} from 'constants/upload';
import UIService from './uiService';
import UploadHttpClient from './uploadHttpClient';
import * as convert from 'xml-js';
import { CustomError } from 'utils/error';
import { DataStream } from 'types/upload';

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
    fileLocalID: number,
    dataStream: DataStream
) {
    const uploadPartCount = calculatePartCount(dataStream.chunkCount);
    const fileObjectKey = await UploadHttpClient.fetchMultipartUploadsObjectKey(
        uploadPartCount
    );
    await uploadStreamInParts(
        fileObjectKey,
        dataStream.stream,
        fileLocalID,
        uploadPartCount
    );
    return fileObjectKey;
}

export async function uploadStreamInParts(
    fileObjectKey: string,
    dataStream: ReadableStream<Uint8Array>,
    fileLocalID: number,
    uploadPartCount: number
) {
    const streamReader = dataStream.getReader();
    const percentPerPart = getRandomProgressPerPartUpload(uploadPartCount);

    const partEtags: PartEtag[] = [];
    for (let index = 0; index < uploadPartCount; index++) {
        const uploadChunk = await combineChunksToFormUploadPart(streamReader);
        const progressTracker = UIService.trackUploadProgress(
            fileLocalID,
            percentPerPart,
            index
        );

        const eTag = await UploadHttpClient.putFilePart(
            uploadChunk,
            progressTracker,
            index,
            fileObjectKey
        );
        partEtags.push({ PartNumber: index + 1, ETag: eTag });
    }
    const { done } = await streamReader.read();
    if (!done) {
        throw Error(CustomError.CHUNK_MORE_THAN_EXPECTED);
    }
    await completeMultipartUpload(partEtags, fileObjectKey);
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
    fileObjectKey: string
) {
    const options = { compact: true, ignoreComment: true, spaces: 4 };
    const body = convert.js2xml(
        { CompleteMultipartUpload: { Part: partEtags } },
        options
    );
    await UploadHttpClient.completeMultipartUpload(body, fileObjectKey);
}
