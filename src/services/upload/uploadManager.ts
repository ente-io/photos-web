import { getLocalFiles } from '../fileService';
import { SetFiles } from 'types/gallery';
import { decryptFile, getUserOwnedNonTrashedFiles } from 'utils/file';
import { logError } from 'utils/sentry';
import { getMetadataJSONMapKey, parseMetadataJSON } from './metadataService';
import {
    areFileWithCollectionsSame,
    segregateMetadataAndMediaFiles,
} from 'utils/upload';
import uploader from './uploader';
import UIService from './uiService';
import UploadService from './uploadService';
import { CustomError } from 'utils/error';
import { Collection } from 'types/collection';
import { EncryptedEnteFile, EnteFile } from 'types/file';
import {
    FileWithCollection,
    ParsedMetadataJSON,
    ParsedMetadataJSONMap,
    PublicUploadProps,
} from 'types/upload';

import { UPLOAD_RESULT, UPLOAD_STAGES } from 'constants/upload';
import uiService from './uiService';
import { addLogLine, getFileNameSize } from 'utils/logging';
import isElectron from 'is-electron';
import ImportService from 'services/importService';
import watchFolderService from 'services/watchFolder/watchFolderService';
import { ProgressUpdater } from 'types/upload/ui';
import uploadCancelService from './uploadCancelService';
import { DedicatedCryptoWorker } from 'worker/crypto.worker';
import { ComlinkWorker } from 'utils/comlink/comlinkWorker';
import { Remote } from 'comlink';
import {
    getLocalPublicFiles,
    getPublicCollectionUID,
} from 'services/publicCollectionService';
import { getDedicatedCryptoWorker } from 'utils/comlink/ComlinkCryptoWorker';
import uploadService from './uploadService';

const MAX_CONCURRENT_UPLOADS = 4;
const FILE_UPLOAD_COMPLETED = 100;

class UploadManager {
    private cryptoWorkers = new Array<
        ComlinkWorker<typeof DedicatedCryptoWorker>
    >(MAX_CONCURRENT_UPLOADS);
    private parsedMetadataJSONMap: ParsedMetadataJSONMap;
    private filesToBeUploaded: FileWithCollection[];
    private remainingFiles: FileWithCollection[] = [];
    private failedFiles: FileWithCollection[];
    private setFiles: SetFiles;
    private collections: Collection[] = [];
    private collectionsMap: Map<number, Collection> = new Map();
    private uploadInProgress: boolean;
    private publicUploadProps: PublicUploadProps;
    private uploaderName: string;

    public async init(
        progressUpdater: ProgressUpdater,
        setFiles: SetFiles,
        publicCollectProps: PublicUploadProps
    ) {
        UIService.init(progressUpdater);
        UploadService.init(publicCollectProps);
        this.setFiles = setFiles;
        this.publicUploadProps = publicCollectProps;
    }

    public isUploadRunning() {
        return this.uploadInProgress;
    }

    private resetState() {
        this.filesToBeUploaded = [];
        this.remainingFiles = [];
        this.failedFiles = [];
        this.parsedMetadataJSONMap = new Map<string, ParsedMetadataJSON>();

        this.uploaderName = null;
    }

    prepareForNewUpload() {
        this.resetState();
        UIService.reset();
        uploadCancelService.reset();
        UIService.setUploadStage(UPLOAD_STAGES.START);
    }

    async updateExistingFilesAndCollections(collections: Collection[]) {
        if (this.publicUploadProps.accessedThroughSharedURL) {
            uploadService.setExistingFiles(
                await getLocalPublicFiles(
                    getPublicCollectionUID(this.publicUploadProps.token)
                )
            );
        } else {
            uploadService.setExistingFiles(
                getUserOwnedNonTrashedFiles(await getLocalFiles())
            );
        }
        if (collections) {
            UploadService.setExistingCollection(collections);
        }
    }

