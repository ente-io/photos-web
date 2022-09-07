import { Collection } from 'types/collection';
import { EnteFile } from 'types/file';
import { ElectronFile, FileWithCollection } from 'types/upload';
import { runningInBrowser } from 'utils/common';
import {
    getLocalCollections,
    removeFromCollection,
} from '../collectionService';
import { getLocalFiles } from '../fileService';
import { logError } from 'utils/sentry';
import { EventQueueItem, WatchMapping } from 'types/watchFolder';
import { ElectronAPIs } from 'types/electron';
import debounce from 'debounce-promise';
import {
    diskFileAddedCallback,
    diskFileRemovedCallback,
    diskFolderRemovedCallback,
} from './watchFolderEventHandlers';
import { getParentFolderName } from './utils';
import { UPLOAD_RESULT, UPLOAD_STRATEGY } from 'constants/upload';
import uploadManager from 'services/upload/uploadManager';
import { addLocalLog, addLogLine } from 'utils/logging';

class watchFolderService {
    private electronAPIs: ElectronAPIs;
    private allElectronAPIsExist: boolean = false;
    private eventQueue: EventQueueItem[] = [];
    private currentEvent: EventQueueItem;
    private currentlySyncedMapping: WatchMapping;
    private trashingDirQueue: string[] = [];
    private isEventRunning: boolean = false;
    private uploadRunning: boolean = false;
    private filePathToUploadedFileIDMap = new Map<string, number>();
    private unUploadableFilePaths = new Set<string>();
    private isPaused = false;
    private setElectronFiles: (files: ElectronFile[]) => void;
    private setCollectionName: (collectionName: string) => void;
    private syncWithRemote: () => void;
    private setWatchFolderServiceIsRunning: (isRunning: boolean) => void;

    constructor() {
        this.electronAPIs = (runningInBrowser() &&
            window['ElectronAPIs']) as ElectronAPIs;
        this.allElectronAPIsExist = !!this.electronAPIs?.getWatchMappings;
    }

    isUploadRunning() {
        return this.uploadRunning;
    }

    isSyncPaused() {
        return this.isPaused;
    }

    async init(
        setElectronFiles: (files: ElectronFile[]) => void,
        setCollectionName: (collectionName: string) => void,
        syncWithRemote: () => void,
        setWatchFolderServiceIsRunning: (isRunning: boolean) => void
    ) {
        if (this.allElectronAPIsExist) {
            try {
                this.setElectronFiles = setElectronFiles;
                this.setCollectionName = setCollectionName;
                this.syncWithRemote = syncWithRemote;
                this.setWatchFolderServiceIsRunning =
                    setWatchFolderServiceIsRunning;
                this.setupWatcherFunctions();
                await this.getAndSyncDiffOfFiles();
            } catch (e) {
                logError(e, 'error while initializing watch service');
            }
        }
    }

    async getAndSyncDiffOfFiles() {
        try {
            let mappings = this.getWatchMappings();

            addLogLine(`mappings, ${mappings.map((m) => JSON.stringify(m))}`);

            if (!mappings?.length) {
                return;
            }

            mappings = await this.filterOutDeletedMappings(mappings);

            this.eventQueue = [];

            for (const mapping of mappings) {
                const filesOnDisk: ElectronFile[] =
                    await this.electronAPIs.getDirFiles(mapping.folderPath);

                this.uploadDiffOfFiles(mapping, filesOnDisk);
                this.trashDiffOfFiles(mapping, filesOnDisk);
            }

            await this.runNextEvent();
        } catch (e) {
            logError(e, 'error while getting and syncing diff of files');
        }
    }

    isMappingSyncInProgress(mapping: WatchMapping) {
        return this.currentEvent?.folderPath === mapping.folderPath;
    }

