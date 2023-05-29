import { FILE_TYPE } from '@/constants/file';
import { Collection } from '../collection';
import { B64EncryptionResult, LocalFileAttributes } from '@/interfaces/crypto';
import { FileAttributes } from '@/interfaces/file';
import {
    EncryptedMagicMetadata,
    FilePublicMagicMetadata,
} from '@/interfaces/magicMetadata';

export interface DataStream {
    stream: ReadableStream<Uint8Array>;
    chunkCount: number;
}

export function isDataStream(object: any): object is DataStream {
    return 'stream' in object;
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

export interface Location {
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

export interface UploadAsset {
    isLivePhoto?: boolean;
    file?: File;
    livePhotoAssets?: LivePhotoAssets;
    isElectron?: boolean;
}
export interface LivePhotoAssets {
    image: globalThis.File;
    video: globalThis.File;
}

export interface FileWithCollection extends UploadAsset {
    localID: number;
    collection?: Collection;
    collectionID?: number;
}

export type ParsedMetadataJSONMap = Map<string, ParsedMetadataJSON>;

export interface UploadURL {
    url: string;
    objectKey: string;
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
    pubMagicMetadata: FilePublicMagicMetadata;
}

export interface EncryptedFile {
    file: ProcessedFile;
    fileKey: B64EncryptionResult;
}
export interface ProcessedFile {
    file: LocalFileAttributes<Uint8Array | DataStream>;
    thumbnail: LocalFileAttributes<Uint8Array>;
    metadata: LocalFileAttributes<string>;
    pubMagicMetadata: EncryptedMagicMetadata;
    localID: number;
}
export interface BackupedFile {
    file: FileAttributes;
    thumbnail?: FileAttributes;
    metadata: FileAttributes;
    pubMagicMetadata: EncryptedMagicMetadata;
}

export interface UploadFile extends BackupedFile {
    collectionID: number;
    encryptedKey: string;
    keyDecryptionNonce: string;
}

export interface ParsedExtractedMetadata {
    location: Location;
    creationTime: number;
}

// This is used to prompt the user the make upload strategy choice
export interface ImportSuggestion {
    rootFolderName: string;
    hasNestedFolders: boolean;
    hasRootLevelFileWithFolder: boolean;
}

export interface PublicUploadProps {
    token: string;
    passwordToken: string;
    accessedThroughSharedURL: boolean;
}