    public async queueFilesForUpload(
        filesWithCollectionToUploadIn: FileWithCollection[],
        collections?: Collection[],
        uploaderName?: string
    ) {
        try {
            if (this.uploadInProgress) {
                throw Error("can't run multiple uploads at once");
            }
            this.uploadInProgress = true;
            await this.updateExistingFilesAndCollections(collections);
            this.uploaderName = uploaderName;
            addLogLine(
                `received ${filesWithCollectionToUploadIn.length} files to upload`
            );
            uiService.setFilenames(
                new Map<number, string>(
                    filesWithCollectionToUploadIn.map(({ uploadAsset }) => [
                        uploadAsset.localID,
                        UploadService.getAssetName(uploadAsset),
                    ])
                )
            );
            const { metadataJSONFiles, mediaFiles } =
                segregateMetadataAndMediaFiles(filesWithCollectionToUploadIn);
            addLogLine(`has ${metadataJSONFiles.length} metadata json files`);
            addLogLine(`has ${mediaFiles.length} media files`);
            if (metadataJSONFiles.length) {
                UIService.setUploadStage(
                    UPLOAD_STAGES.READING_GOOGLE_METADATA_FILES
                );
                await this.parseMetadataJSONFiles(metadataJSONFiles);

                UploadService.setParsedMetadataJSONMap(
                    this.parsedMetadataJSONMap
                );
            }
            if (mediaFiles.length) {
                addLogLine(`clusterLivePhotoFiles started`);
                const analysedMediaFiles =
                    await UploadService.clusterLivePhotoFiles(mediaFiles);
                addLogLine(`clusterLivePhotoFiles ended`);
                addLogLine(
                    `got live photos: ${
                        mediaFiles.length !== analysedMediaFiles.length
                    }`
                );
                uiService.setFilenames(
                    new Map<number, string>(
                        analysedMediaFiles.map(({ uploadAsset }) => [
                            uploadAsset.localID,
                            UploadService.getAssetName(uploadAsset),
                        ])
                    )
                );

                UIService.setHasLivePhoto(
                    mediaFiles.length !== analysedMediaFiles.length
                );

                collections = await this.uploadMediaFiles(analysedMediaFiles);
            }
            if (isElectron()) {
                if (watchFolderService.isUploadRunning()) {
                    await watchFolderService.allFileUploadsDone(
                        filesWithCollectionToUploadIn,
                        collections
                    );
                } else if (watchFolderService.isSyncPaused()) {
                    // resume the service after user upload is done
                    watchFolderService.resumePausedSync();
                }
            }
            try {
                if (!UIService.hasFilesInResultList()) {
                    return true;
                } else {
                    return false;
                }
            } catch (e) {
                logError(e, ' failed to return shouldCloseProgressBar');
                return false;
            }
        } catch (e) {
            if (e.message === CustomError.UPLOAD_CANCELLED) {
                if (isElectron()) {
                    ImportService.cancelRemainingUploads();
                }
            } else {
                logError(e, 'uploading failed with error');
                throw e;
            }
        } finally {
            UIService.setUploadStage(UPLOAD_STAGES.FINISH);
            UIService.setPercentComplete(FILE_UPLOAD_COMPLETED);
            for (let i = 0; i < MAX_CONCURRENT_UPLOADS; i++) {
                this.cryptoWorkers[i]?.terminate();
            }
            this.uploadInProgress = false;
        }
    }

