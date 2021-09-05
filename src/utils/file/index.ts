import { Collection } from 'services/collectionService';
import { File, FILE_TYPE } from 'services/fileService';
import { decodeMotionPhoto } from 'services/motionPhotoService';
import { getMimeTypeFromBlob } from 'services/upload/readFileService';
import { runningInBrowser } from 'utils/common';
import CryptoWorker from 'utils/crypto';

export const TYPE_HEIC = 'heic';
export const TYPE_HEIF = 'heif';
const UNSUPPORTED_FORMATS = ['flv', 'mkv', '3gp', 'avi', 'wmv'];

export function downloadAsFile(filename: string, content: string) {
    const file = new Blob([content], {
        type: 'text/plain',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = filename;

    a.style.display = 'none';
    document.body.appendChild(a);

    a.click();

    a.remove();
}

export async function convertHEIC2JPEG(fileBlob: Blob): Promise<Blob> {
    const heic2any = runningInBrowser() && require('heic2any');
    return await heic2any({
        blob: fileBlob,
        toType: 'image/jpeg',
        quality: 1,
    });
}

export function fileIsHEIC(mimeType: string) {
    return (
        mimeType.toLowerCase().endsWith(TYPE_HEIC) ||
        mimeType.toLowerCase().endsWith(TYPE_HEIF)
    );
}

export function sortFilesIntoCollections(files: File[]) {
    const collectionWiseFiles = new Map<number, File[]>();
    for (const file of files) {
        if (!collectionWiseFiles.has(file.collectionID)) {
            collectionWiseFiles.set(file.collectionID, []);
        }
        collectionWiseFiles.get(file.collectionID).push(file);
    }
    return collectionWiseFiles;
}

export function getSelectedFileIds(selectedFiles) {
    const filesIDs: number[] = [];
    for (const [key, val] of Object.entries(selectedFiles)) {
        if (typeof val === 'boolean' && val) {
            filesIDs.push(Number(key));
        }
    }
    return filesIDs;
}
export function getSelectedFiles(selectedFiles, files: File[]): File[] {
    const filesIDs = new Set(getSelectedFileIds(selectedFiles));
    const filesToDelete: File[] = [];
    for (const file of files) {
        if (filesIDs.has(file.id)) {
            filesToDelete.push(file);
        }
    }
    return filesToDelete;
}

export function checkFileFormatSupport(name: string) {
    for (const format of UNSUPPORTED_FORMATS) {
        if (name.toLowerCase().endsWith(format)) {
            throw Error('unsupported format');
        }
    }
}

export function formatDate(date: number | Date) {
    const dateTimeFormat = new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    return dateTimeFormat.format(date);
}

export function formatDateTime(date: number | Date) {
    const dateTimeFormat = new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const timeFormat = new Intl.DateTimeFormat('en-IN', {
        timeStyle: 'medium',
    });
    return `${dateTimeFormat.format(date)} ${timeFormat.format(date)}`;
}

export function sortFiles(files: File[]) {
    // sort according to modification time first
    files = files.sort((a, b) => {
        if (!b.metadata?.modificationTime) {
            return -1;
        }
        if (!a.metadata?.modificationTime) {
            return 1;
        } else {
            return b.metadata.modificationTime - a.metadata.modificationTime;
        }
    });

    // then sort according to creation time, maintaining ordering according to modification time for files with creation time
    files = files
        .map((file, index) => ({ index, file }))
        .sort((a, b) => {
            let diff =
                b.file.metadata.creationTime - a.file.metadata.creationTime;
            if (diff === 0) {
                diff = a.index - b.index;
            }
            return diff;
        })
        .map((file) => file.file);
    return files;
}

export async function decryptFile(file: File, collection: Collection) {
    const worker = await new CryptoWorker();
    file.key = await worker.decryptB64(
        file.encryptedKey,
        file.keyDecryptionNonce,
        collection.key
    );
    file.metadata = await worker.decryptMetadata(file);
    return file;
}

export function removeUnnecessaryFileProps(files: File[]): File[] {
    const stripedFiles = files.map((file) => {
        delete file.src;
        delete file.msrc;
        delete file.file.objectKey;
        delete file.thumbnail.objectKey;
        delete file.h;
        delete file.html;
        delete file.w;

        return file;
    });
    return stripedFiles;
}

export function fileNameWithoutExtension(filename) {
    const lastDotPosition = filename.lastIndexOf('.');
    if (lastDotPosition === -1) return filename;
    else return filename.substr(0, lastDotPosition);
}

export function fileExtensionWithDot(filename) {
    const lastDotPosition = filename.lastIndexOf('.');
    if (lastDotPosition === -1) return '';
    else return filename.substr(lastDotPosition);
}

export function generateStreamFromArrayBuffer(data: Uint8Array) {
    return new ReadableStream({
        async start(controller: ReadableStreamDefaultController) {
            controller.enqueue(data);
            controller.close();
        },
    });
}

export async function convertForPreview(file: File, fileBlob: Blob) {
    if (file.metadata.fileType === FILE_TYPE.LIVE_PHOTO) {
        const originalName = fileNameWithoutExtension(file.metadata.title);
        const motionPhoto = await decodeMotionPhoto(fileBlob, originalName);
        fileBlob = new Blob([motionPhoto.image]);
    }

    const typeFromExtension = file.metadata.title.split('.')[-1];
    const worker = await new CryptoWorker();

    const mimeType =
        (await getMimeTypeFromBlob(worker, fileBlob)) ?? typeFromExtension;

    if (fileIsHEIC(mimeType)) {
        fileBlob = await convertHEIC2JPEG(fileBlob);
    }
    return fileBlob;
}
