import { EnteFile } from 'types/file';
import { handleUploadError, CustomError } from 'utils/error';
import { logError } from 'utils/sentry';
import {
    fileAlreadyInCollection,
    findSameFileInOtherCollection,
    shouldDedupeAcrossCollection,
} from 'utils/upload';
import UploadHttpClient from './uploadHttpClient';
import UIService from './uiService';
import UploadService from './uploadService';
import { FILE_TYPE } from 'constants/file';
import { UPLOAD_RESULT, MAX_FILE_SIZE_SUPPORTED } from 'constants/upload';
import { FileWithCollection, BackupedFile, UploadFile } from 'types/upload';
import { logUploadInfo } from 'utils/upload';
import { convertBytesToHumanReadable } from 'utils/billing';
import { sleep } from 'utils/common';
import { addToCollection } from 'services/collectionService';

interface UploadResponse {
    fileUploadResult: UPLOAD_RESULT;
    uploadedFile?: EnteFile;
    skipDecryption?: boolean;
}
export default async function uploader(
    worker: any,
    existingFilesInCollection: EnteFile[],
    existingFiles: EnteFile[],
    fileWithCollection: FileWithCollection
): Promise<UploadResponse> {
    const { collection, localID, ...uploadAsset } = fileWithCollection;
    const fileNameSize = `${UploadService.getAssetName(
        fileWithCollection
    )}_${convertBytesToHumanReadable(UploadService.getAssetSize(uploadAsset))}`;

    logUploadInfo(`uploader called for  ${fileNameSize}`);
    UIService.setFileProgress(localID, 0);
    await sleep(0);
    const { fileTypeInfo, metadata } =
        UploadService.getFileMetadataAndFileTypeInfo(localID);
    try {
        const fileSize = UploadService.getAssetSize(uploadAsset);
        if (fileSize >= MAX_FILE_SIZE_SUPPORTED) {
            return { fileUploadResult: UPLOAD_RESULT.TOO_LARGE };
        }
        if (fileTypeInfo.fileType === FILE_TYPE.OTHERS) {
            throw Error(CustomError.UNSUPPORTED_FILE_FORMAT);
        }
        if (!metadata) {
            throw Error(CustomError.NO_METADATA);
        }

        if (fileAlreadyInCollection(existingFilesInCollection, metadata)) {
            logUploadInfo(`skipped upload for  ${fileNameSize}`);
            return { fileUploadResult: UPLOAD_RESULT.ALREADY_UPLOADED };
        }

        const sameFileInOtherCollection = findSameFileInOtherCollection(
            existingFiles,
            metadata
        );

        if (sameFileInOtherCollection) {
            logUploadInfo(
                `same file in other collection found for  ${fileNameSize}`
            );
            const resultFile = Object.assign({}, sameFileInOtherCollection);
            resultFile.collectionID = collection.id;
            await addToCollection(collection, [resultFile]);
            return {
                fileUploadResult: UPLOAD_RESULT.UPLOADED,
                uploadedFile: resultFile,
                skipDecryption: true,
            };
        }

        // iOS exports via album doesn't export files without collection and if user exports all photos, album info is not preserved.
        // This change allow users to export by albums, upload to ente. And export all photos -> upload files which are not already uploaded
        // as part of the albums
        if (
            shouldDedupeAcrossCollection(fileWithCollection.collection.name) &&
            fileAlreadyInCollection(existingFiles, metadata)
        ) {
            logUploadInfo(`deduped upload for  ${fileNameSize}`);
            return { fileUploadResult: UPLOAD_RESULT.ALREADY_UPLOADED };
        }
        logUploadInfo(`reading asset ${fileNameSize}`);

        const file = await UploadService.readAsset(fileTypeInfo, uploadAsset);

        if (file.hasStaticThumbnail) {
            metadata.hasStaticThumbnail = true;
        }
        const fileWithMetadata = {
            localID,
            filedata: file.filedata,
            thumbnail: file.thumbnail,
            metadata,
        };

        logUploadInfo(`encryptAsset ${fileNameSize}`);
        const encryptedFile = await UploadService.encryptAsset(
            worker,
            fileWithMetadata,
            collection.key
        );

        logUploadInfo(`uploadToBucket ${fileNameSize}`);

        const backupedFile: BackupedFile = await UploadService.uploadToBucket(
            encryptedFile.file
        );

        const uploadFile: UploadFile = UploadService.getUploadFile(
            collection,
            backupedFile,
            encryptedFile.fileKey
        );
        logUploadInfo(`uploadFile ${fileNameSize}`);

        const uploadedFile = await UploadHttpClient.uploadFile(uploadFile);

        UIService.increaseFileUploaded();
        logUploadInfo(`${fileNameSize} successfully uploaded`);

        return {
            fileUploadResult: metadata.hasStaticThumbnail
                ? UPLOAD_RESULT.UPLOADED_WITH_STATIC_THUMBNAIL
                : UPLOAD_RESULT.UPLOADED,
            uploadedFile: uploadedFile,
        };
    } catch (e) {
        logUploadInfo(
            `upload failed for  ${fileNameSize} ,error: ${e.message}`
        );

        logError(e, 'file upload failed', {
            fileFormat: fileTypeInfo?.exactType,
        });
        const error = handleUploadError(e);
        switch (error.message) {
            case CustomError.ETAG_MISSING:
                return { fileUploadResult: UPLOAD_RESULT.BLOCKED };
            case CustomError.UNSUPPORTED_FILE_FORMAT:
                return { fileUploadResult: UPLOAD_RESULT.UNSUPPORTED };
            case CustomError.FILE_TOO_LARGE:
                return {
                    fileUploadResult:
                        UPLOAD_RESULT.LARGER_THAN_AVAILABLE_STORAGE,
                };
            default:
                return { fileUploadResult: UPLOAD_RESULT.FAILED };
        }
    }
}
