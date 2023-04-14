import { ExportStage } from 'constants/export';

export type CollectionIDNameMap = Map<number, string>;
export type CollectionIDPathMap = Map<number, string>;
export interface ExportProgress {
    success: number;
    failed: number;
    total: number;
}
export interface ExportedCollectionPaths {
    [collectionID: number]: string;
}
export interface FileExportStats {
    totalCount: number;
    pendingCount: number;
}

export interface ExportRecordV1 {
    version?: number;
    stage?: ExportStage;
    lastAttemptTimestamp?: number;
    progress?: ExportProgress;
    queuedFiles?: string[];
    exportedFiles?: string[];
    failedFiles?: string[];
    exportedCollectionPaths?: ExportedCollectionPaths;
}

export interface ExportRecord {
    version: number;
    stage: ExportStage;
    lastAttemptTimestamp: number;
    exportedFiles: string[];
    exportedCollectionPaths: ExportedCollectionPaths;
}

export interface ExportSettings {
    folder: string;
    continuousExport: boolean;
}

export interface ExportUIUpdaters {
    updateExportStage: (stage: ExportStage) => Promise<void>;
    updateExportProgress: (progress: ExportProgress) => void;
    updateFileExportStats: (fileExportStats: FileExportStats) => void;
    updateLastExportTime: (exportTime: number) => Promise<void>;
}
