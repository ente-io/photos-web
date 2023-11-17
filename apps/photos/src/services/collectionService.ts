import { getEndpoint } from 'utils/common/apiUtil';
import { getData, LS_KEYS } from 'utils/storage/localStorage';
import localForage from 'utils/storage/localForage';

import { getActualKey, getToken } from 'utils/common/key';
import { getPublicKey } from './userService';
import HTTPService from './HTTPService';
import { EnteFile } from 'types/file';
import { logError } from 'utils/sentry';
import { CustomError } from 'utils/error';
import {
    sortFiles,
    groupFilesBasedOnCollectionID,
    getUniqueFiles,
} from 'utils/file';
import {
    Collection,
    CollectionToFileMap,
    AddToCollectionRequest,
    MoveToCollectionRequest,
    EncryptedFileKey,
    CreatePublicAccessTokenRequest,
    PublicURL,
    UpdatePublicURL,
    CollectionSummaries,
    CollectionSummary,
    CollectionFilesCount,
    EncryptedCollection,
    CollectionMagicMetadata,
    CollectionMagicMetadataProps,
    CollectionPublicMagicMetadata,
    RemoveFromCollectionRequest,
    CollectionShareeMagicMetadata,
} from 'types/collection';
import {
    COLLECTION_LIST_SORT_BY,
    CollectionType,
    ARCHIVE_SECTION,
    TRASH_SECTION,
    COLLECTION_SORT_ORDER,
    ALL_SECTION,
    CollectionSummaryType,
    DUMMY_UNCATEGORIZED_COLLECTION,
    HIDDEN_ITEMS_SECTION,
} from 'constants/collection';
import { SUB_TYPE, UpdateMagicMetadataRequest } from 'types/magicMetadata';
import {
    isArchivedCollection,
    isArchivedFile,
    isPinnedCollection,
    updateMagicMetadata,
} from 'utils/magicMetadata';
import { FamilyData, User } from 'types/user';
import {
    isQuickLinkCollection,
    isOutgoingShare,
    isSharedOnlyViaLink,
    isValidMoveTarget,
    isHiddenCollection,
    getNonHiddenCollections,
    changeCollectionSubType,
    isIncomingCollabShare,
    isIncomingShare,
    isDefaultHiddenCollection,
    getHiddenCollections,
} from 'utils/collection';
import ComlinkCryptoWorker from 'utils/comlink/ComlinkCryptoWorker';
import { getLocalFiles } from './fileService';
import { REQUEST_BATCH_SIZE } from 'constants/api';
import { batch } from 'utils/common';
import { t } from 'i18next';
import { EncryptedMagicMetadata } from 'types/magicMetadata';
import { VISIBILITY_STATE } from 'types/magicMetadata';

const ENDPOINT = getEndpoint();
const COLLECTION_TABLE = 'collections';
const COLLECTION_UPDATION_TIME = 'collection-updation-time';
const HIDDEN_COLLECTION_IDS = 'hidden-collection-ids';

const UNCATEGORIZED_COLLECTION_NAME = 'Uncategorized';
export const HIDDEN_COLLECTION_NAME = '.hidden';
const FAVORITE_COLLECTION_NAME = 'Favorites';

export const getCollectionLastSyncTime = async (collection: Collection) =>
    (await localForage.getItem<number>(`${collection.id}-time`)) ?? 0;

export const setCollectionLastSyncTime = async (
    collection: Collection,
    time: number
) => await localForage.setItem<number>(`${collection.id}-time`, time);

export const removeCollectionLastSyncTime = async (collection: Collection) =>
    await localForage.removeItem(`${collection.id}-time`);

const getCollectionWithSecrets = async (
    collection: EncryptedCollection,
    masterKey: string
): Promise<Collection> => {
    const cryptoWorker = await ComlinkCryptoWorker.getInstance();
    const userID = getData(LS_KEYS.USER).id;
    let collectionKey: string;
    if (collection.owner.id === userID) {
        collectionKey = await cryptoWorker.decryptB64(
            collection.encryptedKey,
            collection.keyDecryptionNonce,
            masterKey
        );
    } else {
        const keyAttributes = getData(LS_KEYS.KEY_ATTRIBUTES);
        const secretKey = await cryptoWorker.decryptB64(
            keyAttributes.encryptedSecretKey,
            keyAttributes.secretKeyDecryptionNonce,
            masterKey
        );
        collectionKey = await cryptoWorker.boxSealOpen(
            collection.encryptedKey,
            keyAttributes.publicKey,
            secretKey
        );
    }
    const collectionName =
        collection.name ||
        (await cryptoWorker.decryptToUTF8(
            collection.encryptedName,
            collection.nameDecryptionNonce,
            collectionKey
        ));

    let collectionMagicMetadata: CollectionMagicMetadata;
    if (collection.magicMetadata?.data) {
        collectionMagicMetadata = {
            ...collection.magicMetadata,
            data: await cryptoWorker.decryptMetadata(
                collection.magicMetadata.data,
                collection.magicMetadata.header,
                collectionKey
            ),
        };
    }
    let collectionPublicMagicMetadata: CollectionPublicMagicMetadata;
    if (collection.pubMagicMetadata?.data) {
        collectionPublicMagicMetadata = {
            ...collection.pubMagicMetadata,
            data: await cryptoWorker.decryptMetadata(
                collection.pubMagicMetadata.data,
                collection.pubMagicMetadata.header,
                collectionKey
            ),
        };
    }

    let collectionShareeMagicMetadata: CollectionShareeMagicMetadata;
    if (collection.sharedMagicMetadata?.data) {
        collectionShareeMagicMetadata = {
            ...collection.sharedMagicMetadata,
            data: await cryptoWorker.decryptMetadata(
                collection.sharedMagicMetadata.data,
                collection.sharedMagicMetadata.header,
                collectionKey
            ),
        };
    }

    return {
        ...collection,
        name: collectionName,
        key: collectionKey,
        magicMetadata: collectionMagicMetadata,
        pubMagicMetadata: collectionPublicMagicMetadata,
        sharedMagicMetadata: collectionShareeMagicMetadata,
    };
};

