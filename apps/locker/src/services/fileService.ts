import { getEndpoint } from 'utils/common/apiUtil';
import localForage from 'utils/storage/localForage';

import { getToken } from 'utils/common/key';
import { Collection } from 'interfaces/collection';
import HTTPService from './HTTPService';
import { logError } from 'utils/sentry';
import {
    decryptFile,
    getLatestVersionFiles,
    mergeMetadata,
    sortFiles,
} from 'utils/file';
import { eventBus, Events } from './events';
import { EnteFile, EncryptedEnteFile, TrashRequest } from 'interfaces/file';
import { SetFiles } from 'interfaces/gallery';
import { BulkUpdateMagicMetadataRequest } from 'interfaces/magicMetadata';
import { addLogLine } from 'utils/logging';
import { isCollectionHidden } from 'utils/collection';
import { CustomError } from 'utils/error';
import ComlinkCryptoWorker from 'utils/comlink/ComlinkCryptoWorker';
import {
    getCollectionLastSyncTime,
    setCollectionLastSyncTime,
} from './collectionService';
import { REQUEST_BATCH_SIZE } from 'constants/api';
import { batch } from 'utils/common';

const ENDPOINT = getEndpoint();
const FILES_TABLE = 'files';

export const getLocalFiles = async () => {
    const files: Array<EnteFile> =
        (await localForage.getItem<EnteFile[]>(FILES_TABLE)) || [];
    return files;
};

const setLocalFiles = async (files: EnteFile[]) => {
    try {
        await localForage.setItem(FILES_TABLE, files);
        try {
            eventBus.emit(Events.LOCAL_FILES_UPDATED);
        } catch (e) {
            logError(e, 'Error in localFileUpdated handlers');
        }
    } catch (e1) {
        try {
            const storageEstimate = await navigator.storage.estimate();
            logError(e1, 'failed to save files to indexedDB', {
                storageEstimate,
            });
            addLogLine(`storage estimate ${JSON.stringify(storageEstimate)}`);
        } catch (e2) {
            logError(e1, 'failed to save files to indexedDB');
            logError(e2, 'failed to get storage stats');
        }
        throw e1;
    }
};

export const syncFiles = async (
    collections: Collection[]
): Promise<EnteFile[]> => {
    const localFiles = await getLocalFiles();
    let files = await removeDeletedCollectionFiles(collections, localFiles);
    if (files.length !== localFiles.length) {
        addLogLine(`removed ${localFiles.length - files.length} files`);
        await setLocalFiles(files);
        files = sortFiles(mergeMetadata(files));
    }
    for (const collection of collections) {
        if (!getToken()) {
            continue;
        }
        if (isCollectionHidden(collection)) {
            throw Error(CustomError.HIDDEN_COLLECTION_SYNC_FILE_ATTEMPTED);
        }
        const lastSyncTime = await getCollectionLastSyncTime(collection);
        if (collection.updationTime === lastSyncTime) {
            addLogLine(
                `this collection is already up to date ${collection.name}`
            );
            continue;
        }
        addLogLine(`syncing collection ${collection.name}`);
        const newFiles = await getFiles(collection, lastSyncTime);
        addLogLine(`newFiles, ${newFiles}`);
        const mergedArrays = [...files, ...newFiles];
        addLogLine(`mergedArrays, ${mergedArrays}`);
        files = getLatestVersionFiles(mergedArrays);
        await setLocalFiles(files);
        setCollectionLastSyncTime(collection, collection.updationTime);
    }
    return files;
};

export const getFiles = async (
    collection: Collection,
    sinceTime: number
): Promise<EnteFile[]> => {
    try {
        let decryptedFiles: EnteFile[] = [];
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

            const diffResults = resp.data.diff; // the newly updated files. e.g.: a deleted file is sent as a new file with isDeleted set to true.
            addLogLine(`diff results ${JSON.stringify(diffResults)}`);

            const newDecryptedFilesBatch = await Promise.all(
                diffResults.map(async (file: EncryptedEnteFile) => {
                    // only decrypt the file if it's not deleted
                    if (!file.isDeleted) {
                        return await decryptFile(file, collection.key);
                    } else {
                        return file;
                    }
                }) as Promise<EnteFile>[]
            );

            addLogLine(
                `newDecryptedFilesBatch ${JSON.stringify(
                    newDecryptedFilesBatch
                )}`
            );
            // merge the new files with the existing files. diff results are appended.
            decryptedFiles = [...decryptedFiles, ...newDecryptedFilesBatch];
            addLogLine(`merged files ${JSON.stringify(decryptedFiles)}`);
            // setFiles((files) =>
            decryptedFiles = sortFiles(mergeMetadata(decryptedFiles));
            // );
            if (diffResults.length) {
                time = resp.data.diff.slice(-1)[0].updationTime;
            }
        } while (resp.data.hasMore);
        return decryptedFiles;
    } catch (e) {
        logError(e, 'Get files failed');
        throw e;
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
        const batchedFilesToTrash = batch(filesToTrash, REQUEST_BATCH_SIZE);
        for (const batch of batchedFilesToTrash) {
            const trashRequest: TrashRequest = {
                items: batch.map((file) => ({
                    fileID: file.id,
                    collectionID: file.collectionID,
                })),
            };
            await HTTPService.post(
                `${ENDPOINT}/files/trash`,
                trashRequest,
                null,
                {
                    'X-Auth-Token': token,
                }
            );
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
        const batchedFilesToDelete = batch(filesToDelete, REQUEST_BATCH_SIZE);

        for (const batch of batchedFilesToDelete) {
            await HTTPService.post(
                `${ENDPOINT}/trash/delete`,
                { fileIDs: batch },
                null,
                {
                    'X-Auth-Token': token,
                }
            );
        }
    } catch (e) {
        logError(e, 'deleteFromTrash failed');
        throw e;
    }
};

export const updateFileMagicMetadata = async (files: EnteFile[]) => {
    const token = getToken();
    if (!token) {
        return;
    }
    const reqBody: BulkUpdateMagicMetadataRequest = { metadataList: [] };
    const cryptoWorker = await ComlinkCryptoWorker.getInstance();
    for (const file of files) {
        const { file: encryptedMagicMetadata } =
            await cryptoWorker.encryptMetadata(
                file.magicMetadata.data,
                file.key
            );
        reqBody.metadataList.push({
            id: file.id,
            magicMetadata: {
                version: file.magicMetadata.version,
                count: file.magicMetadata.count,
                data: encryptedMagicMetadata.encryptedData,
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
    const cryptoWorker = await ComlinkCryptoWorker.getInstance();
    for (const file of files) {
        const { file: encryptedPubMagicMetadata } =
            await cryptoWorker.encryptMetadata(
                file.pubMagicMetadata.data,
                file.key
            );
        reqBody.metadataList.push({
            id: file.id,
            magicMetadata: {
                version: file.pubMagicMetadata.version,
                count: file.pubMagicMetadata.count,
                data: encryptedPubMagicMetadata.encryptedData,
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
