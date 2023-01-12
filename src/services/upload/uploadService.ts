import { Collection } from 'types/collection';
import { logError } from 'utils/sentry';
import UploadHttpClient from './uploadHttpClient';
import { extractFileMetadata, getFilename } from './fileService';
import { getFileType } from '../typeDetectionService';
import { CustomError, handleUploadError } from 'utils/error';
import {
    BackupedFile,
    EncryptedFile,
    FileTypeInfo,
    FileWithCollection,
    FileWithMetadata,
    isDataStream,
    isLivePhotoUploadAsset,
    Metadata,
    ParsedMetadataJSON,
    ParsedMetadataJSONMap,
    ProcessedFile,
    PublicUploadProps,
    UploadAsset,
    UploadFile,
    UploadURL,
} from 'types/upload';
import {
    clusterLivePhotoFiles,
    extractLivePhotoMetadata,
    getLivePhotoFileType,
    getLivePhotoName,
    getLivePhotoSize,
    readLivePhoto,
} from './livePhotoService';
import { encryptFile, getFileSize, readFile } from './fileService';
import { uploadStreamUsingMultipart } from './multiPartUploadService';
import UIService from './uiService';
import { USE_CF_PROXY } from 'constants/upload';
import { Remote } from 'comlink';
import { DedicatedCryptoWorker } from 'worker/crypto.worker';
import publicUploadHttpClient from './publicUploadHttpClient';
import { constructPublicMagicMetadata } from './magicMetadataService';
import { FilePublicMagicMetadataProps } from 'types/magicMetadata';
import { B64EncryptionResult } from 'types/crypto';
import QueueProcessor from 'services/queueProcessor';
import { createAlbum } from 'services/collectionService';
import { EnteFile } from 'types/file';
import { findMatchingExistingFiles } from 'utils/upload';

class UploadService {
    private uploadURLs: UploadURL[] = [];
    private parsedMetadataJSONMap: ParsedMetadataJSONMap = new Map<
        string,
        ParsedMetadataJSON
    >();

    private uploaderName: string;

    private pendingUploadCount: number = 0;

    private publicUploadProps: PublicUploadProps = undefined;

    private existingCollections: Collection[] = [];

    private existingFiles: EnteFile[] = [];

    private newCollectionCreator: QueueProcessor<Collection> =
        new QueueProcessor<Collection>(1);

    init(publicUploadProps: PublicUploadProps) {
        this.publicUploadProps = publicUploadProps;
    }

    async setFileCount(fileCount: number) {
        this.pendingUploadCount = fileCount;
        this.preFetchUploadURLs();
    }

    setParsedMetadataJSONMap(parsedMetadataJSONMap: ParsedMetadataJSONMap) {
        this.parsedMetadataJSONMap = parsedMetadataJSONMap;
    }

    setUploaderName(uploaderName: string) {
        this.uploaderName = uploaderName;
    }

    getUploaderName() {
        return this.uploaderName;
    }

    reducePendingUploadCount() {
        this.pendingUploadCount--;
    }

    getAssetSize(uploadAsset: UploadAsset) {
        return isLivePhotoUploadAsset(uploadAsset)
            ? getLivePhotoSize(uploadAsset.livePhotoAssets)
            : getFileSize(uploadAsset.file);
    }

    getAssetName(uploadAsset: UploadAsset) {
        return isLivePhotoUploadAsset(uploadAsset)
            ? getLivePhotoName(uploadAsset.livePhotoAssets)
            : getFilename(uploadAsset.file);
    }

    getAssetFileType(uploadAsset: UploadAsset) {
        return isLivePhotoUploadAsset(uploadAsset)
            ? getLivePhotoFileType(uploadAsset.livePhotoAssets)
            : getFileType(uploadAsset.file);
    }

    async readAsset(fileTypeInfo: FileTypeInfo, uploadAsset: UploadAsset) {
        return isLivePhotoUploadAsset(uploadAsset)
            ? await readLivePhoto(fileTypeInfo, uploadAsset.livePhotoAssets)
            : await readFile(fileTypeInfo, uploadAsset.file);
    }

    async extractAssetMetadata(
        worker: Remote<DedicatedCryptoWorker>,
        { uploadAsset, collectionID, collectionName }: FileWithCollection,
        fileTypeInfo: FileTypeInfo
    ): Promise<Metadata> {
        return isLivePhotoUploadAsset(uploadAsset)
            ? extractLivePhotoMetadata(
                  worker,
                  this.parsedMetadataJSONMap,
                  uploadAsset.livePhotoAssets,
                  collectionID ?? collectionName,
                  fileTypeInfo
              )
            : await extractFileMetadata(
                  worker,
                  this.parsedMetadataJSONMap,
                  uploadAsset.file,
                  collectionID ?? collectionName,
                  fileTypeInfo
              );
    }