const getCollections = async (
    token: string,
    sinceTime: number,
    key: string
): Promise<Collection[]> => {
    try {
        const resp = await HTTPService.get(
            `${ENDPOINT}/collections/v2`,
            {
                sinceTime,
            },
            { 'X-Auth-Token': token }
        );
        const decryptedCollections: Collection[] = await Promise.all(
            resp.data.collections.map(
                async (collection: EncryptedCollection) => {
                    if (collection.isDeleted) {
                        return collection;
                    }
                    try {
                        return await getCollectionWithSecrets(collection, key);
                    } catch (e) {
                        logError(e, `decryption failed for collection`, {
                            collectionID: collection.id,
                        });
                        return collection;
                    }
                }
            )
        );
        // only allow deleted or collection with key, filtering out collection whose decryption failed
        const collections = decryptedCollections.filter(
            (collection) => collection.isDeleted || collection.key
        );
        return collections;
    } catch (e) {
        logError(e, 'getCollections failed');
        throw e;
    }
};

export const getLocalCollections = async (
    type: 'normal' | 'hidden' = 'normal'
): Promise<Collection[]> => {
    const collections = await getAllLocalCollections();
    return type === 'normal'
        ? getNonHiddenCollections(collections)
        : getHiddenCollections(collections);
};

export const getAllLocalCollections = async (): Promise<Collection[]> => {
    const collections: Collection[] =
        (await localForage.getItem(COLLECTION_TABLE)) ?? [];
    return collections;
};

export const getCollectionUpdationTime = async (): Promise<number> =>
    (await localForage.getItem<number>(COLLECTION_UPDATION_TIME)) ?? 0;

export const getHiddenCollectionIDs = async (): Promise<number[]> =>
    (await localForage.getItem<number[]>(HIDDEN_COLLECTION_IDS)) ?? [];

export const getLatestCollections = async (
    type: 'normal' | 'hidden' = 'normal'
): Promise<Collection[]> => {
    const collections = await getAllLatestCollections();
    return type === 'normal'
        ? getNonHiddenCollections(collections)
        : getHiddenCollections(collections);
};
export const getAllLatestCollections = async (): Promise<Collection[]> => {
    const collections = await syncCollections();
    return collections;
};

export const syncCollections = async () => {
    const localCollections = await getAllLocalCollections();
    let lastCollectionUpdationTime = await getCollectionUpdationTime();
    const hiddenCollectionIDs = await getHiddenCollectionIDs();
    const token = getToken();
    const key = await getActualKey();
    const updatedCollections =
        (await getCollections(token, lastCollectionUpdationTime, key)) ?? [];
    if (updatedCollections.length === 0) {
        return localCollections;
    }
    const allCollectionsInstances = [
        ...localCollections,
        ...updatedCollections,
    ];
    const latestCollectionsInstances = new Map<number, Collection>();
    allCollectionsInstances.forEach((collection) => {
        if (
            !latestCollectionsInstances.has(collection.id) ||
            latestCollectionsInstances.get(collection.id).updationTime <
                collection.updationTime
        ) {
            latestCollectionsInstances.set(collection.id, collection);
        }
    });

    const collections: Collection[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, collection] of latestCollectionsInstances) {
        const isDeletedCollection = collection.isDeleted;
        const isNewlyHiddenCollection =
            isHiddenCollection(collection) &&
            !hiddenCollectionIDs.includes(collection.id);
        const isNewlyUnHiddenCollection =
            !isHiddenCollection(collection) &&
            hiddenCollectionIDs.includes(collection.id);
        if (
            isDeletedCollection ||
            isNewlyHiddenCollection ||
            isNewlyUnHiddenCollection
        ) {
            removeCollectionLastSyncTime(collection);
        }
        if (isDeletedCollection) {
            continue;
        }
        collections.push(collection);
        lastCollectionUpdationTime = Math.max(
            lastCollectionUpdationTime,
            collection.updationTime
        );
    }

    const updatedHiddenCollectionIDs = collections
        .filter((collection) => isHiddenCollection(collection))
        .map((collection) => collection.id);

    await localForage.setItem(COLLECTION_TABLE, collections);
    await localForage.setItem(
        COLLECTION_UPDATION_TIME,
        lastCollectionUpdationTime
    );
    await localForage.setItem(
        HIDDEN_COLLECTION_IDS,
        updatedHiddenCollectionIDs
    );
    return collections;
};