    private uploadDiffOfFiles(
        mapping: WatchMapping,
        filesOnDisk: ElectronFile[]
    ) {
        const filesToUpload = filesOnDisk.filter((electronFile) => {
            return (
                !mapping.syncedFiles.find(
                    (file) => file.path === electronFile.path
                ) && !mapping.ignoredFiles.includes(electronFile.path)
            );
        });

        if (filesToUpload.length > 0) {
            for (const file of filesToUpload) {
                const event: EventQueueItem = {
                    type: 'upload',
                    collectionName: this.getCollectionNameForMapping(
                        mapping,
                        file.path
                    ),
                    folderPath: mapping.folderPath,
                    files: [file],
                };
                this.eventQueue.push(event);
            }
        }
    }

    private trashDiffOfFiles(
        mapping: WatchMapping,
        filesOnDisk: ElectronFile[]
    ) {
        const filesToRemove = mapping.syncedFiles.filter((file) => {
            return !filesOnDisk.find(
                (electronFile) => electronFile.path === file.path
            );
        });

        if (filesToRemove.length > 0) {
            for (const file of filesToRemove) {
                const event: EventQueueItem = {
                    type: 'trash',
                    collectionName: this.getCollectionNameForMapping(
                        mapping,
                        file.path
                    ),
                    folderPath: mapping.folderPath,
                    paths: [file.path],
                };
                this.eventQueue.push(event);
            }
        }
    }

    private async filterOutDeletedMappings(
        mappings: WatchMapping[]
    ): Promise<WatchMapping[]> {
        const notDeletedMappings = [];
        for (const mapping of mappings) {
            const mappingExists = await this.electronAPIs.isFolder(
                mapping.folderPath
            );
            if (!mappingExists) {
                this.electronAPIs.removeWatchMapping(mapping.folderPath);
            } else {
                notDeletedMappings.push(mapping);
            }
        }
        return notDeletedMappings;
    }

    async pushEvent(event: EventQueueItem) {
        this.eventQueue.push(event);
        debounce(this.runNextEvent.bind(this), 300)();
    }

    async pushTrashedDir(path: string) {
        this.trashingDirQueue.push(path);
    }

    private setupWatcherFunctions() {
        if (this.allElectronAPIsExist) {
            this.electronAPIs.registerWatcherFunctions(
                diskFileAddedCallback,
                diskFileRemovedCallback,
                diskFolderRemovedCallback
            );
        }
    }

    async addWatchMapping(
        rootFolderName: string,
        folderPath: string,
        uploadStrategy: UPLOAD_STRATEGY
    ) {
        if (this.allElectronAPIsExist) {
            try {
                await this.electronAPIs.addWatchMapping(
                    rootFolderName,
                    folderPath,
                    uploadStrategy
                );
                this.getAndSyncDiffOfFiles();
            } catch (e) {
                logError(e, 'error while adding watch mapping');
            }
        }
    }

    async removeWatchMapping(folderPath: string) {
        if (this.allElectronAPIsExist) {
            try {
                await this.electronAPIs.removeWatchMapping(folderPath);
            } catch (e) {
                logError(e, 'error while removing watch mapping');
            }
        }
    }

    getWatchMappings(): WatchMapping[] {
        if (this.allElectronAPIsExist) {
            try {
                return this.electronAPIs.getWatchMappings() ?? [];
            } catch (e) {
                logError(e, 'error while getting watch mappings');
                return [];
            }
        }
        return [];
    }

    private setIsEventRunning(isEventRunning: boolean) {
        this.isEventRunning = isEventRunning;
        this.setWatchFolderServiceIsRunning(isEventRunning);
    }

