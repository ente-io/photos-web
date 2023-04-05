import { EnteFile } from 'types/file';
import { handleUploadError, CustomError } from 'utils/error';
import { logError } from 'utils/sentry';
import { findMatchingExistingFiles } from 'utils/upload';
import UIService from './uiService';
import UploadService from './uploadService';
import { FILE_TYPE } from 'constants/file';
import { UPLOAD_RESULT, MAX_FILE_SIZE_SUPPORTED } from 'constants/upload';
import {
    FileWithCollection,
    BackupedFile,
    UploadFile,
    FileWithMetadata,
    FileTypeInfo,
} from 'types/upload';
import { addLocalLog, addLogLine } from 'utils/logging';
import { convertBytesToHumanReadable } from 'utils/file/size';
import { sleep } from 'utils/common';
import { addToCollection } from 'services/collectionService';
import uploadCancelService from './uploadCancelService';
import { Remote } from 'comlink';
import { DedicatedCryptoWorker } from 'worker/crypto.worker';
import uploadService from './uploadService';
import { FilePublicMagicMetadata } from 'types/magicMetadata';

interface UploadResponse {
    fileUploadResult: UPLOAD_RESULT;
    uploadedFile?: EnteFile;
}

export default async function uploader(
    worker: Remote<DedicatedCryptoWorker>,
    existingFiles: EnteFile[],
    fileWithCollection: FileWithCollection,
    uploaderName: string,
    skipVideos: boolean
): Promise<UploadResponse> {
    const { collection, localID, ...uploadAsset } = fileWithCollection;
    const fileNameSize = `${UploadService.getAssetName(
        fileWithCollection
    )}_${convertBytesToHumanReadable(UploadService.getAssetSize(uploadAsset))}`;

    addLogLine(`uploader called for  ${fileNameSize}`);
    UIService.setFileProgress(localID, 0);
    await sleep(0);
    let fileTypeInfo: FileTypeInfo;
    try {
        const fileSize = UploadService.getAssetSize(uploadAsset);
        if (fileSize >= MAX_FILE_SIZE_SUPPORTED) {
            return { fileUploadResult: UPLOAD_RESULT.TOO_LARGE };
        }
        addLogLine(`getting filetype for ${fileNameSize}`);
        fileTypeInfo = await UploadService.getAssetFileType(uploadAsset);
        addLogLine(
            `got filetype for ${fileNameSize} - ${JSON.stringify(fileTypeInfo)}`
        );
        if (skipVideos && fileTypeInfo.fileType === FILE_TYPE.VIDEO) {
            addLogLine(
                `skipped  video upload for public upload ${fileNameSize}`
            );
            return { fileUploadResult: UPLOAD_RESULT.SKIPPED_VIDEOS };
        }

        addLogLine(`extracting  metadata ${fileNameSize}`);
        const metadata = await UploadService.extractAssetMetadata(
            worker,
            uploadAsset,
            collection.id,
            fileTypeInfo
        );

        const matchingExistingFiles = findMatchingExistingFiles(
            existingFiles,
            metadata
        );
        addLocalLog(
            () =>
                `matchedFileList: ${matchingExistingFiles
                    .map((f) => `${f.id}-${f.metadata.title}`)
                    .join(',')}`
        );
        if (matchingExistingFiles?.length) {
            const matchingExistingFilesCollectionIDs =
                matchingExistingFiles.map((e) => e.collectionID);
            addLocalLog(
                () =>
                    `matched file collectionIDs:${matchingExistingFilesCollectionIDs}
                       and collectionID:${collection.id}`
            );
            if (matchingExistingFilesCollectionIDs.includes(collection.id)) {
                addLogLine(
                    `file already present in the collection , skipped upload for  ${fileNameSize}`
                );
                const sameCollectionMatchingExistingFile =
                    matchingExistingFiles.find(
                        (f) => f.collectionID === collection.id
                    );
                return {
                    fileUploadResult: UPLOAD_RESULT.ALREADY_UPLOADED,
                    uploadedFile: sameCollectionMatchingExistingFile,
                };
            } else {
                addLogLine(
                    `same file in ${matchingExistingFilesCollectionIDs.length} collection found for  ${fileNameSize}`
                );
                // any of the matching file can used to add a symlink
                const resultFile = Object.assign({}, matchingExistingFiles[0]);
                resultFile.collectionID = collection.id;
                await addToCollection(collection, [resultFile]);
                return {
                    fileUploadResult: UPLOAD_RESULT.ADDED_SYMLINK,
                    uploadedFile: resultFile,
                };
            }
        }
        if (uploadCancelService.isUploadCancelationRequested()) {
            throw Error(CustomError.UPLOAD_CANCELLED);
        }
        addLogLine(`reading asset ${fileNameSize}`);

        const file = await UploadService.readAsset(fileTypeInfo, uploadAsset);

        if (file.hasStaticThumbnail) {
            throw Error('upload failed');
        }
        let pubMagicMetadata: FilePublicMagicMetadata;
        if (uploaderName) {
            pubMagicMetadata = await uploadService.constructPublicMagicMetadata(
                { uploaderName }
            );
        }
        const fileWithMetadata: FileWithMetadata = {
            localID,
            filedata: file.filedata,
            thumbnail: file.thumbnail,
            metadata,
            pubMagicMetadata,
        };

        if (uploadCancelService.isUploadCancelationRequested()) {
            throw Error(CustomError.UPLOAD_CANCELLED);
        }
        addLogLine(`encryptAsset ${fileNameSize}`);
        const encryptedFile = await UploadService.encryptAsset(
            worker,
            fileWithMetadata,
            collection.key
        );

        if (uploadCancelService.isUploadCancelationRequested()) {
            throw Error(CustomError.UPLOAD_CANCELLED);
        }
        addLogLine(`uploadToBucket ${fileNameSize}`);

        const backupedFile: BackupedFile = await UploadService.uploadToBucket(
            encryptedFile.file
        );

        const uploadFile: UploadFile = UploadService.getUploadFile(
            collection,
            backupedFile,
            encryptedFile.fileKey
        );

        const uploadedFile = await UploadService.uploadFile(uploadFile);

        UIService.increaseFileUploaded();
        addLogLine(`${fileNameSize} successfully uploaded`);

        return {
            fileUploadResult: metadata.hasStaticThumbnail
                ? UPLOAD_RESULT.UPLOADED_WITH_STATIC_THUMBNAIL
                : UPLOAD_RESULT.UPLOADED,
            uploadedFile: uploadedFile,
        };
    } catch (e) {
        addLogLine(`upload failed for  ${fileNameSize} ,error: ${e.message}`);
        if (
            e.message !== CustomError.UPLOAD_CANCELLED &&
            e.message !== CustomError.UNSUPPORTED_FILE_FORMAT
        ) {
            logError(e, 'file upload failed', {
                fileFormat: fileTypeInfo?.exactType,
            });
        }
        const error = handleUploadError(e);
        switch (error.message) {
            case CustomError.UPLOAD_CANCELLED:
                return { fileUploadResult: UPLOAD_RESULT.CANCELLED };
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
