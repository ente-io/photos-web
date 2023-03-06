import { ICollectionNamer } from 'components/Collections/CollectionNamer';
import { ICollectionSelector } from 'components/Collections/CollectionSelector';
import { IUploadStrategyChoiceModal } from 'components/Upload/UploadStrategyChoiceModal';
import { IUploadTypeSelector } from 'components/Upload/UploadTypeSelector';
import { IUserNameInputDialog } from 'components/UserNameInputDialog';
import {
    PICKED_UPLOAD_TYPE,
    UPLOAD_STAGES,
    UPLOAD_STRATEGY,
} from 'constants/upload';
import isElectron from 'is-electron';
import { syncCollections, createAlbum } from 'services/collectionService';

import watchFolderService from 'services/watchFolder/watchFolderService';
import { Collection } from 'types/collection';
import { DialogBoxAttributes } from 'types/dialogBox';
import { SetCollections, UploadTypeSelectorIntent } from 'types/gallery';
import {
    ElectronFile,
    FileWithCollection,
    ImportSuggestion,
} from 'types/upload';
import { getUserOwnedCollections } from 'utils/collection';
import { downloadApp, waitAndRun } from 'utils/common';
import { addLogLine } from 'utils/logging';
import { logError } from 'utils/sentry';
import constants from 'utils/strings/constants';
import { getDownloadAppMessage } from 'utils/ui';
import {
    filterOutSystemFiles,
    getImportSuggestion,
    groupFilesBasedOnParentFolder,
    handleUpload,
} from 'utils/upload';
import { isCanvasBlocked } from 'utils/upload/isCanvasBlocked';
import uiService from './uiService';
import uploadManager from './uploadManager';

const FIRST_ALBUM_NAME = 'My First Album';

class UploadController {
    uploadTypeSelector: IUploadTypeSelector;
    openFileSelector: () => Promise<File[]>;
    openFolderSelector: () => Promise<File[]>;
    setDialogMessage: (message: DialogBoxAttributes) => void;
    userNameInputDialog: IUserNameInputDialog;
    collectionSelector: ICollectionSelector;
    publicProps: {
        collection: Collection;
        token: string;
    };
    isFirstUpload: boolean;
    uploadStrategyChoiceModal: IUploadStrategyChoiceModal;
    setCollections: SetCollections;
    setUploadProgressView: (value: boolean) => void;
    setShouldDisableDropzone: (shouldDisable: boolean) => void;
    collectionNamer: ICollectionNamer;
    currentUploadPromise: Promise<void>;
    syncWithRemote: (force?: boolean, silent?: boolean) => Promise<void>;
    showUserFacingError: (error: string) => void;
    setLoading: (value: boolean) => void;

    init(
        uploadTypeSelector: IUploadTypeSelector,
        openFileSelector: () => Promise<File[]>,
        openFolderSelector: () => Promise<File[]>,
        setDialogMessage: (message: DialogBoxAttributes) => void,
        userNameInputDialog: IUserNameInputDialog,
        collectionSelector: ICollectionSelector,
        uploadStrategyChoiceModal: IUploadStrategyChoiceModal,
        setCollections: SetCollections,
        setUploadProgressView: (value: boolean) => void,
        setShouldDisableDropzone: (shouldDisable: boolean) => void,
        collectionNamer: ICollectionNamer,
        syncWithRemote: (force?: boolean, silent?: boolean) => Promise<void>,
        showUserFacingError: (error: string) => void,
        setLoading: (value: boolean) => void
    ) {
        this.openFileSelector = openFileSelector;
        this.openFolderSelector = openFolderSelector;
        this.uploadTypeSelector = uploadTypeSelector;
        this.setDialogMessage = setDialogMessage;
        this.userNameInputDialog = userNameInputDialog;
        this.collectionSelector = collectionSelector;
        this.uploadStrategyChoiceModal = uploadStrategyChoiceModal;
        this.setCollections = setCollections;
        this.setUploadProgressView = setUploadProgressView;
        this.setShouldDisableDropzone = setShouldDisableDropzone;
        this.collectionNamer = collectionNamer;
        this.syncWithRemote = syncWithRemote;
        this.showUserFacingError = showUserFacingError;
        this.setLoading = setLoading;
    }

    async openUploader(
        uploadTypeSelectorIntent: UploadTypeSelectorIntent,
        isFirstUpload?: boolean
    ) {
        this.isFirstUpload = isFirstUpload;

        const pickedUploadType = await this.uploadTypeSelector.show({
            intent: uploadTypeSelectorIntent,
        });
        switch (pickedUploadType) {
            case PICKED_UPLOAD_TYPE.FILES:
                handleUpload(PICKED_UPLOAD_TYPE.FILES);
                break;
            case PICKED_UPLOAD_TYPE.FOLDERS:
                handleUpload(PICKED_UPLOAD_TYPE.FOLDERS);
                break;
            case PICKED_UPLOAD_TYPE.ZIPS:
                handleUpload(PICKED_UPLOAD_TYPE.ZIPS);
                break;
            default:
                break;
        }
    }

