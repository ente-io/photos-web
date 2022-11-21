import { getLocalFiles } from '../fileService';
import { SetFiles } from 'types/gallery';
import { getDedicatedCryptoWorker } from 'utils/crypto';
import {
    sortFiles,
    preservePhotoswipeProps,
    decryptFile,
    getUserOwnedNonTrashedFiles,
} from 'utils/file';
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
import { EnteFile } from 'types/file';
import {
    ElectronFile,
    FileWithCollection,
    Metadata,
    MetadataAndFileTypeInfo,
    MetadataAndFileTypeInfoMap,
    ParsedMetadataJSON,
    ParsedMetadataJSONMap,
} from 'types/upload';
import {
    UPLOAD_RESULT,
    MAX_FILE_SIZE_SUPPORTED,
    UPLOAD_STAGES,
} from 'constants/upload';
import { ComlinkWorker } from 'utils/comlink';
import { FILE_TYPE } from 'constants/file';
import uiService from './uiService';
import { addLogLine, getFileNameSize } from 'utils/logging';
import isElectron from 'is-electron';
import ImportService from 'services/importService';
import watchFolderService from 'services/watchFolder/watchFolderService';
import { ProgressUpdater } from 'types/upload/ui';
import uploadCancelService from './uploadCancelService';

const MAX_CONCURRENT_UPLOADS = 4;
const FILE_UPLOAD_COMPLETED = 100;

class UploadManager {
    private cryptoWorkers = new Array<ComlinkWorker>(MAX_CONCURRENT_UPLOADS);
    private parsedMetadataJSONMap: ParsedMetadataJSONMap;
    private metadataAndFileTypeInfoMap: MetadataAndFileTypeInfoMap;
    private filesToBeUploaded: FileWithCollection[];
    private remainingFiles: FileWithCollection[] = [];
    private failedFiles: FileWithCollection[];
    private existingFiles: EnteFile[];
    private userOwnedNonTrashedExistingFiles: EnteFile[];
    private setFiles: SetFiles;
    private collections: Map<number, Collection>;
    private uploadInProgress: boolean;

    public async init(progressUpdater: ProgressUpdater, setFiles: SetFiles) {
        UIService.init(progressUpdater);
        this.setFiles = setFiles;
        UIService.init(progressUpdater);
        this.setFiles = setFiles;
    }

    public isUploadRunning() {
        return this.uploadInProgress;
    }

    private resetState() {
        this.filesToBeUploaded = [];
        this.remainingFiles = [];
        this.failedFiles = [];
        this.parsedMetadataJSONMap = new Map<string, ParsedMetadataJSON>();
        this.metadataAndFileTypeInfoMap = new Map<
            number,
            MetadataAndFileTypeInfo
        >();
    }

    prepareForNewUpload() {
        this.resetState();
        UIService.reset();
        uploadCancelService.reset();
        UIService.setUploadStage(UPLOAD_STAGES.START);
    }

    async updateExistingFilesAndCollections(collections: Collection[]) {
        this.existingFiles = await getLocalFiles();
        this.userOwnedNonTrashedExistingFiles = getUserOwnedNonTrashedFiles(
            this.existingFiles
        );
        this.collections = new Map(
            collections.map((collection) => [collection.id, collection])
        );
    }

