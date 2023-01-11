/* eslint-disable @typescript-eslint/no-unused-vars */
import { EncryptedEnteFile, EnteFile } from 'types/file';
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
import { addToCollection } from 'services/collectionService';
import uploadCancelService from './uploadCancelService';
import { Remote } from 'comlink';
import { DedicatedCryptoWorker } from 'worker/crypto.worker';
import uploadService from './uploadService';
import { FilePublicMagicMetadata } from 'types/magicMetadata';

interface UploadResponse {
    fileUploadResult: UPLOAD_RESULT;
    uploadedFile?: EnteFile | EncryptedEnteFile;
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
    let fileTypeInfo: FileTypeInfo;
    try {
        const fileSize = UploadService.getAssetSize(uploadAsset);
        if (fileSize >= MAX_FILE_SIZE_SUPPORTED) {
            return { fileUploadResult: UPLOAD_RESULT.TOO_LARGE };
        }
        addLogLine(`getting filetype for ${fileNameSize}`);
        fileTypeInfo = await UploadService.getAssetFileType(uploadAsset);
        addLogLine(`got filetype for ${fileNameSize}`);
        if (fileTypeInfo.fileType === FILE_TYPE.OTHERS) {
            throw Error(CustomError.UNSUPPORTED_FILE_FORMAT);
        }
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

        // const matchingExistingFiles = findMatchingExistingFiles(
        //     existingFiles,
        //     metadata
        // );
        // addLocalLog(
        //     () =>
        //         `matchedFileList: ${matchingExistingFiles
        //             .map((f) => `${f.id}-${f.metadata.title}`)
        //             .join(',')}`
        // );
        // if (matchingExistingFiles?.length) {
        //     const matchingExistingFilesCollectionIDs =
        //         matchingExistingFiles.map((e) => e.collectionID);
        //     addLocalLog(
        //         () =>
        //             `matched file collectionIDs:${matchingExistingFilesCollectionIDs}
        //                and collectionID:${collection.id}`
        //     );
        //     if (matchingExistingFilesCollectionIDs.includes(collection.id)) {
        //         addLogLine(
        //             `file already present in the collection , skipped upload for  ${fileNameSize}`
        //         );
        //         const sameCollectionMatchingExistingFile =
        //             matchingExistingFiles.find(
        //                 (f) => f.collectionID === collection.id
        //             );
        //         return {
        //             fileUploadResult: UPLOAD_RESULT.ALREADY_UPLOADED,
        //             uploadedFile: sameCollectionMatchingExistingFile,
        //         };
        //     } else {
        //         addLogLine(
        //             `same file in ${matchingExistingFilesCollectionIDs.length} collection found for  ${fileNameSize}`
        //         );
        //         // any of the matching file can used to add a symlink
        //         const resultFile = Object.assign({}, matchingExistingFiles[0]);
        //         resultFile.collectionID = collection.id;
        //         await addToCollection(collection, [resultFile]);
        //         return {
        //             fileUploadResult: UPLOAD_RESULT.ADDED_SYMLINK,
        //             uploadedFile: resultFile,
        //         };
        //     }
        // }
        if (uploadCancelService.isUploadCancelationRequested()) {
            throw Error(CustomError.UPLOAD_CANCELLED);
        }
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

        // const uploadFile: UploadFile = UploadService.getUploadFile(
        //     collection,
        //     backupedFile,
        //     encryptedFile.fileKey
        // );

        // const uploadedFile = await UploadService.uploadFile(uploadFile);

        UIService.increaseFileUploaded();
        addLogLine(`${fileNameSize} successfully uploaded`);

        const uploadedFile: EncryptedEnteFile = {
            id: Math.random() * 10000,
            ownerID: 1580559962386453,
            collectionID: 1580559962386631,
            encryptedKey:
                'VwW6ArmGLSIgLh6JLbhknstiSzASSS4Ygr97w3VgMBlStFb+zidcBai7vX9fSZYx',
            keyDecryptionNonce: 'mY9ystuE5ZfgLUeuYb5NH0yB18gVpH8Y',
            file: {
                decryptionHeader: 'v/O4qVXAie02fg4mMh053hU77k83AsQr',
                objectKey: null,
            },
            thumbnail: {
                decryptionHeader: '04x+Sxxg3ZyWOn1VSOEvpUDjEks0a7Ja',
                objectKey: null,
            },
            metadata: {
                encryptedData:
                    '6E1ZuQEV/KrhMjTas8u8m0++vFnLPHLtKwlYXquBEjwgIXQiZ0r3hcjmPo6xzu3DU0E9aPQ9lG112oiS1pEgSWK6KVId+YGv2ODp3U4Cb/T4RTvyrL5+9PjCUzY2ME15shkGQcGloDPVq0XQF/zPZ4IDkE2wKB9iKUB/CZB9JmkFoNlpj46HFi2n/es0nlvbOtSyVMqg8a2guvlpq/9E7WPsxTnFXFVc4Fx41OmoRg6f6LnG0+3JzQ0L+zKgC5Iy/TxhrSPnm9WTHOeT9d5Jy6F3w4GcTnC1YE5IKopUA5vqeUjKEuDUWx6JaBevmKiqymcJ47jz2xPYWU0nzP0vXRV6nvgKezsdsqGeeoMl8iNFEDG835E1Rt4PLfgdjmxg09kTzFEx/EZQJ4NVEfA4y5dWvQWAh2+pFSYZMnmn3gwbuhqCyfN5av8=',
                decryptionHeader: 'podr/Vtc7apd549tyHiMRlbxeN9GIgR0',
            },
            isDeleted: false,
            updationTime: 1671097743440929,
            info: {
                fileSize: 5430,
                thumbSize: 1827,
            },
            pubMagicMetadata: null,
            magicMetadata: null,
        };
        return {
            fileUploadResult: UPLOAD_RESULT.UPLOADED,
            uploadedFile: uploadedFile,
        };
        // return {
        //     fileUploadResult: metadata.hasStaticThumbnail
        //         ? UPLOAD_RESULT.UPLOADED_WITH_STATIC_THUMBNAIL
        //         : UPLOAD_RESULT.UPLOADED,
        //     uploadedFile: uploadedFile,
        // };
    } catch (e) {
        addLogLine(`upload failed for  ${fileNameSize} ,error: ${e.message}`);
        if (e.message !== CustomError.UPLOAD_CANCELLED) {
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