    handleWebUpload = async (type: PICKED_UPLOAD_TYPE) => {
        let files: File[];
        if (type === PICKED_UPLOAD_TYPE.ZIPS) {
            this.setDialogMessage(getDownloadAppMessage());
            return;
        }
        if (type === PICKED_UPLOAD_TYPE.FILES) {
            files = await this.openFileSelector();
        } else {
            files = await this.openFolderSelector();
        }
        this.preprocessAndUploadFiles(files, type);
    };

    preprocessAndUploadFiles = async (
        files: File[] | ElectronFile[],
        pickedUploadType: PICKED_UPLOAD_TYPE
    ) => {
        addLogLine(
            ` upload request type: ${pickedUploadType} count ${files.length}`
        );
        if (uploadManager.isUploadRunning()) {
            if (watchFolderService.isUploadRunning()) {
                addLogLine(
                    'watchFolder upload was running, pausing it to run user upload'
                );
                // pause watch folder service on user upload
                watchFolderService.pauseRunningSync();
            } else {
                addLogLine(
                    'an upload is already running, rejecting new upload request'
                );
                // no-op
                // a user upload is already in progress
                return;
            }
        }
        if (isCanvasBlocked()) {
            addLogLine('canvas blocked, blocking upload');
            this.setDialogMessage({
                title: constants.CANVAS_BLOCKED_TITLE,

                content: constants.CANVAS_BLOCKED_MESSAGE(),
                close: { text: constants.CLOSE },
                proceed: {
                    text: constants.DOWNLOAD,
                    action: downloadApp,
                    variant: 'accent',
                },
            });
            return;
        }

        uploadManager.setUploadRunning(true);
        this.setLoading(true);

        const toUploadFiles = filterOutSystemFiles(files);
        if (toUploadFiles.length === 0) {
            this.setLoading(false);
            return;
        }

        const importSuggestion = getImportSuggestion(
            pickedUploadType,
            toUploadFiles
        );

        this.handleCollectionCreationAndUpload(
            toUploadFiles,
            importSuggestion,
            pickedUploadType
        );
        this.setLoading(false);
    };

    preCollectionCreationAction = async () => {
        this.setShouldDisableDropzone(!uploadManager.shouldAllowNewUpload());
        uiService.setUploadStage(UPLOAD_STAGES.START);
        this.setUploadProgressView(true);
    };

    handleCollectionCreationAndUpload = async (
        toUploadFiles: File[] | ElectronFile[],
        importSuggestion: ImportSuggestion,
        pickedUploadType: PICKED_UPLOAD_TYPE
    ) => {
        try {
            if (isElectron() && pickedUploadType === PICKED_UPLOAD_TYPE.ZIPS) {
                addLogLine('uploading zip files');
                this.uploadFilesToNewCollections(
                    toUploadFiles,
                    UPLOAD_STRATEGY.COLLECTION_PER_FOLDER
                );
                return;
            }

            if (this.isFirstUpload && !importSuggestion.rootFolderName) {
                importSuggestion.rootFolderName = FIRST_ALBUM_NAME;
            }
            let showNextModal = () => {};
            if (importSuggestion.hasNestedFolders) {
                addLogLine(`nested folders detected`);
                showNextModal = async () => {
                    const choice = await this.uploadStrategyChoiceModal.show();
                    if (choice === UPLOAD_STRATEGY.COLLECTION_PER_FOLDER) {
                        this.uploadFilesToNewCollections(
                            toUploadFiles,
                            UPLOAD_STRATEGY.COLLECTION_PER_FOLDER
                        );
                    } else if (choice === UPLOAD_STRATEGY.SINGLE_COLLECTION) {
                        this.uploadFilesToNewCollections(
                            toUploadFiles,
                            UPLOAD_STRATEGY.SINGLE_COLLECTION,
                            importSuggestion.rootFolderName
                        );
                    }
                };
            } else {
                showNextModal = () =>
                    this.uploadToSingleNewCollection(
                        toUploadFiles,
                        importSuggestion.rootFolderName
                    );
            }

            const collection = await this.collectionSelector.show({
                title: constants.UPLOAD_TO_COLLECTION,
                showNextModal,
            });
            if (collection) {
                addLogLine(
                    `uploading files to an existing collection - ${collection.name} - ${collection.id}`
                );
                this.uploadFilesToExistingCollection(toUploadFiles, collection);
            }
        } catch (e) {
            logError(e, 'handleCollectionCreationAndUpload failed');
        }
    };