    clusterLivePhotoFiles(mediaFiles: FileWithCollection[]) {
        return clusterLivePhotoFiles(mediaFiles);
    }

    constructPublicMagicMetadata(
        publicMagicMetadataProps: FilePublicMagicMetadataProps
    ) {
        return constructPublicMagicMetadata(publicMagicMetadataProps);
    }

    async encryptAsset(
        worker: Remote<DedicatedCryptoWorker>,
        file: FileWithMetadata,
        encryptionKey: string
    ): Promise<EncryptedFile> {
        return encryptFile(worker, file, encryptionKey);
    }

    async uploadToBucket(file: ProcessedFile): Promise<BackupedFile> {
        try {
            let fileObjectKey: string = null;
            if (isDataStream(file.file.encryptedData)) {
                fileObjectKey = await uploadStreamUsingMultipart(
                    file.localID,
                    file.file.encryptedData
                );
            } else {
                const progressTracker = UIService.trackUploadProgress(
                    file.localID
                );
                const fileUploadURL = await this.getUploadURL();
                if (USE_CF_PROXY) {
                    fileObjectKey = await UploadHttpClient.putFileV2(
                        fileUploadURL,
                        file.file.encryptedData as Uint8Array,
                        progressTracker
                    );
                } else {
                    fileObjectKey = await UploadHttpClient.putFile(
                        fileUploadURL,
                        file.file.encryptedData as Uint8Array,
                        progressTracker
                    );
                }
            }
            const thumbnailUploadURL = await this.getUploadURL();
            let thumbnailObjectKey: string = null;
            if (USE_CF_PROXY) {
                thumbnailObjectKey = await UploadHttpClient.putFileV2(
                    thumbnailUploadURL,
                    file.thumbnail.encryptedData,
                    null
                );
            } else {
                thumbnailObjectKey = await UploadHttpClient.putFile(
                    thumbnailUploadURL,
                    file.thumbnail.encryptedData,
                    null
                );
            }

            const backupedFile: BackupedFile = {
                file: {
                    decryptionHeader: file.file.decryptionHeader,
                    objectKey: fileObjectKey,
                },
                thumbnail: {
                    decryptionHeader: file.thumbnail.decryptionHeader,
                    objectKey: thumbnailObjectKey,
                },
                metadata: file.metadata,
                pubMagicMetadata: file.pubMagicMetadata,
            };
            return backupedFile;
        } catch (e) {
            if (e.message !== CustomError.UPLOAD_CANCELLED) {
                logError(e, 'error uploading to bucket');
            }
            throw e;
        }
    }

    getUploadFile(
        collection: Collection,
        backupedFile: BackupedFile,
        fileKey: B64EncryptionResult
    ): UploadFile {
        const uploadFile: UploadFile = {
            collectionID: collection.id,
            encryptedKey: fileKey.encryptedData,
            keyDecryptionNonce: fileKey.nonce,
            ...backupedFile,
        };
        uploadFile;
        return uploadFile;
    }

    private async getUploadURL() {
        if (this.uploadURLs.length === 0 && this.pendingUploadCount) {
            await this.fetchUploadURLs();
        }
        return this.uploadURLs.pop();
    }

    public async preFetchUploadURLs() {
        try {
            await this.fetchUploadURLs();
            // checking for any subscription related errors
        } catch (e) {
            logError(e, 'prefetch uploadURL failed');
            handleUploadError(e);
        }
    }

    async uploadFile(uploadFile: UploadFile) {
        if (this.publicUploadProps.accessedThroughSharedURL) {
            return publicUploadHttpClient.uploadFile(
                uploadFile,
                this.publicUploadProps.token,
                this.publicUploadProps.passwordToken
            );
        } else {
            return UploadHttpClient.uploadFile(uploadFile);
        }
    }

    private async fetchUploadURLs() {
        if (this.publicUploadProps.accessedThroughSharedURL) {
            await publicUploadHttpClient.fetchUploadURLs(
                this.pendingUploadCount,
                this.uploadURLs,
                this.publicUploadProps.token,
                this.publicUploadProps.passwordToken
            );
        } else {
            await UploadHttpClient.fetchUploadURLs(
                this.pendingUploadCount,
                this.uploadURLs
            );
        }
    }

    setExistingCollection(collections: Collection[]) {
        this.existingCollections = collections;
    }

    setExistingFiles(files: EnteFile[]) {
        this.existingFiles = files;
    }

    async createUploadCollection(collectionName: string): Promise<Collection> {
        const collection = await this.newCollectionCreator.queueUpRequest(() =>
            createAlbum(collectionName, this.existingCollections)
        ).promise;
        this.existingCollections.push(collection);
        return collection;
    }

    findUploadFileMatchingExistingFiles(metadata: Metadata): EnteFile[] {
        return findMatchingExistingFiles(this.existingFiles, metadata);
    }
}

export default new UploadService();
