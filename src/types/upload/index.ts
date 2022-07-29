import { FILE_TYPE } from 'constants/file';
import { Collection } from 'types/collection';
import { fileAttribute } from 'types/file';

export interface DataStream {
    stream: ReadableStream<Uint8Array>;
    chunkCount: number;
}

export function isDataStream(object: any): object is DataStream {
    return 'stream' in object;
}

export interface EncryptionResult {
    file: fileAttribute;
    key: string;
}

export interface Metadata {
    title: string;
    creationTime: number;
    modificationTime: number;
    latitude: number;
    longitude: number;
    fileType: FILE_TYPE;
    hasStaticThumbnail?: boolean;
    hash?: string;
    imageHash?: string;
    videoHash?: string;
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
}

export interface ParsedMetadataJSON {
    creationTime: number;
    modificationTime: number;
    latitude: number;
    longitude: number;
}

export interface MultipartUploadURLs {
    objectKey: string;
    partURLs: string[];
    completeURL: string;
}

export interface FileTypeInfo {
    fileType: FILE_TYPE;
    exactType: string;
    mimeType?: string;
    imageType?: string;
    videoType?: string;
}

/*
 * ElectronFile is a custom interface that is used to represent
 * any file on disk as a File-like object in the Electron desktop app.
 *
 * This was added to support the auto-resuming of failed uploads
 * which needed absolute paths to the files which the
 * normal File interface does not provide.
 */
export interface ElectronFile {
    name: string;
    path: string;
    size: number;
    lastModified: number;
    stream: () => Promise<ReadableStream<Uint8Array>>;
    blob: () => Promise<Blob>;
    arrayBuffer: () => Promise<Uint8Array>;
}

export interface UploadAsset {
    isLivePhoto?: boolean;
    file?: File | ElectronFile;
    livePhotoAssets?: LivePhotoAssets;
    isElectron?: boolean;
}
export interface LivePhotoAssets {
    image: globalThis.File | ElectronFile;
    video: globalThis.File | ElectronFile;
}

export interface FileWithCollection extends UploadAsset {
    localID: number;
    collection?: Collection;
    collectionID?: number;
}
export interface MetadataAndFileTypeInfo {
    metadata: Metadata;
    fileTypeInfo: FileTypeInfo;
}

export type MetadataAndFileTypeInfoMap = Map<number, MetadataAndFileTypeInfo>;
export type ParsedMetadataJSONMap = Map<string, ParsedMetadataJSON>;

export interface UploadURL {
    url: string;
    objectKey: string;
}

export interface B64EncryptionResult {
    encryptedData: string;
    key: string;
    nonce: string;
}

export interface FileInMemory {
    filedata: Uint8Array | DataStream;
    thumbnail: Uint8Array;
    hasStaticThumbnail: boolean;
}

export interface FileWithMetadata
    extends Omit<FileInMemory, 'hasStaticThumbnail'> {
    metadata: Metadata;
    localID: number;
}

export interface EncryptedFile {
    file: ProcessedFile;
    fileKey: B64EncryptionResult;
}
export interface ProcessedFile {
    file: fileAttribute;
    thumbnail: fileAttribute;
    metadata: fileAttribute;
    localID: number;
}
export interface BackupedFile extends Omit<ProcessedFile, 'localID'> {}

export interface UploadFile extends BackupedFile {
    collectionID: number;
    encryptedKey: string;
    keyDecryptionNonce: string;
}

export interface ParsedExtractedMetadata {
    location: GeoLocation;
    creationTime: number;
}
