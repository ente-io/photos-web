import { getEndpoint } from 'utils/common/apiUtil';
import localForage from 'utils/storage/localForage';

import { getToken } from 'utils/common/key';
import { EncryptionResult } from 'types/upload';
import { Collection } from 'types/collection';
import HTTPService from './HTTPService';
import { logError } from 'utils/sentry';
import {
    decryptFile,
    mergeMetadata,
    preservePhotoswipeProps,
    sortFiles,
} from 'utils/file';
import CryptoWorker from 'utils/crypto';
import { EnteFile, TrashRequest } from 'types/file';
import { SetFiles } from 'types/gallery';
import { MAX_TRASH_BATCH_SIZE } from 'constants/file';
import { BulkUpdateMagicMetadataRequest } from 'types/magicMetadata';
import { logUploadInfo } from 'utils/upload';

const ENDPOINT = getEndpoint();
const FILES_TABLE = 'files';

export const getLocalFiles = async () => {
    const files: Array<EnteFile> =
        (await localForage.getItem<EnteFile[]>(FILES_TABLE)) || [];
    return files;
};

export const setLocalFiles = async (files: EnteFile[]) => {
    try {
        await localForage.setItem(FILES_TABLE, files);
    } catch (e1) {
        try {
            const storageEstimate = await navigator.storage.estimate();
            logError(e1, 'failed to save files to indexedDB', {
                storageEstimate,
            });
            logUploadInfo(
                `storage estimate ${JSON.stringify(storageEstimate)}`
            );
        } catch (e2) {
            logError(e1, 'failed to save files to indexedDB');
            logError(e2, 'failed to get storage stats');
        }
        throw e1;
    }
};

const getCollectionLastSyncTime = async (collection: Collection) =>
    (await localForage.getItem<number>(`${collection.id}-time`)) ?? 0;

export const syncFiles = async (
    collections: Collection[],
    setFiles: SetFiles
) => {
    const localFiles = await getLocalFiles();
    let files = await removeDeletedCollectionFiles(collections, localFiles);
    if (files.length !== localFiles.length) {
        await setLocalFiles(files);
        setFiles(preservePhotoswipeProps([...sortFiles(mergeMetadata(files))]));
    }
    for (const collection of collections) {
        if (!getToken()) {
            continue;
        }
        const lastSyncTime = await getCollectionLastSyncTime(collection);
        if (collection.updationTime === lastSyncTime) {
            continue;
        }
        const fetchedFiles =
            (await getFiles(collection, lastSyncTime, files, setFiles)) ?? [];
        files.push(...fetchedFiles);
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
        await setLocalFiles(files);
        await localForage.setItem(
            `${collection.id}-time`,
            collection.updationTime
        );
        setFiles(preservePhotoswipeProps([...sortFiles(mergeMetadata(files))]));
    }
    return sortFiles(mergeMetadata(files));
};

export const getFiles = async (
    collection: Collection,
    sinceTime: number,
    files: EnteFile[],
    setFiles: SetFiles
): Promise<EnteFile[]> => {
    try {
        const decryptedFiles: EnteFile[] = [];
        let time = sinceTime;
        let resp;
        do {
            const token = getToken();
            if (!token) {
                break;
            }
            resp = await HTTPService.get(
                `${ENDPOINT}/collections/v2/diff`,
                {
                    collectionID: collection.id,
                    sinceTime: time,
                },
                {
                    'X-Auth-Token': token,
                }
            );

            decryptedFiles.push(
                ...(await Promise.all(
                    resp.data.diff.map(async (file: EnteFile) => {
                        if (!file.isDeleted) {
                            file = await decryptFile(file, collection.key);
                        }
                        return file;
                    }) as Promise<EnteFile>[]
                ))
            );

            if (resp.data.diff.length) {
                time = resp.data.diff.slice(-1)[0].updationTime;
            }
            setFiles(
                preservePhotoswipeProps(
                    sortFiles(
                        mergeMetadata(
                            [...(files || []), ...decryptedFiles].filter(
                                (item) => !item.isDeleted
                            )
                        )
                    )
                )
            );
        } while (resp.data.hasMore);
        return decryptedFiles;
    } catch (e) {
        logError(e, 'Get files failed');
    }
};

