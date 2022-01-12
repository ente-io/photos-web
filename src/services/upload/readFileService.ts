import { FILE_TYPE } from 'constants/file';
import { logError } from 'utils/sentry';
import {
    FILE_READER_CHUNK_SIZE,
    FORMAT_MISSED_BY_FILE_TYPE_LIB,
    MULTIPART_PART_SIZE,
} from 'constants/upload';
import FileType from 'file-type/browser';
import { CustomError } from 'utils/error';
import { getFileExtension, splitFilenameAndExtension } from 'utils/file';
import { FileTypeInfo } from 'types/upload';

const TYPE_VIDEO = 'video';
const TYPE_IMAGE = 'image';
const EDITED_FILE_SUFFIX = '-edited';
const CHUNK_SIZE_FOR_TYPE_DETECTION = 4100;

export async function getFileData(reader: FileReader, file: File) {
    if (file.size > MULTIPART_PART_SIZE) {
        return getFileStream(reader, file, FILE_READER_CHUNK_SIZE);
    } else {
        return await getUint8ArrayView(reader, file);
    }
}

export async function getFileType(
    reader: FileReader,
    receivedFile: File
): Promise<FileTypeInfo> {
    try {
        let fileType: FILE_TYPE;
        const mimeType = await getMimeType(reader, receivedFile);
        const typeParts = mimeType?.split('/');
        if (typeParts?.length !== 2) {
            throw Error(CustomError.TYPE_DETECTION_FAILED);
        }
        switch (typeParts[0]) {
            case TYPE_IMAGE:
                fileType = FILE_TYPE.IMAGE;
                break;
            case TYPE_VIDEO:
                fileType = FILE_TYPE.VIDEO;
                break;
            default:
                fileType = FILE_TYPE.OTHERS;
        }
        return { fileType, exactType: typeParts[1] };
    } catch (e) {
        const fileFormat = getFileExtension(receivedFile.name);
        const formatMissedByTypeDetection = FORMAT_MISSED_BY_FILE_TYPE_LIB.find(
            (a) => a.exactType === fileFormat
        );
        if (formatMissedByTypeDetection) {
            return formatMissedByTypeDetection;
        }
        logError(e, CustomError.TYPE_DETECTION_FAILED, {
            fileFormat,
        });
        return { fileType: FILE_TYPE.OTHERS, exactType: fileFormat };
    }
}

/*
    Get the original file name for edited file to associate it to original file's metadataJSON file 
    as edited file doesn't have their own metadata file
*/
export function getFileOriginalName(file: File) {
    let originalName: string = null;
    const [nameWithoutExtension, extension] = splitFilenameAndExtension(
        file.name
    );

    const isEditedFile = nameWithoutExtension.endsWith(EDITED_FILE_SUFFIX);
    if (isEditedFile) {
        originalName = nameWithoutExtension.slice(
            0,
            -1 * EDITED_FILE_SUFFIX.length
        );
    } else {
        originalName = file.name;
    }
    if (extension) {
        originalName += '.' + extension;
    }
    return originalName;
}

async function getMimeType(reader: FileReader, file: File) {
    const fileChunkBlob = file.slice(0, CHUNK_SIZE_FOR_TYPE_DETECTION);
    return getMimeTypeFromBlob(reader, fileChunkBlob);
}

export async function getMimeTypeFromBlob(reader: FileReader, fileBlob: Blob) {
    try {
        const initialFiledata = await getUint8ArrayView(reader, fileBlob);
        const result = await FileType.fromBuffer(initialFiledata);
        return result.mime;
    } catch (e) {
        throw Error(CustomError.TYPE_DETECTION_FAILED);
    }
}

function getFileStream(reader: FileReader, file: File, chunkSize: number) {
    const fileChunkReader = fileChunkReaderMaker(reader, file, chunkSize);

    const stream = new ReadableStream<Uint8Array>({
        async pull(controller: ReadableStreamDefaultController) {
            const chunk = await fileChunkReader.next();
            if (chunk.done) {
                controller.close();
            } else {
                controller.enqueue(chunk.value);
            }
        },
    });
    const chunkCount = Math.ceil(file.size / chunkSize);
    return {
        stream,
        chunkCount,
    };
}

async function* fileChunkReaderMaker(
    reader: FileReader,
    file: File,
    chunkSize: number
) {
    let offset = 0;
    while (offset < file.size) {
        const blob = file.slice(offset, chunkSize + offset);
        const fileChunk = await getUint8ArrayView(reader, blob);
        yield fileChunk;
        offset += chunkSize;
    }
    return null;
}

export async function getUint8ArrayView(
    reader: FileReader,
    file: Blob
): Promise<Uint8Array> {
    try {
        return await new Promise((resolve, reject) => {
            reader.onabort = () => reject(Error('file reading was aborted'));
            reader.onerror = () => reject(Error('file reading has failed'));
            reader.onload = () => {
                // Do whatever you want with the file contents
                const result =
                    typeof reader.result === 'string'
                        ? new TextEncoder().encode(reader.result)
                        : new Uint8Array(reader.result);
                resolve(result);
            };
            reader.readAsArrayBuffer(file);
        });
    } catch (e) {
        logError(e, 'error reading file to byte-array');
        throw e;
    }
}