export const getCollection = async (
    collectionID: number
): Promise<Collection> => {
    try {
        const token = getToken();
        if (!token) {
            return;
        }
        const resp = await HTTPService.get(
            `${ENDPOINT}/collections/${collectionID}`,
            null,
            { 'X-Auth-Token': token }
        );
        const key = await getActualKey();
        const collectionWithSecrets = await getCollectionWithSecrets(
            resp.data?.collection,
            key
        );
        return collectionWithSecrets;
    } catch (e) {
        logError(e, 'failed to get collection');
        throw e;
    }
};

export const getCollectionLatestFiles = (
    files: EnteFile[]
): CollectionToFileMap => {
    const latestFiles = new Map<number, EnteFile>();

    files.forEach((file) => {
        if (!latestFiles.has(file.collectionID)) {
            latestFiles.set(file.collectionID, file);
        }
    });
    return latestFiles;
};

export const getCollectionCoverFiles = (
    files: EnteFile[],
    collections: Collection[]
): CollectionToFileMap => {
    const collectionIDToFileMap = groupFilesBasedOnCollectionID(files);

    const coverFiles = new Map<number, EnteFile>();

    collections.forEach((collection) => {
        const collectionFiles = collectionIDToFileMap.get(collection.id);
        if (!collectionFiles || collectionFiles.length === 0) {
            return;
        }
        const coverID = collection.pubMagicMetadata?.data?.coverID;
        if (typeof coverID === 'number' && coverID > 0) {
            const coverFile = collectionFiles.find(
                (file) => file.id === coverID
            );
            if (coverFile) {
                coverFiles.set(collection.id, coverFile);
                return;
            }
        }
        if (collection.pubMagicMetadata?.data?.asc) {
            coverFiles.set(
                collection.id,
                collectionFiles[collectionFiles.length - 1]
            );
        } else {
            coverFiles.set(collection.id, collectionFiles[0]);
        }
    });
    return coverFiles;
};

export const getFavItemIds = async (
    files: EnteFile[]
): Promise<Set<number>> => {
    const favCollection = await getFavCollection();
    if (!favCollection) return new Set();

    return new Set(
        files
            .filter((file) => file.collectionID === favCollection.id)
            .map((file): number => file.id)
    );
};

export const createAlbum = (albumName: string) => {
    return createCollection(albumName, CollectionType.album);
};

const createCollection = async (
    collectionName: string,
    type: CollectionType,
    magicMetadataProps?: CollectionMagicMetadataProps
): Promise<Collection> => {
    try {
        const cryptoWorker = await ComlinkCryptoWorker.getInstance();
        const encryptionKey = await getActualKey();
        const token = getToken();
        const collectionKey = await cryptoWorker.generateEncryptionKey();
        const { encryptedData: encryptedKey, nonce: keyDecryptionNonce } =
            await cryptoWorker.encryptToB64(collectionKey, encryptionKey);
        const { encryptedData: encryptedName, nonce: nameDecryptionNonce } =
            await cryptoWorker.encryptUTF8(collectionName, collectionKey);
        let encryptedMagicMetadata: EncryptedMagicMetadata;
        if (magicMetadataProps) {
            const magicMetadata = await updateMagicMetadata(magicMetadataProps);
            const { file: encryptedMagicMetadataProps } =
                await cryptoWorker.encryptMetadata(
                    magicMetadataProps,
                    collectionKey
                );

            encryptedMagicMetadata = {
                ...magicMetadata,
                data: encryptedMagicMetadataProps.encryptedData,
                header: encryptedMagicMetadataProps.decryptionHeader,
            };
        }
        const newCollection: EncryptedCollection = {
            id: null,
            owner: null,
            encryptedKey,
            keyDecryptionNonce,
            encryptedName,
            nameDecryptionNonce,
            type,
            attributes: {},
            sharees: null,
            updationTime: null,
            isDeleted: false,
            magicMetadata: encryptedMagicMetadata,
            pubMagicMetadata: null,
            sharedMagicMetadata: null,
        };
        const createdCollection = await postCollection(newCollection, token);
        const decryptedCreatedCollection = await getCollectionWithSecrets(
            createdCollection,
            encryptionKey
        );
        return decryptedCreatedCollection;
    } catch (e) {
        logError(e, 'create collection failed');
        throw e;
    }
};

const postCollection = async (
    collectionData: EncryptedCollection,
    token: string
): Promise<EncryptedCollection> => {
    try {
        const response = await HTTPService.post(
            `${ENDPOINT}/collections`,
            collectionData,
            null,
            { 'X-Auth-Token': token }
        );
        return response.data.collection;
    } catch (e) {
        logError(e, 'post Collection failed ');
    }
};

export const createFavoritesCollection = () => {
    return createCollection(FAVORITE_COLLECTION_NAME, CollectionType.favorites);
};

export const addToFavorites = async (file: EnteFile) => {
    try {
        let favCollection = await getFavCollection();
        if (!favCollection) {
            favCollection = await createFavoritesCollection();
        }
        await addToCollection(favCollection, [file]);
    } catch (e) {
        logError(e, 'failed to add to favorite');
    }
};

export const removeFromFavorites = async (file: EnteFile) => {
    try {
        const favCollection = await getFavCollection();
        if (!favCollection) {
            throw Error(CustomError.FAV_COLLECTION_MISSING);
        }
        await removeFromCollection(favCollection.id, [file]);
    } catch (e) {
        logError(e, 'remove from favorite failed');
    }
};

