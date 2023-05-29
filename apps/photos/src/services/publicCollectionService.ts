import { getEndpoint } from 'utils/common/apiUtil';
import localForage from 'utils/storage/localForage';
import { Collection, CollectionPublicMagicMetadata } from 'types/collection';
import HTTPService from './HTTPService';
import { logError } from 'utils/sentry';
import { decryptFile, mergeMetadata, sortFiles } from 'utils/file';
import { EncryptedEnteFile, EnteFile } from 'types/file';
import {
    AbuseReportDetails,
    AbuseReportRequest,
    LocalSavedPublicCollectionFiles,
} from 'types/publicCollection';
import { REPORT_REASON } from 'constants/publicCollection';
import { CustomError, parseSharingErrorCodes } from 'utils/error';
import ComlinkCryptoWorker from 'utils/comlink/ComlinkCryptoWorker';

const ENDPOINT = getEndpoint();
const PUBLIC_COLLECTION_FILES_TABLE = 'public-collection-files';
const PUBLIC_COLLECTIONS_TABLE = 'public-collections';

export const getPublicCollectionUID = (token: string) => `${token}`;

const getPublicCollectionLastSyncTimeKey = (collectionUID: string) =>
    `public-${collectionUID}-time`;

const getPublicCollectionPasswordKey = (collectionUID: string) =>
    `public-${collectionUID}-passkey`;

const getPublicCollectionUploaderNameKey = (collectionUID: string) =>
    `public-${collectionUID}-uploaderName`;

export const getPublicCollectionUploaderName = async (collectionUID: string) =>
    await localForage.getItem<string>(
        getPublicCollectionUploaderNameKey(collectionUID)
    );

export const savePublicCollectionUploaderName = async (
    collectionUID: string,
    uploaderName: string
) =>
    await localForage.setItem(
        getPublicCollectionUploaderNameKey(collectionUID),
        uploaderName
    );

export const getLocalPublicFiles = async (collectionUID: string) => {
    const localSavedPublicCollectionFiles =
        (
            (await localForage.getItem<LocalSavedPublicCollectionFiles[]>(
                PUBLIC_COLLECTION_FILES_TABLE
            )) || []
        ).find(
            (localSavedPublicCollectionFiles) =>
                localSavedPublicCollectionFiles.collectionUID === collectionUID
        ) ||
        ({
            collectionUID: null,
            files: [] as EnteFile[],
        } as LocalSavedPublicCollectionFiles);
    return localSavedPublicCollectionFiles.files;
};
export const savePublicCollectionFiles = async (
    collectionUID: string,
    files: EnteFile[]
) => {
    const publicCollectionFiles =
        (await localForage.getItem<LocalSavedPublicCollectionFiles[]>(
            PUBLIC_COLLECTION_FILES_TABLE
        )) || [];
    await localForage.setItem(
        PUBLIC_COLLECTION_FILES_TABLE,
        dedupeCollectionFiles([
            { collectionUID, files },
            ...publicCollectionFiles,
        ])
    );
};

export const getLocalPublicCollectionPassword = async (
    collectionUID: string
): Promise<string> => {
    return (
        (await localForage.getItem<string>(
            getPublicCollectionPasswordKey(collectionUID)
        )) || ''
    );
};

export const savePublicCollectionPassword = async (
    collectionUID: string,
    passToken: string
): Promise<string> => {
    return await localForage.setItem<string>(
        getPublicCollectionPasswordKey(collectionUID),
        passToken
    );
};

export const getLocalPublicCollection = async (collectionKey: string) => {
    const localCollections =
        (await localForage.getItem<Collection[]>(PUBLIC_COLLECTIONS_TABLE)) ||
        [];
    const publicCollection =
        localCollections.find(
            (localSavedPublicCollection) =>
                localSavedPublicCollection.key === collectionKey
        ) || null;
    return publicCollection;
};

export const savePublicCollection = async (collection: Collection) => {
    const publicCollections =
        (await localForage.getItem<Collection[]>(PUBLIC_COLLECTIONS_TABLE)) ??
        [];
    await localForage.setItem(
        PUBLIC_COLLECTIONS_TABLE,
        dedupeCollections([collection, ...publicCollections])
    );
};