    uploadFilesToNewCollections = async (
        toUploadFiles: File[] | ElectronFile[],
        strategy: UPLOAD_STRATEGY,
        collectionName?: string
    ) => {
        try {
            addLogLine(
                `upload file to an new collections strategy:${strategy} ,collectionName:${collectionName}`
            );
            await this.preCollectionCreationAction();
            let filesWithCollectionToUpload: FileWithCollection[] = [];
            const collections: Collection[] = [];
            let collectionNameToFilesMap = new Map<
                string,
                (File | ElectronFile)[]
            >();
            if (strategy === UPLOAD_STRATEGY.SINGLE_COLLECTION) {
                collectionNameToFilesMap.set(collectionName, toUploadFiles);
            } else {
                collectionNameToFilesMap =
                    groupFilesBasedOnParentFolder(toUploadFiles);
            }
            addLogLine(
                `upload collections - [${[...collectionNameToFilesMap.keys()]}]`
            );
            try {
                const existingCollection = getUserOwnedCollections(
                    await syncCollections()
                );
                let index = 0;
                for (const [
                    collectionName,
                    files,
                ] of collectionNameToFilesMap) {
                    const collection = await createAlbum(
                        collectionName,
                        existingCollection
                    );
                    collections.push(collection);
                    this.setCollections([
                        ...existingCollection,
                        ...collections,
                    ]);
                    filesWithCollectionToUpload = [
                        ...filesWithCollectionToUpload,
                        ...files.map((file) => ({
                            localID: index++,
                            collectionID: collection.id,
                            file,
                        })),
                    ];
                }
            } catch (e) {
                this.setUploadProgressView(false);
                logError(e, 'Failed to create album');
                this.setDialogMessage({
                    title: constants.ERROR,

                    close: { variant: 'danger' },
                    content: constants.CREATE_ALBUM_FAILED,
                });
                throw e;
            }
            this.waitInQueueAndUploadFiles(
                filesWithCollectionToUpload,
                collections
            );
        } catch (e) {
            logError(e, 'Failed to upload files to new collections');
        }
    };

    uploadToSingleNewCollection = async (
        toUploadFiles: File[] | ElectronFile[],
        collectionName: string
    ) => {
        if (!collectionName) {
            collectionName = await this.collectionNamer.show({
                title: constants.CREATE_COLLECTION,
                buttonText: constants.CREATE,
                autoFilledName: null,
            });
        }
        addLogLine(`upload to single collection - "${collectionName}"`);
        this.uploadFilesToNewCollections(
            toUploadFiles,
            UPLOAD_STRATEGY.SINGLE_COLLECTION,
            collectionName
        );
    };

    uploadFilesToExistingCollection = async (
        toUploadFiles: File[] | ElectronFile[],
        collection: Collection,
        uploaderName?: string
    ) => {
        try {
            addLogLine(
                `upload file to an existing collection - "${collection.name}"`
            );
            await this.preCollectionCreationAction();
            const filesWithCollectionToUpload: FileWithCollection[] =
                toUploadFiles.map((file, index) => ({
                    file,
                    localID: index,
                    collectionID: collection.id,
                }));
            this.waitInQueueAndUploadFiles(
                filesWithCollectionToUpload,
                [collection],
                uploaderName
            );
        } catch (e) {
            logError(e, 'Failed to upload files to existing collections');
        }
    };

    waitInQueueAndUploadFiles = (
        filesWithCollectionToUploadIn: FileWithCollection[],
        collections: Collection[],
        uploaderName?: string
    ) => {
        const currentPromise = this.currentUploadPromise;
        this.currentUploadPromise = waitAndRun(
            currentPromise,
            async () =>
                await this.uploadFiles(
                    filesWithCollectionToUploadIn,
                    collections,
                    uploaderName
                )
        );
    };

    preUploadAction = async () => {
        uploadManager.prepareForNewUpload();
        this.setUploadProgressView(true);
        await this.syncWithRemote(true, true);
    };

    postUploadAction() {
        this.setShouldDisableDropzone(false);
        uploadManager.setUploadRunning(false);
        this.syncWithRemote();
    }

    uploadFiles = async (
        filesWithCollectionToUploadIn: FileWithCollection[],
        collections: Collection[],
        uploaderName?: string
    ) => {
        try {
            addLogLine('uploadFiles called');
            this.preUploadAction();

            const shouldCloseUploadProgress =
                await uploadManager.queueFilesForUpload(
                    filesWithCollectionToUploadIn,
                    collections,
                    uploaderName
                );
            if (shouldCloseUploadProgress) {
                this.setUploadProgressView(false);
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
        } catch (err) {
            logError(err, 'failed to upload files');
            this.showUserFacingError(err.message);
            this.setUploadProgressView(false);
            throw err;
        } finally {
            this.postUploadAction();
        }
    };

    retryFailed = async () => {
        try {
            addLogLine('user retrying failed  upload');
            const filesWithCollections =
                uploadManager.getFailedFilesWithCollections();
            const uploaderName = uploadManager.getUploaderName();
            await this.preUploadAction();
            await uploadManager.queueFilesForUpload(
                filesWithCollections.files,
                filesWithCollections.collections,
                uploaderName
            );
        } catch (err) {
            logError(err, 'retry failed files failed');
            this.showUserFacingError(err.message);
            this.setUploadProgressView(false);
        } finally {
            this.postUploadAction();
        }
    };

    cancelUploads = () => {
        uploadManager.cancelRunningUpload();
    };
}

export default new UploadController();