    private async runNextEvent() {
        try {
            addLogLine(
                `mappings,
            ${this.getWatchMappings().map((m) => JSON.stringify(m))}`
            );

            if (
                this.eventQueue.length === 0 ||
                this.isEventRunning ||
                this.isPaused
            ) {
                return;
            }

            const event = this.clubSameCollectionEvents();
            const mappings = this.getWatchMappings();
            const mapping = mappings.find(
                (mapping) => mapping.folderPath === event.folderPath
            );
            if (!mapping) {
                throw Error('no Mapping found for event');
            }
            if (event.type === 'upload') {
                event.files = event.files.filter(
                    (file) =>
                        !mapping.ignoredFiles.includes(file.path) &&
                        !mapping.syncedFiles.find((f) => f.path === file.path)
                );
                if (event.files.length === 0) {
                    return;
                }
            }
            this.currentEvent = event;
            this.currentlySyncedMapping = mapping;
            addLogLine(`running event', ${JSON.stringify(event)}`);
            this.setIsEventRunning(true);
            if (event.type === 'upload') {
                this.processUploadEvent();
            } else {
                await this.processTrashEvent();
                this.setIsEventRunning(false);
                this.runNextEvent();
            }
        } catch (e) {
            logError(e, 'runNextEvent failed');
        }
    }

    private async processUploadEvent() {
        try {
            this.uploadRunning = true;

            this.setCollectionName(this.currentEvent.collectionName);
            this.setElectronFiles(this.currentEvent.files);
        } catch (e) {
            logError(e, 'error while running next upload');
        }
    }

    async onFileUpload(
        fileUploadResult: UPLOAD_RESULT,
        fileWithCollection: FileWithCollection,
        file: EnteFile
    ) {
        addLocalLog(() => `onFileUpload called`);
        if (!this.isUploadRunning) {
            return;
        }
        if (
            [
                UPLOAD_RESULT.ADDED_SYMLINK,
                UPLOAD_RESULT.UPLOADED,
                UPLOAD_RESULT.UPLOADED_WITH_STATIC_THUMBNAIL,
                UPLOAD_RESULT.ALREADY_UPLOADED,
            ].includes(fileUploadResult)
        ) {
            if (fileWithCollection.isLivePhoto) {
                this.filePathToUploadedFileIDMap.set(
                    (fileWithCollection.livePhotoAssets.image as ElectronFile)
                        .path,
                    file.id
                );
                this.filePathToUploadedFileIDMap.set(
                    (fileWithCollection.livePhotoAssets.video as ElectronFile)
                        .path,
                    file.id
                );
            } else {
                this.filePathToUploadedFileIDMap.set(
                    (fileWithCollection.file as ElectronFile).path,
                    file.id
                );
            }
        } else if (
            [UPLOAD_RESULT.UNSUPPORTED, UPLOAD_RESULT.TOO_LARGE].includes(
                fileUploadResult
            )
        ) {
            if (fileWithCollection.isLivePhoto) {
                this.unUploadableFilePaths.add(
                    (fileWithCollection.livePhotoAssets.image as ElectronFile)
                        .path
                );
                this.unUploadableFilePaths.add(
                    (fileWithCollection.livePhotoAssets.video as ElectronFile)
                        .path
                );
            } else {
                this.unUploadableFilePaths.add(
                    (fileWithCollection.file as ElectronFile).path
                );
            }
        }
    }

    async allFileUploadsDone(
        filesWithCollection: FileWithCollection[],
        collections: Collection[]
    ) {
        if (this.allElectronAPIsExist) {
            try {
                addLocalLog(
                    () =>
                        `allFileUploadsDone,${JSON.stringify(
                            filesWithCollection
                        )} ${JSON.stringify(collections)}`
                );
                const collection = collections.find(
                    (collection) =>
                        collection.id === filesWithCollection[0].collectionID
                );
                addLocalLog(() => `got collection ${!!collection}`);
                addLocalLog(
                    () =>
                        `${this.isEventRunning} ${this.currentEvent.collectionName} ${collection?.name}`
                );
                if (
                    !this.isEventRunning ||
                    this.currentEvent.collectionName !== collection?.name
                ) {
                    return;
                }

                const syncedFiles: WatchMapping['syncedFiles'] = [];
                const ignoredFiles: WatchMapping['ignoredFiles'] = [];

                for (const fileWithCollection of filesWithCollection) {
                    this.handleUploadedFile(
                        fileWithCollection,
                        syncedFiles,
                        ignoredFiles
                    );
                }

                addLocalLog(() => `syncedFiles ${JSON.stringify(syncedFiles)}`);
                addLocalLog(
                    () => `ignoredFiles ${JSON.stringify(ignoredFiles)}`
                );

                if (syncedFiles.length > 0) {
                    this.currentlySyncedMapping.syncedFiles = [
                        ...this.currentlySyncedMapping.syncedFiles,
                        ...syncedFiles,
                    ];
                    this.electronAPIs.updateWatchMappingSyncedFiles(
                        this.currentlySyncedMapping.folderPath,
                        this.currentlySyncedMapping.syncedFiles
                    );
                }
                if (ignoredFiles.length > 0) {
                    this.currentlySyncedMapping.ignoredFiles = [
                        ...this.currentlySyncedMapping.ignoredFiles,
                        ...ignoredFiles,
                    ];
                    this.electronAPIs.updateWatchMappingIgnoredFiles(
                        this.currentlySyncedMapping.folderPath,
                        this.currentlySyncedMapping.ignoredFiles
                    );
                }

                this.runPostUploadsAction();
            } catch (e) {
                logError(e, 'error while running all file uploads done');
            }
        }
    }