const dedupeCollections = (collections: Collection[]) => {
    const keySet = new Set([]);
    return collections.filter((collection) => {
        if (!keySet.has(collection.key)) {
            keySet.add(collection.key);
            return true;
        } else {
            return false;
        }
    });
};

const dedupeCollectionFiles = (
    collectionFiles: LocalSavedPublicCollectionFiles[]
) => {
    const keySet = new Set([]);
    return collectionFiles.filter(({ collectionUID }) => {
        if (!keySet.has(collectionUID)) {
            keySet.add(collectionUID);
            return true;
        } else {
            return false;
        }
    });
};

const getPublicCollectionLastSyncTime = async (collectionUID: string) =>
    (await localForage.getItem<number>(
        getPublicCollectionLastSyncTimeKey(collectionUID)
    )) ?? 0;

const savePublicCollectionLastSyncTime = async (
    collectionUID: string,
    time: number
) =>
    await localForage.setItem(
        getPublicCollectionLastSyncTimeKey(collectionUID),
        time
    );

export const syncPublicFiles = async (
    token: string,
    passwordToken: string,
    collection: Collection,
    setPublicFiles: (files: EnteFile[]) => void
) => {
    try {
        let files: EnteFile[] = [];
        const sortAsc = collection?.pubMagicMetadata?.data.asc ?? false;
        const collectionUID = getPublicCollectionUID(token);
        const localFiles = await getLocalPublicFiles(collectionUID);

        files = [...files, ...localFiles];
        try {
            if (!token) {
                return sortFiles(files, sortAsc);
            }
            const lastSyncTime = await getPublicCollectionLastSyncTime(
                collectionUID
            );
            if (collection.updationTime === lastSyncTime) {
                return sortFiles(files, sortAsc);
            }
            const fetchedFiles = await getPublicFiles(
                token,
                passwordToken,
                collection,
                lastSyncTime,
                files,
                setPublicFiles
            );

            files = [...files, ...fetchedFiles];
            const latestVersionFiles = new Map<string, EnteFile>();
            files.forEach((file) => {
                const uid = `${file.collectionID}-${file.id}`;
                if (
                    !latestVersionFiles.has(uid) ||
                    latestVersionFiles.get(uid).updationTime < file.updationTime
                ) {
                    latestVersionFiles.set(uid, file);
                }
            });
            files = [];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [_, file] of latestVersionFiles) {
                if (file.isDeleted) {
                    continue;
                }
                files.push(file);
            }
            await savePublicCollectionFiles(collectionUID, files);
            await savePublicCollectionLastSyncTime(
                collectionUID,
                collection.updationTime
            );
            setPublicFiles([...sortFiles(mergeMetadata(files), sortAsc)]);
        } catch (e) {
            const parsedError = parseSharingErrorCodes(e);
            logError(e, 'failed to sync shared collection files');
            if (parsedError.message === CustomError.TOKEN_EXPIRED) {
                throw e;
            }
        }
        return [...sortFiles(mergeMetadata(files), sortAsc)];
    } catch (e) {
        logError(e, 'failed to get local  or sync shared collection files');
        throw e;
    }
};

const getPublicFiles = async (
    token: string,
    passwordToken: string,
    collection: Collection,
    sinceTime: number,
    files: EnteFile[],
    setPublicFiles: (files: EnteFile[]) => void
): Promise<EnteFile[]> => {
    try {
        let decryptedFiles: EnteFile[] = [];
        let time = sinceTime;
        let resp;
        const sortAsc = collection?.pubMagicMetadata?.data.asc ?? false;
        do {
            if (!token) {
                break;
            }
            resp = await HTTPService.get(
                `${ENDPOINT}/public-collection/diff`,
                {
                    sinceTime: time,
                },
                {
                    'Cache-Control': 'no-cache',
                    'X-Auth-Access-Token': token,
                    ...(passwordToken && {
                        'X-Auth-Access-Token-JWT': passwordToken,
                    }),
                }
            );
            decryptedFiles = [
                ...decryptedFiles,
                ...(await Promise.all(
                    resp.data.diff.map(async (file: EncryptedEnteFile) => {
                        if (!file.isDeleted) {
                            return await decryptFile(file, collection.key);
                        } else {
                            return file;
                        }
                    }) as Promise<EnteFile>[]
                )),
            ];

            if (resp.data.diff.length) {
                time = resp.data.diff.slice(-1)[0].updationTime;
            }
            setPublicFiles(
                sortFiles(
                    mergeMetadata(
                        [...(files || []), ...decryptedFiles].filter(
                            (item) => !item.isDeleted
                        )
                    ),
                    sortAsc
                )
            );
        } while (resp.data.hasMore);
        return decryptedFiles;
    } catch (e) {
        logError(e, 'Get public  files failed');
        throw e;
    }
};

