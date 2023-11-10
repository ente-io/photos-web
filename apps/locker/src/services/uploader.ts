import { EnteFile } from 'interfaces/file';
import { handleUploadError, CustomError } from 'utils/error';
import { logError } from 'utils/sentry';
import { findMatchingExistingFiles } from 'utils/upload';
import UIService from './upload/uiService';
import UploadService from './upload/uploadService';
import { UPLOAD_RESULT, MAX_FILE_SIZE_SUPPORTED } from 'constants/upload';
import {
    FileWithCollection,
    BackupedFile,
    UploadFile,
    FileWithMetadata,
    FileTypeInfo,
} from 'interfaces/upload';
import { addLocalLog, addLogLine } from 'utils/logging';
import { convertBytesToHumanReadable } from 'utils/file/size';
import { sleep } from 'utils/common';
import { addToCollection } from 'services/collectionService';
import uploadCancelService from './upload/uploadCancelService';
import { Remote } from 'comlink';
import { DedicatedCryptoWorker } from 'worker/crypto.worker';
import uploadService from './upload/uploadService';
import { FilePublicMagicMetadata } from 'interfaces/magicMetadata';

// Define the expected response from the uploader function
interface UploadResponse {
    fileUploadResult: UPLOAD_RESULT;
    uploadedFile?: EnteFile;
}

// Define the uploader function
export default async function uploader(
    worker: Remote<DedicatedCryptoWorker>, // A remote worker for handling encryption
    existingFiles: EnteFile[], // An array of existing files
    fileWithCollection: FileWithCollection, // The file to be uploaded with its collection information
    uploaderName: string // The name of the uploader
): Promise<UploadResponse> {
    const { collection, localID, ...uploadAsset } = fileWithCollection;
    const fileNameSize = `${UploadService.getAssetName(
        fileWithCollection
    )}_${convertBytesToHumanReadable(UploadService.getAssetSize(uploadAsset))}`;

    // Set the file progress to 0 and wait for 0ms
    addLogLine(`uploader called for  ${fileNameSize}`);
    UIService.setFileProgress(localID, 0);
    await sleep(0);

    let fileTypeInfo: FileTypeInfo;
    let fileSize: number;

    addLogLine(`collectionID: ${collection.id}`);

    try {
        // Get the file size and check if it's supported
        fileSize = UploadService.getAssetSize(uploadAsset);
        if (fileSize >= MAX_FILE_SIZE_SUPPORTED) {
            return { fileUploadResult: UPLOAD_RESULT.TOO_LARGE };
        }

        // Get the file type information
        addLogLine(`getting filetype for ${fileNameSize}`);
        fileTypeInfo = await UploadService.getAssetFileType(uploadAsset);
        addLogLine(
            `got filetype for ${fileNameSize} - ${JSON.stringify(fileTypeInfo)}`
        );

        // Extract metadata from the file
        addLogLine(`extracting  metadata ${fileNameSize}`);
        const metadata = await UploadService.extractAssetMetadata(
            worker,
            uploadAsset,
            collection.id,
            fileTypeInfo
        );

        addLogLine(
            `extracted metadata for ${fileNameSize} - ${JSON.stringify(
                metadata
            )}`
        );

        // Find any matching existing files
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

        // If there are matching files, handle them accordingly
        if (matchingExistingFiles?.length) {
            const matchingExistingFilesCollectionIDs =
                matchingExistingFiles.map((e) => e.collectionID);
            addLocalLog(
                () =>
                    `matched file collectionIDs:${matchingExistingFilesCollectionIDs}
                           and collectionID:${collection.id}`
            );

            // If the file is already present in the collection, return the matching file
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
                // If the file is present in another collection, add a symlink to the current collection
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

        // If the upload has been cancelled, throw an error
        if (uploadCancelService.isUploadCancelationRequested()) {
            throw Error(CustomError.UPLOAD_CANCELLED);
        }

        // Read the file and create a file object with metadata
        addLogLine(`reading asset ${fileNameSize}`);
        const file = await UploadService.readAsset(fileTypeInfo, uploadAsset);
        if (file.hasStaticThumbnail) {
            metadata.hasStaticThumbnail = true;
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

        // If the upload has been cancelled, throw an error
        if (uploadCancelService.isUploadCancelationRequested()) {
            throw Error(CustomError.UPLOAD_CANCELLED);
        }

        // Encrypt the file
        addLogLine(`encryptAsset ${fileNameSize}`);
        const encryptedFile = await UploadService.encryptAsset(
            worker,
            fileWithMetadata,
            collection.key
        );

        // If the upload has been cancelled, throw an error
        if (uploadCancelService.isUploadCancelationRequested()) {
            throw Error(CustomError.UPLOAD_CANCELLED);
        }

        // Upload the encrypted file to the bucket
        addLogLine(`uploadToBucket ${fileNameSize}`);
        const backupedFile: BackupedFile = await UploadService.uploadToBucket(
            encryptedFile.file
        );

        // Create an upload file object
        const uploadFile: UploadFile = UploadService.getUploadFile(
            collection,
            backupedFile,
            encryptedFile.fileKey
        );

        // Upload the file
        const uploadedFile = await UploadService.uploadFile(uploadFile);

        // Increase the number of files uploaded and log the success
        UIService.increaseFileUploaded();
        addLogLine(`${fileNameSize} successfully uploaded`);

        // Return the uploaded file and the upload result
        return {
            fileUploadResult: metadata.hasStaticThumbnail
                ? UPLOAD_RESULT.UPLOADED_WITH_STATIC_THUMBNAIL
                : UPLOAD_RESULT.UPLOADED,
            uploadedFile: uploadedFile,
        };
    } catch (e) {
        // Handle any errors that occur during the upload process
        addLogLine(`upload failed for  ${fileNameSize} ,error: ${e.message}`);
        if (
            e.message !== CustomError.UPLOAD_CANCELLED &&
            e.message !== CustomError.UNSUPPORTED_FILE_FORMAT
        ) {
            logError(e, 'file upload failed', {
                fileFormat: fileTypeInfo?.exactType,
                fileSize: convertBytesToHumanReadable(fileSize),
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