    public async queueFilesForUpload(
        filesWithCollectionToUploadIn: FileWithCollection[],
        collections: Collection[]
    ) {
        try {
            filesWithCollectionToUploadIn.sort(
                (aFileWithCollection, bFileWithCollection) =>
                    (aFileWithCollection.file['path'] as string).localeCompare(
                        bFileWithCollection.file['path'] as string
                    )
            );
            if (this.uploadInProgress) {
                throw Error("can't run multiple uploads at once");
            }
            this.uploadInProgress = true;
            await this.updateExistingFilesAndCollections(collections);
            addLogLine(
                `received ${filesWithCollectionToUploadIn.length} files to upload`
            );
            uiService.setFilenames(
                new Map<number, string>(
                    filesWithCollectionToUploadIn.map((mediaFile) => [
                        mediaFile.localID,
                        UploadService.getAssetName(mediaFile),
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
                UIService.setUploadStage(UPLOAD_STAGES.EXTRACTING_METADATA);
                await this.extractMetadataFromFiles(mediaFiles);

                UploadService.setMetadataAndFileTypeInfoMap(
                    this.metadataAndFileTypeInfoMap
                );

                // filter out files whose metadata detection failed or those that have been skipped because the files are too large,
                // as they will be rejected during upload and are not valid upload files which we need to clustering
                const rejectedFileLocalIDs = new Set(
                    [...this.metadataAndFileTypeInfoMap.entries()].map(
                        ([localID, metadataAndFileTypeInfo]) => {
                            if (
                                !metadataAndFileTypeInfo.metadata ||
                                !metadataAndFileTypeInfo.fileTypeInfo
                            ) {
                                return localID;
                            }
                        }
                    )
                );
                const rejectedFiles = [];
                const filesWithMetadata = [];
                mediaFiles.forEach((m) => {
                    if (rejectedFileLocalIDs.has(m.localID)) {
                        rejectedFiles.push(m);
                    } else {
                        filesWithMetadata.push(m);
                    }
                });

                addLogLine(`clusterLivePhotoFiles started`);

                const analysedMediaFiles =
                    UploadService.clusterLivePhotoFiles(filesWithMetadata);

                addLogLine(`clusterLivePhotoFiles ended`);
                const allFiles = [...rejectedFiles, ...analysedMediaFiles];
                addLogLine(
                    `got live photos: ${mediaFiles.length !== allFiles.length}`
                );
                uiService.setFilenames(
                    new Map<number, string>(
                        allFiles.map((mediaFile) => [
                            mediaFile.localID,
                            UploadService.getAssetName(mediaFile),
                        ])
                    )
                );

                UIService.setHasLivePhoto(
                    mediaFiles.length !== allFiles.length
                );

                await this.uploadMediaFiles(allFiles);
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
                this.cryptoWorkers[i]?.worker.terminate();
            }
            this.uploadInProgress = false;
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
    }

    private async parseMetadataJSONFiles(metadataFiles: FileWithCollection[]) {
        try {
            addLogLine(`parseMetadataJSONFiles function executed `);

            UIService.reset(metadataFiles.length);

            for (const { file, collectionID } of metadataFiles) {
                try {
                    if (uploadCancelService.isUploadCancelationRequested()) {
                        throw Error(CustomError.UPLOAD_CANCELLED);
                    }
                    addLogLine(
                        `parsing metadata json file ${getFileNameSize(file)}`
                    );

                    const parsedMetadataJSONWithTitle = await parseMetadataJSON(
                        file
                    );
                    if (parsedMetadataJSONWithTitle) {
                        const { title, parsedMetadataJSON } =
                            parsedMetadataJSONWithTitle;
                        this.parsedMetadataJSONMap.set(
                            getMetadataJSONMapKey(collectionID, title),
                            parsedMetadataJSON && { ...parsedMetadataJSON }
                        );
                        UIService.increaseFileUploaded();
                    }
                    addLogLine(
                        `successfully parsed metadata json file ${getFileNameSize(
                            file
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
                                file
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

    private async extractMetadataFromFiles(mediaFiles: FileWithCollection[]) {
        try {
            addLogLine(`extractMetadataFromFiles executed`);
            UIService.reset(mediaFiles.length);
            for (const { file, localID, collectionID } of mediaFiles) {
                UIService.setFileProgress(localID, 0);
                if (uploadCancelService.isUploadCancelationRequested()) {
                    throw Error(CustomError.UPLOAD_CANCELLED);
                }
                let fileTypeInfo = null;
                let metadata = null;
                let filePath = null;
                try {
                    addLogLine(
                        `metadata extraction started ${getFileNameSize(file)} `
                    );
                    const result = await this.extractFileTypeAndMetadata(
                        file,
                        collectionID
                    );
                    fileTypeInfo = result.fileTypeInfo;
                    metadata = result.metadata;
                    filePath = result.filePath;
                    addLogLine(
                        `metadata extraction successful${getFileNameSize(
                            file
                        )} `
                    );
                } catch (e) {
                    if (e.message === CustomError.UPLOAD_CANCELLED) {
                        throw e;
                    } else {
                        // and don't break for subsequent files just log and move on
                        logError(e, 'extractFileTypeAndMetadata failed');
                        addLogLine(
                            `metadata extraction failed ${getFileNameSize(
                                file
                            )} error: ${e.message}`
                        );
                    }
                }
                this.metadataAndFileTypeInfoMap.set(localID, {
                    fileTypeInfo: fileTypeInfo && { ...fileTypeInfo },
                    metadata: metadata && { ...metadata },
                    filePath: filePath,
                });
                UIService.removeFromInProgressList(localID);
                UIService.increaseFileUploaded();
            }
        } catch (e) {
            if (e.message !== CustomError.UPLOAD_CANCELLED) {
                logError(e, 'error extracting metadata');
            }
            throw e;
        }
    }

    private async extractFileTypeAndMetadata(
        file: File | ElectronFile,
        collectionID: number
    ) {
        if (file.size >= MAX_FILE_SIZE_SUPPORTED) {
            addLogLine(
                `${getFileNameSize(file)} rejected  because of large size`
            );

            return { fileTypeInfo: null, metadata: null };
        }
        const fileTypeInfo = await UploadService.getFileType(file);
        if (fileTypeInfo.fileType === FILE_TYPE.OTHERS) {
            addLogLine(
                `${getFileNameSize(
                    file
                )} rejected  because of unknown file format`
            );
            return { fileTypeInfo, metadata: null };
        }
        addLogLine(` extracting ${getFileNameSize(file)} metadata`);
        let metadata: Metadata;
        try {
            metadata = await UploadService.extractFileMetadata(
                file,
                collectionID,
                fileTypeInfo
            );
            const filePath = (file as any).path as string;
            return { fileTypeInfo, metadata, filePath };
        } catch (e) {
            logError(e, 'failed to extract file metadata');
            return { fileTypeInfo, metadata: null, filePath: null };
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
            const cryptoWorker = getDedicatedCryptoWorker();
            if (!cryptoWorker) {
                throw Error(CustomError.FAILED_TO_LOAD_WEB_WORKER);
            }
            this.cryptoWorkers[i] = cryptoWorker;
            uploadProcesses.push(
                this.uploadNextFileInQueue(
                    await new this.cryptoWorkers[i].comlink()
                )
            );
        }
        await Promise.all(uploadProcesses);
    }

    private async uploadNextFileInQueue(worker: any) {
        while (this.filesToBeUploaded.length > 0) {
            if (uploadCancelService.isUploadCancelationRequested()) {
                throw Error(CustomError.UPLOAD_CANCELLED);
            }
            let fileWithCollection = this.filesToBeUploaded.pop();
            const { collectionID } = fileWithCollection;
            const collection = this.collections.get(collectionID);
            fileWithCollection = { ...fileWithCollection, collection };
            const { fileUploadResult, uploadedFile } = await uploader(
                worker,
                this.userOwnedNonTrashedExistingFiles,
                fileWithCollection
            );

            const finalUploadResult = await this.postUploadTask(
                fileUploadResult,
                uploadedFile,
                fileWithCollection
            );

            UIService.moveFileToResultList(
                fileWithCollection.localID,
                finalUploadResult
            );
            UploadService.reducePendingUploadCount();
        }
    }

    async postUploadTask(
        fileUploadResult: UPLOAD_RESULT,
        uploadedFile: EnteFile | null,
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
                    decryptedFile = uploadedFile;
                    break;
                case UPLOAD_RESULT.ADDED_SYMLINK:
                    decryptedFile = uploadedFile;
                    fileUploadResult = UPLOAD_RESULT.UPLOADED;
                    break;
                case UPLOAD_RESULT.UPLOADED:
                case UPLOAD_RESULT.UPLOADED_WITH_STATIC_THUMBNAIL:
                    decryptedFile = await decryptFile(
                        uploadedFile,
                        fileWithCollection.collection.key
                    );
                    break;
                case UPLOAD_RESULT.UNSUPPORTED:
                case UPLOAD_RESULT.TOO_LARGE:
                case UPLOAD_RESULT.CANCELLED:
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
                uploadedFile
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
        uploadedFile: EnteFile
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

    async getFailedFilesWithCollections() {
        return {
            files: this.failedFiles,
            collections: [...this.collections.values()],
        };
    }

    private updateExistingFiles(decryptedFile: EnteFile) {
        if (!decryptedFile) {
            throw Error("decrypted file can't be undefined");
        }
        this.userOwnedNonTrashedExistingFiles.push(decryptedFile);
        this.updateUIFiles(decryptedFile);
    }

    private updateUIFiles(decryptedFile: EnteFile) {
        this.existingFiles.push(decryptedFile);
        this.existingFiles = sortFiles(this.existingFiles);
        this.setFiles(preservePhotoswipeProps(this.existingFiles));
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
