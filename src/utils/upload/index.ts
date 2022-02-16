import { Metadata } from 'types/upload';
import { EnteFile } from 'types/file';

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
export function areFilesSame(
    existingFile: Metadata,
    newFile: Metadata
): boolean {
    if (
        existingFile.fileType === newFile.fileType &&
        existingFile.creationTime === newFile.creationTime &&
        existingFile.modificationTime === newFile.modificationTime &&
        existingFile.title === newFile.title
    ) {
        return true;
    } else {
        return false;
    }
}
