import { LimitedCache } from '../cache';
import { ElectronFile } from '../upload';
import { WatchMapping } from '../watchFolder';

export interface AppUpdateInfo {
    autoUpdatable: boolean;
    version: string;
}

export interface ElectronAPIs {
    exists: (path: string) => boolean;
    checkExistsAndCreateDir: (dirPath: string) => Promise<void>;
    checkExistsAndRename: (
        oldDirPath: string,
        newDirPath: string
    ) => Promise<void>;
    saveStreamToDisk: (
        path: string,
        fileStream: ReadableStream<any>
    ) => Promise<void>;
    saveFileToDisk: (path: string, file: any) => Promise<void>;
    selectRootDirectory: () => Promise<string>;
    sendNotification: (content: string) => void;
    getExportRecord: (filePath: string) => Promise<string>;
    setExportRecord: (filePath: string, data: string) => Promise<void>;
    showUploadFilesDialog: () => Promise<ElectronFile[]>;
    showUploadDirsDialog: () => Promise<ElectronFile[]>;
    getPendingUploads: () => Promise<{
        files: ElectronFile[];
        collectionName: string;
        type: string;
    }>;
    setToUploadFiles: (type: string, filePaths: string[]) => void;
    showUploadZipDialog: () => Promise<{
        zipPaths: string[];
        files: ElectronFile[];
    }>;
    getElectronFilesFromGoogleZip: (
        filePath: string
    ) => Promise<ElectronFile[]>;
    setToUploadCollection: (collectionName: string) => void;
    getDirFiles: (dirPath: string) => Promise<ElectronFile[]>;
    getWatchMappings: () => WatchMapping[];
    updateWatchMappingSyncedFiles: (
        folderPath: string,
        files: WatchMapping['syncedFiles']
    ) => void;
    updateWatchMappingIgnoredFiles: (
        folderPath: string,
        files: WatchMapping['ignoredFiles']
    ) => void;
    addWatchMapping: (
        collectionName: string,
        folderPath: string,
        uploadStrategy: number
    ) => Promise<void>;
    removeWatchMapping: (folderPath: string) => Promise<void>;
    registerWatcherFunctions: (
        addFile: (file: ElectronFile) => Promise<void>,
        removeFile: (path: string) => Promise<void>,
        removeFolder: (folderPath: string) => Promise<void>
    ) => void;
    isFolder: (dirPath: string) => Promise<boolean>;
    clearElectronStore: () => void;
    setEncryptionKey: (encryptionKey: string) => Promise<void>;
    getEncryptionKey: () => Promise<string>;
    openDiskCache: (cacheName: string) => Promise<LimitedCache>;
    deleteDiskCache: (cacheName: string) => Promise<boolean>;
    logToDisk: (msg: string) => void;
    convertHEIC(fileData: Uint8Array): Promise<Uint8Array>;
    openLogDirectory: () => void;
    registerUpdateEventListener: (
        showUpdateDialog: (updateInfo: AppUpdateInfo) => void
    ) => void;
    updateAndRestart: () => void;
    skipAppUpdate: (version: string) => void;
    getSentryUserID: () => Promise<string>;
    getAppVersion: () => Promise<string>;
    runFFmpegCmd: (
        cmd: string[],
        inputFile: File | ElectronFile,
        outputFileName: string
    ) => Promise<File>;
    muteUpdateNotification: (version: string) => void;
    generateImageThumbnail: (
        inputFile: File | ElectronFile,
        maxDimension: number,
        maxSize: number
    ) => Promise<Uint8Array>;
    logRendererProcessMemoryUsage: (message: string) => Promise<void>;
    registerForegroundEventListener: (onForeground: () => void) => void;
    openDirectory: (dirPath: string) => Promise<void>;
}