export const addToCollection = async (
    collection: Collection,
    files: EnteFile[]
) => {
    try {
        const token = getToken();
        const batchedFiles = batch(files, REQUEST_BATCH_SIZE);
        for (const batch of batchedFiles) {
            const fileKeysEncryptedWithNewCollection =
                await encryptWithNewCollectionKey(collection, batch);

            const requestBody: AddToCollectionRequest = {
                collectionID: collection.id,
                files: fileKeysEncryptedWithNewCollection,
            };
            await HTTPService.post(
                `${ENDPOINT}/collections/add-files`,
                requestBody,
                null,
                {
                    'X-Auth-Token': token,
                }
            );
        }
    } catch (e) {
        logError(e, 'Add to collection Failed ');
        throw e;
    }
};

export const restoreToCollection = async (
    collection: Collection,
    files: EnteFile[]
) => {
    try {
        const token = getToken();
        const batchedFiles = batch(files, REQUEST_BATCH_SIZE);
        for (const batch of batchedFiles) {
            const fileKeysEncryptedWithNewCollection =
                await encryptWithNewCollectionKey(collection, batch);

            const requestBody: AddToCollectionRequest = {
                collectionID: collection.id,
                files: fileKeysEncryptedWithNewCollection,
            };
            await HTTPService.post(
                `${ENDPOINT}/collections/restore-files`,
                requestBody,
                null,
                {
                    'X-Auth-Token': token,
                }
            );
        }
    } catch (e) {
        logError(e, 'restore to collection Failed ');
        throw e;
    }
};
export const moveToCollection = async (
    fromCollectionID: number,
    toCollection: Collection,
    files: EnteFile[]
) => {
    try {
        const token = getToken();
        const batchedFiles = batch(files, REQUEST_BATCH_SIZE);
        for (const batch of batchedFiles) {
            const fileKeysEncryptedWithNewCollection =
                await encryptWithNewCollectionKey(toCollection, batch);

            const requestBody: MoveToCollectionRequest = {
                fromCollectionID: fromCollectionID,
                toCollectionID: toCollection.id,
                files: fileKeysEncryptedWithNewCollection,
            };
            await HTTPService.post(
                `${ENDPOINT}/collections/move-files`,
                requestBody,
                null,
                {
                    'X-Auth-Token': token,
                }
            );
        }
    } catch (e) {
        logError(e, 'move to collection Failed ');
        throw e;
    }
};

const encryptWithNewCollectionKey = async (
    newCollection: Collection,
    files: EnteFile[]
): Promise<EncryptedFileKey[]> => {
    const fileKeysEncryptedWithNewCollection: EncryptedFileKey[] = [];
    const cryptoWorker = await ComlinkCryptoWorker.getInstance();
    for (const file of files) {
        const newEncryptedKey = await cryptoWorker.encryptToB64(
            file.key,
            newCollection.key
        );
        const encryptedKey = newEncryptedKey.encryptedData;
        const keyDecryptionNonce = newEncryptedKey.nonce;

        fileKeysEncryptedWithNewCollection.push({
            id: file.id,
            encryptedKey,
            keyDecryptionNonce,
        });
    }
    return fileKeysEncryptedWithNewCollection;
};
export const removeFromCollection = async (
    collectionID: number,
    toRemoveFiles: EnteFile[],
    allFiles?: EnteFile[]
) => {
    try {
        const user: User = getData(LS_KEYS.USER);
        const nonUserFiles = [];
        const userFiles = [];
        for (const file of toRemoveFiles) {
            if (file.ownerID === user.id) {
                userFiles.push(file);
            } else {
                nonUserFiles.push(file);
            }
        }

        if (nonUserFiles.length > 0) {
            await removeNonUserFiles(collectionID, nonUserFiles);
        }
        if (userFiles.length > 0) {
            await removeUserFiles(collectionID, userFiles, allFiles);
        }
    } catch (e) {
        logError(e, 'remove from collection failed ');
        throw e;
    }
};

export const removeUserFiles = async (
    sourceCollectionID: number,
    toRemoveFiles: EnteFile[],
    allFiles?: EnteFile[]
) => {
    try {
        if (!allFiles) {
            allFiles = await getLocalFiles();
        }
        const toRemoveFilesIds = new Set(toRemoveFiles.map((f) => f.id));
        const toRemoveFilesCopiesInOtherCollections = allFiles.filter((f) => {
            return toRemoveFilesIds.has(f.id);
        });
        const groupiedFiles = groupFilesBasedOnCollectionID(
            toRemoveFilesCopiesInOtherCollections
        );

        const collections = await getLocalCollections();
        const collectionsMap = new Map(collections.map((c) => [c.id, c]));
        const user: User = getData(LS_KEYS.USER);

        for (const [targetCollectionID, files] of groupiedFiles.entries()) {
            const targetCollection = collectionsMap.get(targetCollectionID);
            if (
                !isValidMoveTarget(sourceCollectionID, targetCollection, user)
            ) {
                continue;
            }
            const toMoveFiles = files.filter((f) => {
                if (toRemoveFilesIds.has(f.id)) {
                    toRemoveFilesIds.delete(f.id);
                    return true;
                }
                return false;
            });
            if (toMoveFiles.length === 0) {
                continue;
            }
            await moveToCollection(
                sourceCollectionID,
                targetCollection,
                toMoveFiles
            );
        }
        const leftFiles = toRemoveFiles.filter((f) =>
            toRemoveFilesIds.has(f.id)
        );

        if (leftFiles.length === 0) {
            return;
        }
        let uncategorizedCollection = await getUncategorizedCollection();
        if (!uncategorizedCollection) {
            uncategorizedCollection = await createUnCategorizedCollection();
        }
        await moveToCollection(
            sourceCollectionID,
            uncategorizedCollection,
            leftFiles
        );
    } catch (e) {
        logError(e, 'remove user files failed ');
        throw e;
    }
};

