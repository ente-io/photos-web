import { User } from 'types/user';
import { EnteFile } from 'types/file';
import { CollectionSummaryType, CollectionType } from 'constants/collection';
import {
    EncryptedMagicMetadata,
    MagicMetadataCore,
    SUB_TYPE,
    VISIBILITY_STATE,
} from 'types/magicMetadata';

export interface EncryptedCollection {
    id: number;
    owner: User;
    // collection name was unencrypted in the past, so we need to keep it as optional
    name?: string;
    encryptedKey: string;
    keyDecryptionNonce: string;
    encryptedName: string;
    nameDecryptionNonce: string;
    type: CollectionType;
    attributes: collectionAttributes;
    sharees: User[];
    publicURLs?: PublicURL[];
    updationTime: number;
    isDeleted: boolean;
    magicMetadata: EncryptedMagicMetadata;
    pubMagicMetadata: EncryptedMagicMetadata;
}

export interface Collection
    extends Omit<
        EncryptedCollection,
        | 'encryptedKey'
        | 'keyDecryptionNonce'
        | 'encryptedName'
        | 'nameDecryptionNonce'
        | 'magicMetadata'
        | 'pubMagicMetadata'
    > {
    key: string;
    name: string;
    magicMetadata: CollectionMagicMetadata;
    pubMagicMetadata: CollectionPublicMagicMetadata;
}

export interface PublicURL {
    url: string;
    deviceLimit: number;
    validTill: number;
    enableDownload: boolean;
    enableCollect: boolean;
    passwordEnabled: boolean;
    nonce?: string;
    opsLimit?: number;
    memLimit?: number;
}

export interface UpdatePublicURL {
    collectionID: number;
    disablePassword?: boolean;
    enableDownload?: boolean;
    enableCollect?: boolean;
    validTill?: number;
    deviceLimit?: number;
    passHash?: string;
    nonce?: string;
    opsLimit?: number;
    memLimit?: number;
}

export interface CreatePublicAccessTokenRequest {
    collectionID: number;
    validTill?: number;
    deviceLimit?: number;
}

export interface EncryptedFileKey {
    id: number;
    encryptedKey: string;
    keyDecryptionNonce: string;
}

export interface AddToCollectionRequest {
    collectionID: number;
    files: EncryptedFileKey[];
}

export interface MoveToCollectionRequest {
    fromCollectionID: number;
    toCollectionID: number;
    files: EncryptedFileKey[];
}

export interface collectionAttributes {
    encryptedPath?: string;
    pathDecryptionNonce?: string;
}

export type CollectionLatestFiles = Map<number, EnteFile>;

export interface RemoveFromCollectionRequest {
    collectionID: number;
    fileIDs: number[];
}

export interface CollectionMagicMetadataProps {
    visibility?: VISIBILITY_STATE;
    subType?: SUB_TYPE;
}

export interface CollectionMagicMetadata
    extends Omit<MagicMetadataCore, 'data'> {
    data: CollectionMagicMetadataProps;
}

export interface CollectionPublicMagicMetadataProps {
    asc?: boolean;
    coverID?: number;
}

export interface CollectionPublicMagicMetadata
    extends Omit<MagicMetadataCore, 'data'> {
    data: CollectionPublicMagicMetadataProps;
}
export interface CollectionSummary {
    id: number;
    name: string;
    type: CollectionSummaryType;
    latestFile: EnteFile;
    fileCount: number;
    updationTime: number;
}

export type CollectionSummaries = Map<number, CollectionSummary>;
export type CollectionFilesCount = Map<number, number>;