const removeDeletedCollectionFiles = async (
    collections: Collection[],
    files: EnteFile[]
) => {
    const syncedCollectionIds = new Set<number>();
    for (const collection of collections) {
        syncedCollectionIds.add(collection.id);
    }
    files = files.filter((file) => syncedCollectionIds.has(file.collectionID));
    return files;
};

export const trashFiles = async (filesToTrash: EnteFile[]) => {
    try {
        const token = getToken();
        if (!token) {
            return;
        }

        const trashBatch: TrashRequest = {
            items: [],
        };

        for (const file of filesToTrash) {
            trashBatch.items.push({
                collectionID: file.collectionID,
                fileID: file.id,
            });
            if (trashBatch.items.length >= MAX_TRASH_BATCH_SIZE) {
                await trashFilesFromServer(trashBatch, token);
                trashBatch.items = [];
            }
        }

        if (trashBatch.items.length > 0) {
            await trashFilesFromServer(trashBatch, token);
        }
    } catch (e) {
        logError(e, 'trash file failed');
        throw e;
    }
};

export const deleteFromTrash = async (filesToDelete: number[]) => {
    try {
        const token = getToken();
        if (!token) {
            return;
        }
        await HTTPService.post(
            `${ENDPOINT}/trash/delete`,
            { fileIDs: filesToDelete },
            null,
            {
                'X-Auth-Token': token,
            }
        );
    } catch (e) {
        logError(e, 'delete from trash failed');
        throw e;
    }
};

export const updateFileMagicMetadata = async (files: EnteFile[]) => {
    const token = getToken();
    if (!token) {
        return;
    }
    const reqBody: BulkUpdateMagicMetadataRequest = { metadataList: [] };
    const worker = await new CryptoWorker();
    for (const file of files) {
        const { file: encryptedMagicMetadata }: EncryptionResult =
            await worker.encryptMetadata(file.magicMetadata.data, file.key);
        reqBody.metadataList.push({
            id: file.id,
            magicMetadata: {
                version: file.magicMetadata.version,
                count: file.magicMetadata.count,
                data: encryptedMagicMetadata.encryptedData as unknown as string,
                header: encryptedMagicMetadata.decryptionHeader,
            },
        });
    }
    await HTTPService.put(`${ENDPOINT}/files/magic-metadata`, reqBody, null, {
        'X-Auth-Token': token,
    });
    return files.map(
        (file): EnteFile => ({
            ...file,
            magicMetadata: {
                ...file.magicMetadata,
                version: file.magicMetadata.version + 1,
            },
        })
    );
};

export const updateFilePublicMagicMetadata = async (files: EnteFile[]) => {
    const token = getToken();
    if (!token) {
        return;
    }
    const reqBody: BulkUpdateMagicMetadataRequest = { metadataList: [] };
    const worker = await new CryptoWorker();
    for (const file of files) {
        const { file: encryptedPubMagicMetadata }: EncryptionResult =
            await worker.encryptMetadata(file.pubMagicMetadata.data, file.key);
        reqBody.metadataList.push({
            id: file.id,
            magicMetadata: {
                version: file.pubMagicMetadata.version,
                count: file.pubMagicMetadata.count,
                data: encryptedPubMagicMetadata.encryptedData as unknown as string,
                header: encryptedPubMagicMetadata.decryptionHeader,
            },
        });
    }
    await HTTPService.put(
        `${ENDPOINT}/files/public-magic-metadata`,
        reqBody,
        null,
        {
            'X-Auth-Token': token,
        }
    );
    return files.map(
        (file): EnteFile => ({
            ...file,
            pubMagicMetadata: {
                ...file.pubMagicMetadata,
                version: file.pubMagicMetadata.version + 1,
            },
        })
    );
};

async function trashFilesFromServer(trashBatch: TrashRequest, token: any) {
    try {
        await HTTPService.post(`${ENDPOINT}/files/trash`, trashBatch, null, {
            'X-Auth-Token': token,
        });
    } catch (e) {
        logError(e, 'trash files from server failed');
        throw e;
    }
}