export const removeNonUserFiles = async (
    collectionID: number,
    nonUserFiles: EnteFile[]
) => {
    try {
        const fileIDs = nonUserFiles.map((f) => f.id);
        const token = getToken();
        const batchedFileIDs = batch(fileIDs, REQUEST_BATCH_SIZE);
        for (const batch of batchedFileIDs) {
            const request: RemoveFromCollectionRequest = {
                collectionID,
                fileIDs: batch,
            };

            await HTTPService.post(
                `${ENDPOINT}/collections/v3/remove-files`,
                request,
                null,
                { 'X-Auth-Token': token }
            );
        }
    } catch (e) {
        logError(e, 'remove non user files failed ');
        throw e;
    }
};

export const deleteCollection = async (
    collectionID: number,
    keepFiles: boolean
) => {
    try {
        if (keepFiles) {
            const allFiles = await getLocalFiles();
            const collectionFiles = allFiles.filter((file) => {
                return file.collectionID === collectionID;
            });
            await removeFromCollection(collectionID, collectionFiles, allFiles);
        }
        const token = getToken();

        await HTTPService.delete(
            `${ENDPOINT}/collections/v3/${collectionID}`,
            null,
            { collectionID, keepFiles },
            { 'X-Auth-Token': token }
        );
    } catch (e) {
        logError(e, 'delete collection failed ');
        throw e;
    }
};

export const leaveSharedAlbum = async (collectionID: number) => {
    try {
        const token = getToken();

        await HTTPService.post(
            `${ENDPOINT}/collections/leave/${collectionID}`,
            null,
            null,
            { 'X-Auth-Token': token }
        );
    } catch (e) {
        logError(e, 'leave shared album failed ');
        throw e;
    }
};

export const updateCollectionMagicMetadata = async (
    collection: Collection,
    updatedMagicMetadata: CollectionMagicMetadata
) => {
    const token = getToken();
    if (!token) {
        return;
    }

    const cryptoWorker = await ComlinkCryptoWorker.getInstance();

    const { file: encryptedMagicMetadata } = await cryptoWorker.encryptMetadata(
        updatedMagicMetadata.data,
        collection.key
    );

    const reqBody: UpdateMagicMetadataRequest = {
        id: collection.id,
        magicMetadata: {
            version: updatedMagicMetadata.version,
            count: updatedMagicMetadata.count,
            data: encryptedMagicMetadata.encryptedData,
            header: encryptedMagicMetadata.decryptionHeader,
        },
    };

    await HTTPService.put(
        `${ENDPOINT}/collections/magic-metadata`,
        reqBody,
        null,
        {
            'X-Auth-Token': token,
        }
    );
    const updatedCollection: Collection = {
        ...collection,
        magicMetadata: {
            ...updatedMagicMetadata,
            version: updatedMagicMetadata.version + 1,
        },
    };
    return updatedCollection;
};

export const updateSharedCollectionMagicMetadata = async (
    collection: Collection,
    updatedMagicMetadata: CollectionMagicMetadata
) => {
    const token = getToken();
    if (!token) {
        return;
    }

    const cryptoWorker = await ComlinkCryptoWorker.getInstance();

    const { file: encryptedMagicMetadata } = await cryptoWorker.encryptMetadata(
        updatedMagicMetadata.data,
        collection.key
    );

    const reqBody: UpdateMagicMetadataRequest = {
        id: collection.id,
        magicMetadata: {
            version: updatedMagicMetadata.version,
            count: updatedMagicMetadata.count,
            data: encryptedMagicMetadata.encryptedData,
            header: encryptedMagicMetadata.decryptionHeader,
        },
    };

    await HTTPService.put(
        `${ENDPOINT}/collections/sharee-magic-metadata`,
        reqBody,
        null,
        {
            'X-Auth-Token': token,
        }
    );
    const updatedCollection: Collection = {
        ...collection,
        magicMetadata: {
            ...updatedMagicMetadata,
            version: updatedMagicMetadata.version + 1,
        },
    };
    return updatedCollection;
};

export const updatePublicCollectionMagicMetadata = async (
    collection: Collection,
    updatedPublicMagicMetadata: CollectionPublicMagicMetadata
) => {
    const token = getToken();
    if (!token) {
        return;
    }

    const cryptoWorker = await ComlinkCryptoWorker.getInstance();

    const { file: encryptedMagicMetadata } = await cryptoWorker.encryptMetadata(
        updatedPublicMagicMetadata.data,
        collection.key
    );

    const reqBody: UpdateMagicMetadataRequest = {
        id: collection.id,
        magicMetadata: {
            version: updatedPublicMagicMetadata.version,
            count: updatedPublicMagicMetadata.count,
            data: encryptedMagicMetadata.encryptedData,
            header: encryptedMagicMetadata.decryptionHeader,
        },
    };

    await HTTPService.put(
        `${ENDPOINT}/collections/public-magic-metadata`,
        reqBody,
        null,
        {
            'X-Auth-Token': token,
        }
    );
    const updatedCollection: Collection = {
        ...collection,
        pubMagicMetadata: {
            ...updatedPublicMagicMetadata,
            version: updatedPublicMagicMetadata.version + 1,
        },
    };
    return updatedCollection;
};