export const getPublicCollection = async (
    token: string,
    collectionKey: string
): Promise<Collection> => {
    try {
        if (!token) {
            return;
        }
        const resp = await HTTPService.get(
            `${ENDPOINT}/public-collection/info`,
            null,
            { 'Cache-Control': 'no-cache', 'X-Auth-Access-Token': token }
        );
        const fetchedCollection = resp.data.collection;

        const cryptoWorker = await ComlinkCryptoWorker.getInstance();

        const collectionName = (fetchedCollection.name =
            fetchedCollection.name ||
            (await cryptoWorker.decryptToUTF8(
                fetchedCollection.encryptedName,
                fetchedCollection.nameDecryptionNonce,
                collectionKey
            )));

        let collectionPublicMagicMetadata: CollectionPublicMagicMetadata;
        if (fetchedCollection.pubMagicMetadata?.data) {
            collectionPublicMagicMetadata = {
                ...fetchedCollection.pubMagicMetadata,
                data: await cryptoWorker.decryptMetadata(
                    fetchedCollection.pubMagicMetadata.data,
                    fetchedCollection.pubMagicMetadata.header,
                    collectionKey
                ),
            };
        }

        const collection = {
            ...fetchedCollection,
            name: collectionName,
            key: collectionKey,
            pubMagicMetadata: collectionPublicMagicMetadata,
        };
        await savePublicCollection(collection);
        return collection;
    } catch (e) {
        logError(e, 'failed to get public collection');
        throw e;
    }
};

export const verifyPublicCollectionPassword = async (
    token: string,
    passwordHash: string
): Promise<string> => {
    try {
        const resp = await HTTPService.post(
            `${ENDPOINT}/public-collection/verify-password`,
            { passHash: passwordHash },
            null,
            { 'Cache-Control': 'no-cache', 'X-Auth-Access-Token': token }
        );
        const jwtToken = resp.data.jwtToken;
        return jwtToken;
    } catch (e) {
        logError(e, 'failed to verify public collection password');
        throw e;
    }
};

export const reportAbuse = async (
    token: string,
    url: string,
    reason: REPORT_REASON,
    details: AbuseReportDetails
) => {
    try {
        if (!token) {
            return;
        }
        const abuseReportRequest: AbuseReportRequest = { url, reason, details };

        await HTTPService.post(
            `${ENDPOINT}/public-collection/report-abuse`,
            abuseReportRequest,
            null,
            { 'X-Auth-Access-Token': token }
        );
    } catch (e) {
        logError(e, 'failed to post abuse report');
        throw e;
    }
};

export const removePublicCollectionWithFiles = async (
    collectionUID: string,
    collectionKey: string
) => {
    const publicCollections =
        (await localForage.getItem<Collection[]>(PUBLIC_COLLECTIONS_TABLE)) ||
        [];
    await localForage.setItem(
        PUBLIC_COLLECTIONS_TABLE,
        publicCollections.filter(
            (collection) => collection.key !== collectionKey
        )
    );
    await removePublicFiles(collectionUID);
};

export const removePublicFiles = async (collectionUID: string) => {
    await localForage.removeItem(getPublicCollectionPasswordKey(collectionUID));
    await localForage.removeItem(
        getPublicCollectionLastSyncTimeKey(collectionUID)
    );

    const publicCollectionFiles =
        (await localForage.getItem<LocalSavedPublicCollectionFiles[]>(
            PUBLIC_COLLECTION_FILES_TABLE
        )) ?? [];
    await localForage.setItem(
        PUBLIC_COLLECTION_FILES_TABLE,
        publicCollectionFiles.filter(
            (collectionFiles) => collectionFiles.collectionUID !== collectionUID
        )
    );
};
