import { ElectronFile, FileWithCollection, Metadata } from 'types/upload';
import { EnteFile } from 'types/file';
import { convertBytesToHumanReadable } from 'utils/billing';
import { formatDateTime } from 'utils/file';
import { getLogs, saveLogLine } from 'utils/storage';
import { A_SEC_IN_MICROSECONDS } from 'constants/upload';
import { FILE_TYPE } from 'constants/file';

const TYPE_JSON = 'json';
const DEDUPE_COLLECTION = new Set(['icloud library', 'icloudlibrary']);

export function fileAlreadyInCollection(
    existingFilesInCollection: EnteFile[],
    newFileMetadata: Metadata
): boolean {
    for (const existingFile of existingFilesInCollection) {
        if (areFilesSame(existingFile.metadata, newFileMetadata)) {
            return true;
        }
    }
    return false;
}

export function findSameFileInOtherCollection(
    existingFiles: EnteFile[],
    newFileMetadata: Metadata
) {
    if (!hasFileHash(newFileMetadata)) {
        return null;
    }

    for (const existingFile of existingFiles) {
        if (
            hasFileHash(existingFile.metadata) &&
            areFilesWithFileHashSame(existingFile.metadata, newFileMetadata)
        ) {
            return existingFile;
        }
    }
    return null;
}

export function shouldDedupeAcrossCollection(collectionName: string): boolean {
    // using set to avoid unnecessary regex for removing spaces for each upload
    return DEDUPE_COLLECTION.has(collectionName.toLocaleLowerCase());
}

export function areFilesSame(
    existingFile: Metadata,
    newFile: Metadata
): boolean {
    if (hasFileHash(existingFile) && hasFileHash(newFile)) {
        return areFilesWithFileHashSame(existingFile, newFile);
    } else {
        /*
         * The maximum difference in the creation/modification times of two similar files is set to 1 second.
         * This is because while uploading files in the web - browsers and users could have set reduced
         * precision of file times to prevent timing attacks and fingerprinting.
         * Context: https://developer.mozilla.org/en-US/docs/Web/API/File/lastModified#reduced_time_precision
         */
        if (
            existingFile.fileType === newFile.fileType &&
            Math.abs(existingFile.creationTime - newFile.creationTime) <
                A_SEC_IN_MICROSECONDS &&
            Math.abs(existingFile.modificationTime - newFile.modificationTime) <
                A_SEC_IN_MICROSECONDS &&
            existingFile.title === newFile.title
        ) {
            return true;
        } else {
            return false;
        }
    }
}

export function hasFileHash(file: Metadata) {
    return file.hash || (file.imageHash && file.videoHash);
}

export function areFilesWithFileHashSame(
    existingFile: Metadata,
    newFile: Metadata
): boolean {
    if (
        existingFile.fileType !== newFile.fileType ||
        existingFile.title !== newFile.title
    ) {
        return false;
    }
    if (existingFile.fileType === FILE_TYPE.LIVE_PHOTO) {
        return (
            existingFile.imageHash === newFile.imageHash &&
            existingFile.videoHash === newFile.videoHash
        );
    } else {
        return existingFile.hash === newFile.hash;
    }
}

export function segregateMetadataAndMediaFiles(
    filesWithCollectionToUpload: FileWithCollection[]
) {
    const metadataJSONFiles: FileWithCollection[] = [];
    const mediaFiles: FileWithCollection[] = [];
    filesWithCollectionToUpload.forEach((fileWithCollection) => {
        const file = fileWithCollection.file;
        if (file.name.startsWith('.')) {
            // ignore files with name starting with . (hidden files)
            return;
        }
        if (file.name.toLowerCase().endsWith(TYPE_JSON)) {
            metadataJSONFiles.push(fileWithCollection);
        } else {
            mediaFiles.push(fileWithCollection);
        }
    });
    return { mediaFiles, metadataJSONFiles };
}

export function logUploadInfo(log: string) {
    saveLogLine({
        type: 'upload',
        timestamp: Date.now(),
        logLine: log,
    });
}

export function getUploadLogs() {
    return getLogs()
        .filter((log) => log.type === 'upload')
        .map((log) => `[${formatDateTime(log.timestamp)}] ${log.logLine}`);
}

export function getFileNameSize(file: File | ElectronFile) {
    return `${file.name}_${convertBytesToHumanReadable(file.size)}`;
}

export function areFileWithCollectionsSame(
    firstFile: FileWithCollection,
    secondFile: FileWithCollection
): boolean {
    return firstFile.localID === secondFile.localID;
}