export const renameCollection = async (
    collection: Collection,
    newCollectionName: string
) => {
    if (isQuickLinkCollection(collection)) {
        // Convert quick link collection to normal collection on rename
        await changeCollectionSubType(collection, SUB_TYPE.DEFAULT);
    }
    const token = getToken();
    const cryptoWorker = await ComlinkCryptoWorker.getInstance();
    const { encryptedData: encryptedName, nonce: nameDecryptionNonce } =
        await cryptoWorker.encryptUTF8(newCollectionName, collection.key);
    const collectionRenameRequest = {
        collectionID: collection.id,
        encryptedName,
        nameDecryptionNonce,
    };
    await HTTPService.post(
        `${ENDPOINT}/collections/rename`,
        collectionRenameRequest,
        null,
        {
            'X-Auth-Token': token,
        }
    );
};

export const shareCollection = async (
    collection: Collection,
    withUserEmail: string,
    role: string
) => {
    try {
        const cryptoWorker = await ComlinkCryptoWorker.getInstance();
        const token = getToken();
        const publicKey: string = await getPublicKey(withUserEmail);
        const encryptedKey = await cryptoWorker.boxSeal(
            collection.key,
            publicKey
        );
        const shareCollectionRequest = {
            collectionID: collection.id,
            email: withUserEmail,
            role: role,
            encryptedKey,
        };
        await HTTPService.post(
            `${ENDPOINT}/collections/share`,
            shareCollectionRequest,
            null,
            {
                'X-Auth-Token': token,
            }
        );
    } catch (e) {
        logError(e, 'share collection failed ');
        throw e;
    }
};

export const unshareCollection = async (
    collection: Collection,
    withUserEmail: string
) => {
    try {
        const token = getToken();
        const shareCollectionRequest = {
            collectionID: collection.id,
            email: withUserEmail,
        };
        await HTTPService.post(
            `${ENDPOINT}/collections/unshare`,
            shareCollectionRequest,
            null,
            {
                'X-Auth-Token': token,
            }
        );
    } catch (e) {
        logError(e, 'unshare collection failed ');
    }
};

export const createShareableURL = async (collection: Collection) => {
    try {
        const token = getToken();
        if (!token) {
            return null;
        }
        const createPublicAccessTokenRequest: CreatePublicAccessTokenRequest = {
            collectionID: collection.id,
        };
        const resp = await HTTPService.post(
            `${ENDPOINT}/collections/share-url`,
            createPublicAccessTokenRequest,
            null,
            {
                'X-Auth-Token': token,
            }
        );
        return resp.data.result as PublicURL;
    } catch (e) {
        logError(e, 'createShareableURL failed ');
        throw e;
    }
};

export const deleteShareableURL = async (collection: Collection) => {
    try {
        const token = getToken();
        if (!token) {
            return null;
        }
        await HTTPService.delete(
            `${ENDPOINT}/collections/share-url/${collection.id}`,
            null,
            null,
            {
                'X-Auth-Token': token,
            }
        );
    } catch (e) {
        logError(e, 'deleteShareableURL failed ');
        throw e;
    }
};

export const updateShareableURL = async (
    request: UpdatePublicURL
): Promise<PublicURL> => {
    try {
        const token = getToken();
        if (!token) {
            return null;
        }
        const res = await HTTPService.put(
            `${ENDPOINT}/collections/share-url`,
            request,
            null,
            {
                'X-Auth-Token': token,
            }
        );
        return res.data.result as PublicURL;
    } catch (e) {
        logError(e, 'updateShareableURL failed ');
        throw e;
    }
};

export const getFavCollection = async () => {
    const collections = await getLocalCollections();
    for (const collection of collections) {
        if (collection.type === CollectionType.favorites) {
            return collection;
        }
    }
};

export const getNonEmptyCollections = (
    collections: Collection[],
    files: EnteFile[]
) => {
    const nonEmptyCollectionsIds = new Set<number>();
    for (const file of files) {
        nonEmptyCollectionsIds.add(file.collectionID);
    }
    return collections.filter((collection) =>
        nonEmptyCollectionsIds.has(collection.id)
    );
};

export function sortCollectionSummaries(
    collectionSummaries: CollectionSummary[],
    sortBy: COLLECTION_LIST_SORT_BY
) {
    return collectionSummaries
        .sort((a, b) => {
            switch (sortBy) {
                case COLLECTION_LIST_SORT_BY.CREATION_TIME_ASCENDING:
                    return (
                        -1 *
                        compareCollectionsLatestFile(b.latestFile, a.latestFile)
                    );
                case COLLECTION_LIST_SORT_BY.UPDATION_TIME_DESCENDING:
                    return b.updationTime - a.updationTime;
                case COLLECTION_LIST_SORT_BY.NAME:
                    return a.name.localeCompare(b.name);
            }
        })
        .sort((a, b) => b.order ?? 0 - a.order ?? 0)
        .sort(
            (a, b) =>
                COLLECTION_SORT_ORDER.get(a.type) -
                COLLECTION_SORT_ORDER.get(b.type)
        );
}

