import { EnteFile } from 'types/file';
import { sleep } from 'utils/common';
import { handleUploadError, CustomError } from 'utils/error';
import { decryptFile } from 'utils/file';
import { logError } from 'utils/sentry';
import { fileAlreadyInCollection } from 'utils/upload';
import UploadHttpClient from './uploadHttpClient';
import UIService from './uiService';
import UploadService from './uploadService';
import uploadService from './uploadService';
import {
    BackupedFile,
    EncryptedFile,
    FileInMemory,
    FileTypeInfo,
    FileWithCollection,
    FileWithMetadata,
    Metadata,
    UploadFile,
} from 'types/upload';
import { FILE_TYPE } from 'constants/file';
import { FileUploadResults } from 'constants/upload';

const TwoSecondInMillSeconds = 2000;
const FIVE_GB_IN_BYTES = 5 * 1024 * 1024 * 1024;
interface UploadResponse {
    fileUploadResult: FileUploadResults;
    file?: EnteFile;
}
export default async function uploader(
    worker: any,
    reader: FileReader,
    existingFilesInCollection: EnteFile[],
    fileWithCollection: FileWithCollection
): Promise<UploadResponse> {
    const { file: rawFile, collection } = fileWithCollection;

    UIService.setFileProgress(rawFile.name, 0);

    let file: FileInMemory = null;
    let encryptedFile: EncryptedFile = null;
    let metadata: Metadata = null;
    const fileTypeInfo: FileTypeInfo = null;
    let fileWithMetadata: FileWithMetadata = null;

    try {
        if (rawFile.size >= FIVE_GB_IN_BYTES) {
            UIService.setFileProgress(
                rawFile.name,
                FileUploadResults.TOO_LARGE
            );
            // wait two second before removing the file from the progress in file section
            await sleep(TwoSecondInMillSeconds);
            return { fileUploadResult: FileUploadResults.TOO_LARGE };
        }
        metadata = await uploadService.getFileMetadata(rawFile, collection);

        if (fileTypeInfo.fileType === FILE_TYPE.OTHERS) {
            throw Error(CustomError.UNSUPPORTED_FILE_FORMAT);
        }

        if (fileAlreadyInCollection(existingFilesInCollection, metadata)) {
            UIService.setFileProgress(rawFile.name, FileUploadResults.SKIPPED);
            // wait two second before removing the file from the progress in file section
            await sleep(TwoSecondInMillSeconds);
            return { fileUploadResult: FileUploadResults.SKIPPED };
        }

        file = await UploadService.readFile(
            worker,
            reader,
            rawFile,
            fileTypeInfo
        );
        if (file.hasStaticThumbnail) {
            metadata.hasStaticThumbnail = true;
        }
        fileWithMetadata = {
            filedata: file.filedata,
            thumbnail: file.thumbnail,
            metadata,
        };

        encryptedFile = await UploadService.encryptFile(
            worker,
            fileWithMetadata,
            collection.key
        );

        const backupedFile: BackupedFile = await UploadService.uploadToBucket(
            encryptedFile.file
        );

        const uploadFile: UploadFile = UploadService.getUploadFile(
            collection,
            backupedFile,
            encryptedFile.fileKey
        );

        const uploadedFile = await UploadHttpClient.uploadFile(uploadFile);
        const decryptedFile = await decryptFile(uploadedFile, collection);

        UIService.setFileProgress(rawFile.name, FileUploadResults.UPLOADED);
        UIService.increaseFileUploaded();
        return {
            fileUploadResult: FileUploadResults.UPLOADED,
            file: decryptedFile,
        };
    } catch (e) {
        logError(e, 'file upload failed', {
            fileFormat: fileTypeInfo.exactType,
        });
        const error = handleUploadError(e);
        switch (error.message) {
            case CustomError.ETAG_MISSING:
                UIService.setFileProgress(
                    rawFile.name,
                    FileUploadResults.BLOCKED
                );
                return { fileUploadResult: FileUploadResults.BLOCKED };
            case CustomError.UNSUPPORTED_FILE_FORMAT:
                UIService.setFileProgress(
                    rawFile.name,
                    FileUploadResults.UNSUPPORTED
                );
                return { fileUploadResult: FileUploadResults.UNSUPPORTED };

            case CustomError.FILE_TOO_LARGE:
                UIService.setFileProgress(
                    rawFile.name,
                    FileUploadResults.TOO_LARGE
                );
                return { fileUploadResult: FileUploadResults.TOO_LARGE };
            default:
                UIService.setFileProgress(
                    rawFile.name,
                    FileUploadResults.FAILED
                );
                return { fileUploadResult: FileUploadResults.FAILED };
        }
    } finally {
        file = null;
        fileWithMetadata = null;
        encryptedFile = null;
    }
}
