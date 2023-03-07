import { ICollectionNamer } from 'components/Collections/CollectionNamer';
import {
    CollectionSelectorAttributes,
    ICollectionSelector,
} from 'components/Collections/CollectionSelector';
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
import importService from 'services/importService';
import {
    getPublicCollectionUID,
    getPublicCollectionUploaderName,
    savePublicCollectionUploaderName,
} from 'services/publicCollectionService';

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
    isPendingDesktopUpload: boolean;
    pendingDesktopUploadCollectionName: string;
    zipPaths: string[];
    isPublicUpload: boolean;
    publicProps: {
        collection: Collection;
        token: string;
    };

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
        this.uploadTypeSelector = uploadTypeSelector;
        this.openFileSelector = openFileSelector;
        this.openFolderSelector = openFolderSelector;
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
        isFirstUpload?: boolean,
        isPublicUpload?: boolean,
        publicProps?: {
            collection: Collection;
            token: string;
        }
    ) {
        this.isFirstUpload = isFirstUpload;
        this.isPublicUpload = isPublicUpload;
        this.publicProps = publicProps;

        const pickedUploadType = await this.uploadTypeSelector.show({
            intent: uploadTypeSelectorIntent,
        });
        switch (pickedUploadType) {
            case PICKED_UPLOAD_TYPE.FILES:
                this.handleUpload(PICKED_UPLOAD_TYPE.FILES);
                break;
            case PICKED_UPLOAD_TYPE.FOLDERS:
                this.handleUpload(PICKED_UPLOAD_TYPE.FOLDERS);
                break;
            case PICKED_UPLOAD_TYPE.ZIPS:
                this.handleUpload(PICKED_UPLOAD_TYPE.ZIPS);
                break;
            default:
                break;
        }
    }

    resumeDesktopUpload = async (
        type: PICKED_UPLOAD_TYPE,
        electronFiles: ElectronFile[],
        collectionName: string,
        zipPaths?: string[]
    ) => {
        if (electronFiles && electronFiles?.length > 0) {
            this.isPendingDesktopUpload = true;
            this.pendingDesktopUploadCollectionName = collectionName;
            this.zipPaths = zipPaths;
            this.preprocessAndUploadFiles(electronFiles, type);
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

    private handleCollectionCreationAndUpload = async (
        toUploadFiles: File[] | ElectronFile[],
        importSuggestion: ImportSuggestion,
        pickedUploadType: PICKED_UPLOAD_TYPE
    ) => {
        try {
            let uploaderName: string;
            if (this.isPublicUpload) {
                addLogLine(
                    `uploading files to public collection - ${this.publicProps.collection.name}  - ${this.publicProps.collection.id}`
                );
                uploaderName = await getPublicCollectionUploaderName(
                    getPublicCollectionUID(this.publicProps.token)
                );
                uploaderName = await this.userNameInputDialog.show({
                    uploaderName,
                    toUploadFilesCount: toUploadFiles.length,
                });
                savePublicCollectionUploaderName(
                    getPublicCollectionUID(this.publicProps.token),
                    uploaderName
                );
                this.uploadFilesToExistingCollection(
                    toUploadFiles,
                    this.publicProps.collection,
                    uploaderName
                );
            }
            if (this.isPendingDesktopUpload) {
                this.isPendingDesktopUpload = false;
                if (this.pendingDesktopUploadCollectionName) {
                    addLogLine(
                        `upload pending files to collection - ${this.pendingDesktopUploadCollectionName}`
                    );
                    this.uploadFilesToNewCollections(
                        toUploadFiles,
                        UPLOAD_STRATEGY.SINGLE_COLLECTION,
                        this.pendingDesktopUploadCollectionName
                    );
                    this.pendingDesktopUploadCollectionName = null;
                } else {
                    addLogLine(
                        `pending upload - strategy - "multiple collections" `
                    );
                    this.uploadFilesToNewCollections(
                        toUploadFiles,
                        UPLOAD_STRATEGY.COLLECTION_PER_FOLDER
                    );
                }
                return;
            }

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
            let showNextModal: CollectionSelectorAttributes['showNextModal'];
            if (importSuggestion.hasNestedFolders) {
                addLogLine(`nested folders detected`);
                showNextModal = async () => {
                    const choice = await this.uploadStrategyChoiceModal.show();
                    return choice;
                };
            } else {
                showNextModal = async () => {
                    const collectionName = await this.collectionNamer.show({
                        title: constants.CREATE_COLLECTION,
                        buttonText: constants.CREATE,
                        autoFilledName: null,
                    });
                    return collectionName;
                };
            }

            const response = await this.collectionSelector.show({
                title: constants.UPLOAD_TO_COLLECTION,
                showNextModal,
            });
            if (typeof response === 'string') {
                addLogLine(`upload to single collection - "${response}"`);
                this.uploadFilesToNewCollections(
                    toUploadFiles,
                    UPLOAD_STRATEGY.SINGLE_COLLECTION,
                    response
                );
            } else if (
                response === UPLOAD_STRATEGY.SINGLE_COLLECTION ||
                response === UPLOAD_STRATEGY.COLLECTION_PER_FOLDER
            ) {
                this.uploadFilesToNewCollections(
                    toUploadFiles,
                    response,
                    importSuggestion.rootFolderName
                );
            } else {
                addLogLine(
                    `uploading files to an existing collection - ${response.name} - ${response.id}`
                );
                this.uploadFilesToExistingCollection(toUploadFiles, response);
            }
        } catch (e) {
            logError(e, 'handleCollectionCreationAndUpload failed');
        }
    };

    private preCollectionCreationAction = async () => {
        this.setShouldDisableDropzone(!uploadManager.shouldAllowNewUpload());
        uiService.setUploadStage(UPLOAD_STAGES.START);
        this.setUploadProgressView(true);
    };

    private uploadFilesToNewCollections = async (
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

    private uploadFilesToExistingCollection = async (
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

    private waitInQueueAndUploadFiles = (
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

    private preUploadAction = async () => {
        uploadManager.prepareForNewUpload();
        this.setUploadProgressView(true);
        await this.syncWithRemote(true, true);
    };

    private postUploadAction() {
        this.setShouldDisableDropzone(false);
        uploadManager.setUploadRunning(false);
        this.syncWithRemote();
    }

    private uploadFiles = async (
        filesWithCollectionToUploadIn: FileWithCollection[],
        collections: Collection[],
        uploaderName?: string
    ) => {
        try {
            addLogLine('uploadFiles called');
            this.preUploadAction();
            if (this.isPendingDesktopUpload) {
                await importService.setToUploadCollection(collections);
                if (this.zipPaths) {
                    await importService.setToUploadFiles(
                        PICKED_UPLOAD_TYPE.ZIPS,
                        this.zipPaths
                    );
                    this.zipPaths = null;
                }
                await importService.setToUploadFiles(
                    PICKED_UPLOAD_TYPE.FILES,
                    filesWithCollectionToUploadIn.map(
                        ({ file }) => (file as ElectronFile).path
                    )
                );
            }

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

    private handleUpload = (type: PICKED_UPLOAD_TYPE) => () => {
        if (isElectron() && importService.checkAllElectronAPIsExists()) {
            this.handleDesktopUpload(type);
        } else {
            this.handleWebUpload(type);
        }
    };

    private handleWebUpload = async (type: PICKED_UPLOAD_TYPE) => {
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

    private handleDesktopUpload = async (type: PICKED_UPLOAD_TYPE) => {
        let files: ElectronFile[];
        let zipPaths: string[];
        if (type === PICKED_UPLOAD_TYPE.FILES) {
            files = await importService.showUploadFilesDialog();
        } else if (type === PICKED_UPLOAD_TYPE.FOLDERS) {
            files = await importService.showUploadDirsDialog();
        } else {
            const response = await importService.showUploadZipDialog();
            files = response.files;
            zipPaths = response.zipPaths;
        }
        if (files?.length > 0) {
            addLogLine(
                ` desktop upload for type:${type} and fileCount: ${files?.length} requested`
            );
            this.zipPaths = zipPaths;
            this.preprocessAndUploadFiles(files, type);
        }
    };
}

export default new UploadController();