function compareCollectionsLatestFile(first: EnteFile, second: EnteFile) {
    if (!first) {
        return 1;
    } else if (!second) {
        return -1;
    } else {
        const sortedFiles = sortFiles([first, second]);
        if (sortedFiles[0].id !== first.id) {
            return 1;
        } else {
            return -1;
        }
    }
}

export function getCollectionSummaries(
    user: User,
    collections: Collection[],
    files: EnteFile[]
): CollectionSummaries {
    const collectionSummaries: CollectionSummaries = new Map();
    const collectionLatestFiles = getCollectionLatestFiles(files);
    const collectionCoverFiles = getCollectionCoverFiles(files, collections);
    const collectionFilesCount = getCollectionsFileCount(files);

    let hasUncategorizedCollection = false;
    for (const collection of collections) {
        if (
            !hasUncategorizedCollection &&
            collection.type === CollectionType.uncategorized
        ) {
            hasUncategorizedCollection = true;
        }
        if (
            collectionFilesCount.get(collection.id) ||
            collection.type === CollectionType.uncategorized
        ) {
            let type: CollectionSummaryType;
            if (isIncomingShare(collection, user)) {
                if (isIncomingCollabShare(collection, user)) {
                    type = CollectionSummaryType.incomingShareCollaborator;
                } else {
                    type = CollectionSummaryType.incomingShareViewer;
                }
            } else if (isOutgoingShare(collection, user)) {
                type = CollectionSummaryType.outgoingShare;
            } else if (isSharedOnlyViaLink(collection)) {
                type = CollectionSummaryType.sharedOnlyViaLink;
            } else if (isArchivedCollection(collection)) {
                type = CollectionSummaryType.archived;
            } else if (isDefaultHiddenCollection(collection)) {
                type = CollectionSummaryType.defaultHidden;
            } else if (isPinnedCollection(collection)) {
                type = CollectionSummaryType.pinned;
            } else {
                type = CollectionSummaryType[collection.type];
            }

            let CollectionSummaryItemName: string;
            if (type === CollectionSummaryType.uncategorized) {
                CollectionSummaryItemName = t('UNCATEGORIZED');
            } else if (type === CollectionSummaryType.favorites) {
                CollectionSummaryItemName = t('FAVORITES');
            } else {
                CollectionSummaryItemName = collection.name;
            }

            collectionSummaries.set(collection.id, {
                id: collection.id,
                name: CollectionSummaryItemName,
                latestFile: collectionLatestFiles.get(collection.id),
                coverFile: collectionCoverFiles.get(collection.id),
                fileCount: collectionFilesCount.get(collection.id) ?? 0,
                updationTime: collection.updationTime,
                type: type,
                order: collection.magicMetadata?.data?.order ?? 0,
            });
        }
    }
    if (!hasUncategorizedCollection) {
        collectionSummaries.set(
            DUMMY_UNCATEGORIZED_COLLECTION,
            getDummyUncategorizedCollectionSummary()
        );
    }

    return collectionSummaries;
}

function getCollectionsFileCount(files: EnteFile[]): CollectionFilesCount {
    const collectionIDToFileMap = groupFilesBasedOnCollectionID(files);
    const collectionFilesCount = new Map<number, number>();
    for (const [id, files] of collectionIDToFileMap) {
        collectionFilesCount.set(id, files.length);
    }
    return collectionFilesCount;
}

export function getSectionSummaries(
    files: EnteFile[],
    trashedFiles: EnteFile[],
    archivedCollections: Set<number>
): CollectionSummaries {
    const collectionSummaries: CollectionSummaries = new Map();
    collectionSummaries.set(
        ALL_SECTION,
        getAllSectionSummary(files, archivedCollections)
    );
    collectionSummaries.set(
        TRASH_SECTION,
        getTrashedCollectionSummary(trashedFiles)
    );
    collectionSummaries.set(ARCHIVE_SECTION, getArchivedSectionSummary(files));

    return collectionSummaries;
}

function getAllSectionSummary(
    files: EnteFile[],
    archivedCollections: Set<number>
): CollectionSummary {
    const allSectionFiles = getAllSectionVisibleFiles(
        files,
        archivedCollections
    );
    return {
        id: ALL_SECTION,
        name: t('ALL_SECTION_NAME'),
        type: CollectionSummaryType.all,
        coverFile: allSectionFiles?.[0],
        latestFile: allSectionFiles?.[0],
        fileCount: allSectionFiles?.length || 0,
        updationTime: allSectionFiles?.[0]?.updationTime,
    };
}

function getAllSectionVisibleFiles(
    files: EnteFile[],
    archivedCollections: Set<number>
): EnteFile[] {
    const allSectionVisibleFiles = getUniqueFiles(
        files.filter((file) => {
            if (
                isArchivedFile(file) ||
                archivedCollections.has(file.collectionID)
            ) {
                return false;
            }
            return true;
        })
    );
    return allSectionVisibleFiles;
}

export function getDummyUncategorizedCollectionSummary(): CollectionSummary {
    return {
        id: DUMMY_UNCATEGORIZED_COLLECTION,
        name: t('UNCATEGORIZED'),
        type: CollectionSummaryType.uncategorized,
        latestFile: null,
        coverFile: null,
        fileCount: 0,
        updationTime: 0,
    };
}