    private async parseMetadataJSONFiles(metadataFiles: FileWithCollection[]) {
        try {
            addLogLine(`parseMetadataJSONFiles function executed `);

            UIService.reset(metadataFiles.length);

            for (const fileWithCollection of metadataFiles) {
                try {
                    if (uploadCancelService.isUploadCancelationRequested()) {
                        throw Error(CustomError.UPLOAD_CANCELLED);
                    }
                    addLogLine(
                        `parsing metadata json file ${getFileNameSize(
                            fileWithCollection.uploadAsset.file
                        )}`
                    );

                    const parsedMetadataJSONWithTitle = await parseMetadataJSON(
                        fileWithCollection.uploadAsset.file
                    );
                    if (parsedMetadataJSONWithTitle) {
                        const { title, parsedMetadataJSON } =
                            parsedMetadataJSONWithTitle;
                        this.parsedMetadataJSONMap.set(
                            getMetadataJSONMapKey(
                                fileWithCollection.collectionID ??
                                    fileWithCollection.collectionName,
                                title
                            ),
                            parsedMetadataJSON && { ...parsedMetadataJSON }
                        );
                        UIService.increaseFileUploaded();
                    }
                    addLogLine(
                        `successfully parsed metadata json file ${getFileNameSize(
                            fileWithCollection.uploadAsset.file
                        )}`
                    );
                } catch (e) {
                    if (e.message === CustomError.UPLOAD_CANCELLED) {
                        throw e;
                    } else {
                        // and don't break for subsequent files just log and move on
                        logError(e, 'parsing failed for a file');
                        addLogLine(
                            `failed to parse metadata json file ${getFileNameSize(
                                fileWithCollection.uploadAsset.file
                            )} error: ${e.message}`
                        );
                    }
                }
            }
        } catch (e) {
            if (e.message !== CustomError.UPLOAD_CANCELLED) {
                logError(e, 'error seeding MetadataMap');
            }
            throw e;
        }
    }

    private async uploadMediaFiles(mediaFiles: FileWithCollection[]) {
        addLogLine(`uploadMediaFiles called`);
        this.filesToBeUploaded = [...this.filesToBeUploaded, ...mediaFiles];

        if (isElectron()) {
            this.remainingFiles = [...this.remainingFiles, ...mediaFiles];
        }

        UIService.reset(mediaFiles.length);

        await UploadService.setFileCount(mediaFiles.length);

        UIService.setUploadStage(UPLOAD_STAGES.UPLOADING);

        const uploadProcesses = [];
        for (
            let i = 0;
            i < MAX_CONCURRENT_UPLOADS && this.filesToBeUploaded.length > 0;
            i++
        ) {
            this.cryptoWorkers[i] = getDedicatedCryptoWorker();
            const worker = await new this.cryptoWorkers[i].remote();
            uploadProcesses.push(this.uploadNextFileInQueue(worker));
        }
        return await Promise.all(uploadProcesses);
    }

    private async uploadNextFileInQueue(worker: Remote<DedicatedCryptoWorker>) {
        const createdCollections: Collection[] = [];
        while (this.filesToBeUploaded.length > 0) {
            if (uploadCancelService.isUploadCancelationRequested()) {
                throw Error(CustomError.UPLOAD_CANCELLED);
            }
            const fileWithPossibleCollectionID = this.filesToBeUploaded.pop();
            let fileWithCollection: FileWithCollection;
            if (fileWithPossibleCollectionID.collectionID) {
                const collection = this.collectionsMap.get(
                    fileWithPossibleCollectionID.collectionID
                );
                fileWithCollection = {
                    uploadAsset: fileWithPossibleCollectionID.uploadAsset,
                    collection: collection,
                };
            } else {
                fileWithCollection = fileWithPossibleCollectionID;
            }

            const { fileUploadResult, uploadedFile, createdCollection } =
                await uploader(
                    worker,
                    fileWithCollection,
                    this.uploaderName,
                    this.publicUploadProps?.accessedThroughSharedURL
                );

            if (createdCollection) {
                createdCollections.push(createdCollection);
                this.collections.push(createdCollection);
                this.collectionsMap.set(
                    createdCollection.id,
                    createdCollection
                );
                fileWithCollection.collection = createdCollection;
            }

            const finalUploadResult = await this.postUploadTask(
                fileUploadResult,
                uploadedFile,
                fileWithCollection
            );

            UIService.moveFileToResultList(
                fileWithCollection.uploadAsset.localID,
                finalUploadResult
            );
            UploadService.reducePendingUploadCount();
        }
        return createdCollections;
    }