    private runPostUploadsAction() {
        this.setIsEventRunning(false);
        this.uploadRunning = false;
        this.runNextEvent();
    }

    private handleUploadedFile(
        fileWithCollection: FileWithCollection,
        syncedFiles: { path: string; id: number }[],
        ignoredFiles: string[]
    ) {
        if (fileWithCollection.isLivePhoto) {
            const imagePath = (
                fileWithCollection.livePhotoAssets.image as ElectronFile
            ).path;
            const videoPath = (
                fileWithCollection.livePhotoAssets.video as ElectronFile
            ).path;

            if (
                this.filePathToUploadedFileIDMap.has(imagePath) &&
                this.filePathToUploadedFileIDMap.has(videoPath)
            ) {
                const imageFile = {
                    path: imagePath,
                    id: this.filePathToUploadedFileIDMap.get(imagePath),
                };
                const videoFile = {
                    path: videoPath,
                    id: this.filePathToUploadedFileIDMap.get(videoPath),
                };
                syncedFiles.push(imageFile);
                syncedFiles.push(videoFile);
                addLocalLog(
                    () =>
                        `added image ${JSON.stringify(
                            imageFile
                        )} and video file ${JSON.stringify(
                            videoFile
                        )} to uploadedFiles`
                );
            } else if (
                this.unUploadableFilePaths.has(imagePath) &&
                this.unUploadableFilePaths.has(videoPath)
            ) {
                ignoredFiles.push(imagePath);
                ignoredFiles.push(videoPath);
                addLocalLog(
                    () =>
                        `added image ${imagePath} and video file ${videoPath} to rejectedFiles`
                );
            }
            this.filePathToUploadedFileIDMap.delete(imagePath);
            this.filePathToUploadedFileIDMap.delete(videoPath);
        } else {
            const filePath = (fileWithCollection.file as ElectronFile).path;

            if (this.filePathToUploadedFileIDMap.has(filePath)) {
                const file = {
                    path: filePath,
                    id: this.filePathToUploadedFileIDMap.get(filePath),
                };
                syncedFiles.push(file);
                addLocalLog(() => `added file ${JSON.stringify(file)} `);
            } else if (this.unUploadableFilePaths.has(filePath)) {
                ignoredFiles.push(filePath);
                addLocalLog(() => `added file ${filePath} to rejectedFiles`);
            }
            this.filePathToUploadedFileIDMap.delete(filePath);
        }
    }

    private async processTrashEvent() {
        try {
            if (this.checkAndIgnoreIfFileEventsFromTrashedDir()) {
                return;
            }

            const { collectionName, paths } = this.currentEvent;
            const filePathsToRemove = new Set(paths);

            const files = this.currentlySyncedMapping.syncedFiles.filter(
                (file) => filePathsToRemove.has(file.path)
            );

            await this.trashByIDs(files, collectionName);

            this.currentlySyncedMapping.syncedFiles =
                this.currentlySyncedMapping.syncedFiles.filter(
                    (file) => !filePathsToRemove.has(file.path)
                );
            this.electronAPIs.updateWatchMappingSyncedFiles(
                this.currentlySyncedMapping.folderPath,
                this.currentlySyncedMapping.syncedFiles
            );
        } catch (e) {
            logError(e, 'error while running next trash');
        }
    }