export function getArchivedSectionSummary(
    files: EnteFile[]
): CollectionSummary {
    const archivedFiles = getUniqueFiles(
        files.filter((file) => isArchivedFile(file))
    );
    return {
        id: ARCHIVE_SECTION,
        name: t('ARCHIVE_SECTION_NAME'),
        type: CollectionSummaryType.archive,
        coverFile: null,
        latestFile: archivedFiles?.[0],
        fileCount: archivedFiles?.length,
        updationTime: archivedFiles?.[0]?.updationTime,
    };
}

export function getHiddenItemsSummary(
    hiddenFiles: EnteFile[],
    hiddenCollections: Collection[]
): CollectionSummary {
    const defaultHiddenCollectionIds = new Set(
        hiddenCollections
            .filter((collection) => isDefaultHiddenCollection(collection))
            .map((collection) => collection.id)
    );
    const hiddenItems = getUniqueFiles(
        hiddenFiles.filter((file) =>
            defaultHiddenCollectionIds.has(file.collectionID)
        )
    );
    return {
        id: HIDDEN_ITEMS_SECTION,
        name: t('HIDDEN_ITEMS'),
        type: CollectionSummaryType.hiddenItems,
        coverFile: hiddenItems?.[0],
        latestFile: hiddenItems?.[0],
        fileCount: hiddenItems?.length,
        updationTime: hiddenItems?.[0]?.updationTime,
    };
}

export function getTrashedCollectionSummary(
    trashedFiles: EnteFile[]
): CollectionSummary {
    return {
        id: TRASH_SECTION,
        name: t('TRASH'),
        type: CollectionSummaryType.trash,
        coverFile: null,
        latestFile: trashedFiles?.[0],
        fileCount: trashedFiles?.length,
        updationTime: trashedFiles?.[0]?.updationTime,
    };
}

export async function getUncategorizedCollection(
    collections?: Collection[]
): Promise<Collection> {
    if (!collections) {
        collections = await getLocalCollections();
    }
    const uncategorizedCollection = collections.find(
        (collection) => collection.type === CollectionType.uncategorized
    );

    return uncategorizedCollection;
}

export function createUnCategorizedCollection() {
    return createCollection(
        UNCATEGORIZED_COLLECTION_NAME,
        CollectionType.uncategorized
    );
}

export async function getDefaultHiddenCollection(): Promise<Collection> {
    const collections = await getLocalCollections('hidden');
    const hiddenCollection = collections.find((collection) =>
        isDefaultHiddenCollection(collection)
    );

    return hiddenCollection;
}

export function createHiddenCollection() {
    return createCollection(HIDDEN_COLLECTION_NAME, CollectionType.album, {
        subType: SUB_TYPE.DEFAULT_HIDDEN,
        visibility: VISIBILITY_STATE.HIDDEN,
    });
}

export async function moveToHiddenCollection(files: EnteFile[]) {
    try {
        let hiddenCollection = await getDefaultHiddenCollection();
        if (!hiddenCollection) {
            hiddenCollection = await createHiddenCollection();
        }
        const groupiedFiles = groupFilesBasedOnCollectionID(files);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [collectionID, files] of groupiedFiles.entries()) {
            if (collectionID === hiddenCollection.id) {
                continue;
            }
            await moveToCollection(collectionID, hiddenCollection, files);
        }
    } catch (e) {
        logError(e, 'move to hidden collection failed ');
        throw e;
    }
}

export async function unhideToCollection(
    collection: Collection,
    files: EnteFile[]
) {
    try {
        const groupiedFiles = groupFilesBasedOnCollectionID(files);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [collectionID, files] of groupiedFiles.entries()) {
            if (collectionID === collection.id) {
                continue;
            }
            await moveToCollection(collectionID, collection, files);
        }
    } catch (e) {
        logError(e, 'unhide to collection failed ');
        throw e;
    }
}

export const constructUserIDToEmailMap = (
    user: User,
    collections: Collection[]
): Map<number, string> => {
    try {
        const userIDToEmailMap = new Map<number, string>();
        collections.forEach((item) => {
            const { owner, sharees } = item;
            if (user.id !== owner.id && owner.email) {
                userIDToEmailMap.set(owner.id, owner.email);
            }
            if (sharees) {
                sharees.forEach((item) => {
                    if (item.id !== user.id)
                        userIDToEmailMap.set(item.id, item.email);
                });
            }
        });
        return userIDToEmailMap;
    } catch (e) {
        logError('Error Mapping UserId to email:', e);
        return new Map<number, string>();
    }
};

export const constructEmailList = (
    user: User,
    collections: Collection[],
    familyData: FamilyData
): string[] => {
    const emails = collections
        .map((item) => {
            const { owner, sharees } = item;
            if (owner.email && item.owner.id !== user.id) {
                return [item.owner.email];
            } else {
                if (!sharees?.length) {
                    return [];
                }
                const shareeEmails = item.sharees
                    .filter((sharee) => sharee.email !== user.email)
                    .map((sharee) => sharee.email);
                return shareeEmails;
            }
        })
        .flat();

    // adding family members
    if (familyData) {
        const family = familyData.members.map((member) => member.email);
        emails.push(...family);
    }
    return Array.from(new Set(emails));
};