    async postUploadTask(
        fileUploadResult: UPLOAD_RESULT,
        uploadedFile: EncryptedEnteFile | EnteFile | null,
        fileWithCollection: FileWithCollection
    ) {
        try {
            let decryptedFile: EnteFile;
            addLogLine(
                `post upload action -> fileUploadResult: ${fileUploadResult} uploadedFile present ${!!uploadedFile}`
            );
            this.updateElectronRemainingFiles(fileWithCollection);
            switch (fileUploadResult) {
                case UPLOAD_RESULT.FAILED:
                case UPLOAD_RESULT.BLOCKED:
                    this.failedFiles.push(fileWithCollection);
                    break;
                case UPLOAD_RESULT.ALREADY_UPLOADED:
                    decryptedFile = uploadedFile as EnteFile;
                    break;
                case UPLOAD_RESULT.ADDED_SYMLINK:
                    decryptedFile = uploadedFile as EnteFile;
                    fileUploadResult = UPLOAD_RESULT.UPLOADED;
                    break;
                case UPLOAD_RESULT.UPLOADED:
                case UPLOAD_RESULT.UPLOADED_WITH_STATIC_THUMBNAIL:
                    decryptedFile = await decryptFile(
                        uploadedFile as EncryptedEnteFile,
                        fileWithCollection.collection.key
                    );
                    break;
                case UPLOAD_RESULT.UNSUPPORTED:
                case UPLOAD_RESULT.TOO_LARGE:
                case UPLOAD_RESULT.CANCELLED:
                case UPLOAD_RESULT.SKIPPED_VIDEOS:
                    // no-op
                    break;
                default:
                    throw Error('Invalid Upload Result' + fileUploadResult);
            }
            if (
                [
                    UPLOAD_RESULT.ADDED_SYMLINK,
                    UPLOAD_RESULT.UPLOADED,
                    UPLOAD_RESULT.UPLOADED_WITH_STATIC_THUMBNAIL,
                ].includes(fileUploadResult)
            ) {
                this.updateExistingFiles(decryptedFile);
            }
            await this.watchFolderCallback(
                fileUploadResult,
                fileWithCollection,
                uploadedFile as EncryptedEnteFile
            );
            return fileUploadResult;
        } catch (e) {
            logError(e, 'failed to do post file upload action');
            return UPLOAD_RESULT.FAILED;
        }
    }

    private async watchFolderCallback(
        fileUploadResult: UPLOAD_RESULT,
        fileWithCollection: FileWithCollection,
        uploadedFile: EncryptedEnteFile
    ) {
        if (isElectron()) {
            await watchFolderService.onFileUpload(
                fileUploadResult,
                fileWithCollection,
                uploadedFile
            );
        }
    }

    public cancelRunningUpload() {
        addLogLine('user cancelled running upload');
        UIService.setUploadStage(UPLOAD_STAGES.CANCELLING);
        uploadCancelService.requestUploadCancelation();
    }

    getFailedFilesWithCollections() {
        return {
            files: this.failedFiles,
            collections: [...this.collections.values()],
        };
    }

    getUploaderName() {
        return this.uploaderName;
    }

    private updateExistingFiles(decryptedFile: EnteFile) {
        if (!decryptedFile) {
            throw Error("decrypted file can't be undefined");
        }
        this.updateUIFiles(decryptedFile);
    }

    private updateUIFiles(decryptedFile: EnteFile) {
        this.setFiles((existingFiles) => [...existingFiles, decryptedFile]);
    }

    private updateElectronRemainingFiles(
        fileWithCollection: FileWithCollection
    ) {
        if (isElectron()) {
            this.remainingFiles = this.remainingFiles.filter(
                (file) => !areFileWithCollectionsSame(file, fileWithCollection)
            );
            ImportService.updatePendingUploads(this.remainingFiles);
        }
    }

    public shouldAllowNewUpload = () => {
        return !this.uploadInProgress || watchFolderService.isUploadRunning();
    };
}

export default new UploadManager();
