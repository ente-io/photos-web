import { getEndpoint } from 'utils/common/apiUtil';
import localForage from 'utils/storage/localForage';

import { getToken } from 'utils/common/key';
import { DataStream, MetadataObject } from './upload/uploadService';
import { Collection } from './collectionService';
import HTTPService from './HTTPService';
import { logError } from 'utils/sentry';
import { appendPhotoSwipeProps, decryptFile, sortFiles } from 'utils/file';

const ENDPOINT = getEndpoint();
const DIFF_LIMIT: number = 1000;

const FILES_TABLE = 'files';

export interface fileAttribute {
    encryptedData?: DataStream | Uint8Array;
    objectKey?: string;
    decryptionHeader: string;
}

export enum FILE_TYPE {
    IMAGE,
    VIDEO,
    LIVE_PHOTO,
    OTHERS,
}

/*  Build error occurred
    ReferenceError: Cannot access 'FILE_TYPE' before initialization
    when it was placed in readFileService
*/
// list of format that were missed by type-detection for some files.
export const FORMAT_MISSED_BY_FILE_TYPE_LIB = [
    { fileType: FILE_TYPE.IMAGE, exactType: 'jpeg' },
    { fileType: FILE_TYPE.IMAGE, exactType: 'jpg' },
    { fileType: FILE_TYPE.VIDEO, exactType: 'webm' },
];

export enum VISIBILITY_STATE {
    VISIBLE,
    ARCHIVED,
}
export interface MagicMetadataProps {
    visibility?: VISIBILITY_STATE;
}
export interface MagicMetadata {
    version: number;
    count: number;
    data: string | MagicMetadataProps;
    header: string;
}
export interface File {
    id: number;
    collectionID: number;
    ownerID: number;
    file: fileAttribute;
    thumbnail: fileAttribute;
    metadata: MetadataObject;
    magicMetadata: MagicMetadata;
    encryptedKey: string;
    keyDecryptionNonce: string;
    key: string;
    src: string;
    msrc: string;
    html: string;
    w: number;
    h: number;
    isDeleted: boolean;
    dataIndex: number;
    updationTime: number;
}

interface UpdateMagicMetadataRequest {
    metadataList: UpdateMagicMetadata[];
}
interface UpdateMagicMetadata {
    id: number;
    magicMetadata: MagicMetadata;
}

export const NEW_MAGIC_METADATA: MagicMetadata = {
    version: 0,
    data: {},
    header: null,
    count: 0,
};

export const getLocalFiles = async () => {
    const files: Array<File> =
        (await localForage.getItem<File[]>(FILES_TABLE)) || [];
    return files;
};

const getLastSynTime = async (collection: Collection) => {
    return (await localForage.getItem<number>(`${collection.id}-time`)) ?? 0;
};

export const updateLocalFiles = async (
    collection: Collection,
    files: File[],
    time: number
) => {
    await localForage.setItem(FILES_TABLE, files);
    await localForage.setItem(`${collection.id}-time`, time);
};

export const syncFiles = async (
    collections: Collection[],
    setFiles: (files: File[]) => void
) => {
    const localFiles = await getLocalFiles();
    let updatedFileList = await removeDeletedCollectionFiles(
        collections,
        localFiles
    );
    if (updatedFileList.length !== localFiles.length) {
        await localForage.setItem(FILES_TABLE, updatedFileList);
        setFiles(updatedFileList);
    }
    for (const collection of collections) {
        if (!getToken()) {
            continue;
        }
        const lastSyncTime = await getLastSynTime(collection);

        if (collection.updationTime === lastSyncTime) {
            continue;
        }
        try {
            updatedFileList = await updateFileList(
                collection,
                lastSyncTime,
                updatedFileList,
                setFiles
            );
            setFiles(appendPhotoSwipeProps(updatedFileList));
        } catch (e) {
            // ignore
        }
    }
    return updatedFileList;
};

export const updateFileList = async (
    collection: Collection,
    sinceTime: number,
    existingFiles: File[],
    setFiles: (files: File[]) => void
): Promise<File[]> => {
    try {
        let updatedFileList = [...existingFiles];
        let time = sinceTime;
        let fetchedFiles: File[];
        do {
            fetchedFiles = await getFiles(collection.id, time);
            const decryptedFetchedFiles: File[] = [];
            await Promise.all(
                fetchedFiles.map(async (file: File) => {
                    if (!file.isDeleted) {
                        file = await decryptFile(file, collection);
                        decryptedFetchedFiles.push(file);
                    }
                })
            );
            if (fetchedFiles.length) {
                time = fetchedFiles.slice(-1)[0].updationTime;
            }
            updatedFileList = sortFiles(
                dedupeFiles([
                    ...updatedFileList,
                    ...decryptedFetchedFiles,
                ]).filter((item) => !item.isDeleted)
            );
            setFiles(appendPhotoSwipeProps(updatedFileList));
            await updateLocalFiles(collection, updatedFileList, time);
        } while (fetchedFiles.length === DIFF_LIMIT);
        await updateLocalFiles(
            collection,
            updatedFileList,
            collection.updationTime
        );
        return updatedFileList;
    } catch (e) {
        logError(e, 'update files failed');
        throw e;
    }
};

const getFiles = async (collectionID: number, time: number) => {
    try {
        const token = getToken();
        if (!token) {
            return;
        }
        const resp = await HTTPService.get(
            `${ENDPOINT}/collections/diff`,
            {
                collectionID: collectionID,
                sinceTime: time,
                limit: DIFF_LIMIT,
            },
            {
                'X-Auth-Token': token,
            }
        );
        return resp.data.diff as File[];
    } catch (e) {
        logError(e, 'get file failed');
        throw e;
    }
};

const removeDeletedCollectionFiles = async (
    collections: Collection[],
    files: File[]
) => {
    const syncedCollectionIds = new Set<number>();
    for (const collection of collections) {
        syncedCollectionIds.add(collection.id);
    }
    files = files.filter((file) => syncedCollectionIds.has(file.collectionID));
    return files;
};

export const deleteFiles = async (filesToDelete: number[]) => {
    try {
        const token = getToken();
        if (!token) {
            return;
        }
        await HTTPService.post(
            `${ENDPOINT}/files/delete`,
            { fileIDs: filesToDelete },
            null,
            {
                'X-Auth-Token': token,
            }
        );
    } catch (e) {
        logError(e, 'delete failed');
        throw e;
    }
};

export const updateMagicMetadata = async (files: File[]) => {
    const token = getToken();
    if (!token) {
        return;
    }
    const reqBody: UpdateMagicMetadataRequest = { metadataList: [] };
    for (const file of files) {
        reqBody.metadataList.push({
            id: file.id,
            magicMetadata: file.magicMetadata,
        });
    }
    await HTTPService.put(`${ENDPOINT}/files/magic-metadata`, reqBody, null, {
        'X-Auth-Token': token,
    });
};

const dedupeFiles = (files: File[]) => {
    const latestVersionFiles = new Map<string, File>();
    files.forEach((file) => {
        const uid = `${file.collectionID}-${file.id}`;
        if (
            !latestVersionFiles.has(uid) ||
            latestVersionFiles.get(uid).updationTime < file.updationTime
        ) {
            latestVersionFiles.set(uid, file);
        }
    });
    return [...latestVersionFiles.values()];
};