    private async trashByIDs(
        toTrashFiles: WatchMapping['syncedFiles'],
        collectionName: string
    ) {
        try {
            const collections = await getLocalCollections();
            const collection = collections.find(
                (collection) => collection.name === collectionName
            );
            if (!collection) {
                return;
            }
            const files = await getLocalFiles();

            const idSet = new Set<number>();
            for (const file of toTrashFiles) {
                idSet.add(file.id);
            }

            const filesToTrash = files.filter((file) => {
                return (
                    idSet.has(file.id) && file.collectionID === collection.id
                );
            });

            await removeFromCollection(collection.id, filesToTrash);
            this.syncWithRemote();
        } catch (e) {
            logError(e, 'error while trashing by IDs');
        }
    }

    private checkAndIgnoreIfFileEventsFromTrashedDir() {
        if (this.trashingDirQueue.length !== 0) {
            this.ignoreFileEventsFromTrashedDir(this.trashingDirQueue[0]);
            this.trashingDirQueue.shift();
            return true;
        }
        return false;
    }

    private ignoreFileEventsFromTrashedDir(trashingDir: string) {
        this.eventQueue = this.eventQueue.filter((event) =>
            event.paths.every((path) => !path.startsWith(trashingDir))
        );
    }

    async getCollectionNameAndFolderPath(filePath: string) {
        try {
            const mappings = this.getWatchMappings();

            const mapping = mappings.find(
                (mapping) =>
                    filePath.length > mapping.folderPath.length &&
                    filePath.startsWith(mapping.folderPath) &&
                    filePath[mapping.folderPath.length] === '/'
            );

            if (!mapping) {
                throw Error(`no mapping found for ${filePath}`);
            }

            return {
                collectionName: this.getCollectionNameForMapping(
                    mapping,
                    filePath
                ),
                folderPath: mapping.folderPath,
            };
        } catch (e) {
            logError(e, 'error while getting collection name');
        }
    }

    private getCollectionNameForMapping(
        mapping: WatchMapping,
        filePath: string
    ) {
        return mapping.uploadStrategy === UPLOAD_STRATEGY.COLLECTION_PER_FOLDER
            ? getParentFolderName(filePath)
            : mapping.rootFolderName;
    }

    async selectFolder(): Promise<string> {
        try {
            const folderPath = await this.electronAPIs.selectRootDirectory();
            return folderPath;
        } catch (e) {
            logError(e, 'error while selecting folder');
        }
    }

    // Batches all the files to be uploaded (or trashed) from the
    // event queue of same collection as the next event
    private clubSameCollectionEvents(): EventQueueItem {
        const event = this.eventQueue.shift();
        while (
            this.eventQueue.length > 0 &&
            event.collectionName === this.eventQueue[0].collectionName &&
            event.type === this.eventQueue[0].type
        ) {
            if (event.type === 'trash') {
                event.paths = [...event.paths, ...this.eventQueue[0].paths];
            } else {
                event.files = [...event.files, ...this.eventQueue[0].files];
            }
            this.eventQueue.shift();
        }
        return event;
    }

    async isFolder(folderPath: string) {
        try {
            const isFolder = await this.electronAPIs.isFolder(folderPath);
            return isFolder;
        } catch (e) {
            logError(e, 'error while checking if folder exists');
        }
    }

    pauseRunningSync() {
        this.isPaused = true;
        uploadManager.cancelRunningUpload();
    }

    resumePausedSync() {
        this.isPaused = false;
        this.getAndSyncDiffOfFiles();
    }
}

export default new watchFolderService();
