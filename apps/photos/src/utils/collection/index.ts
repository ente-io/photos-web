import {
    addToCollection,
    createAlbum,
    getAllLocalCollections,
    getLocalCollections,
    getNonEmptyCollections,
    moveToCollection,
    removeFromCollection,
    restoreToCollection,
    unhideToCollection,
    updateCollectionMagicMetadata,
    updatePublicCollectionMagicMetadata,
    updateSharedCollectionMagicMetadata,
} from 'services/collectionService';
import { downloadFiles, downloadFilesDesktop } from 'utils/file';
import { getAllLocalFiles, getLocalFiles } from 'services/fileService';
import { EnteFile } from 'types/file';
import { CustomError } from 'utils/error';
import { User } from 'types/user';
import { getData, LS_KEYS } from 'utils/storage/localStorage';
import { logError } from 'utils/sentry';
import {
    COLLECTION_ROLE,
    Collection,
    CollectionMagicMetadataProps,
    CollectionPublicMagicMetadataProps,
    CollectionSummaries,
} from 'types/collection';
import {
    CollectionSummaryType,
    CollectionType,
    HIDE_FROM_COLLECTION_BAR_TYPES,
    OPTIONS_NOT_HAVING_COLLECTION_TYPES,
    SYSTEM_COLLECTION_TYPES,
    MOVE_TO_NOT_ALLOWED_COLLECTION,
    ADD_TO_NOT_ALLOWED_COLLECTION,
    HIDDEN_ITEMS_SECTION,
    DEFAULT_HIDDEN_COLLECTION_USER_FACING_NAME,
} from 'constants/collection';
import { getUnixTimeInMicroSecondsWithDelta } from 'utils/time';
import { SUB_TYPE, VISIBILITY_STATE } from 'types/magicMetadata';
import { isArchivedCollection, updateMagicMetadata } from 'utils/magicMetadata';
import { getAlbumsURL } from 'utils/common/apiUtil';
import bs58 from 'bs58';
import { t } from 'i18next';
import isElectron from 'is-electron';
import { SetCollectionDownloadProgressAttributes } from 'types/gallery';
import ElectronService from 'services/electron/common';
import {
    getCollectionExportPath,
    getUniqueCollectionExportName,
} from 'utils/export';
import exportService from 'services/export';
import { CollectionDownloadProgressAttributes } from 'components/Collections/CollectionDownloadProgress';

export enum COLLECTION_OPS_TYPE {
    ADD,
    MOVE,
    REMOVE,
    RESTORE,
    UNHIDE,
}
export async function handleCollectionOps(
    type: COLLECTION_OPS_TYPE,
    collection: Collection,
    selectedFiles: EnteFile[],
    selectedCollectionID: number
) {
    switch (type) {
        case COLLECTION_OPS_TYPE.ADD:
            await addToCollection(collection, selectedFiles);
            break;
        case COLLECTION_OPS_TYPE.MOVE:
            await moveToCollection(
                selectedCollectionID,
                collection,
                selectedFiles
            );
            break;
        case COLLECTION_OPS_TYPE.REMOVE:
            await removeFromCollection(collection.id, selectedFiles);
            break;
        case COLLECTION_OPS_TYPE.RESTORE:
            await restoreToCollection(collection, selectedFiles);
            break;
        case COLLECTION_OPS_TYPE.UNHIDE:
            await unhideToCollection(collection, selectedFiles);
            break;
        default:
            throw Error(CustomError.INVALID_COLLECTION_OPERATION);
    }
}

export function getSelectedCollection(
    collectionID: number,
    collections: Collection[]
) {
    return collections.find((collection) => collection.id === collectionID);
}

export async function downloadCollectionHelper(
    collectionID: number,
    setCollectionDownloadProgressAttributes: SetCollectionDownloadProgressAttributes
) {
    try {
        const allFiles = await getAllLocalFiles();
        const collectionFiles = allFiles.filter(
            (file) => file.collectionID === collectionID
        );
        const allCollections = await getAllLocalCollections();
        const collection = allCollections.find(
            (collection) => collection.id === collectionID
        );
        if (!collection) {
            throw Error('collection not found');
        }
        await downloadCollectionFiles(
            collection.name,
            collection.id,
            isHiddenCollection(collection),
            collectionFiles,
            setCollectionDownloadProgressAttributes
        );
    } catch (e) {
        logError(e, 'download collection failed ');
    }
}

export async function downloadDefaultHiddenCollectionHelper(
    setCollectionDownloadProgressAttributes: SetCollectionDownloadProgressAttributes
) {
    try {
        const hiddenCollections = await getLocalCollections('hidden');
        const defaultHiddenCollectionsIds =
            getDefaultHiddenCollectionIDs(hiddenCollections);
        const hiddenFiles = await getLocalFiles('hidden');
        const defaultHiddenCollectionFiles = hiddenFiles.filter((file) =>
            defaultHiddenCollectionsIds.has(file.collectionID)
        );
        await downloadCollectionFiles(
            DEFAULT_HIDDEN_COLLECTION_USER_FACING_NAME,
            HIDDEN_ITEMS_SECTION,
            true,
            defaultHiddenCollectionFiles,
            setCollectionDownloadProgressAttributes
        );
    } catch (e) {
        logError(e, 'download hidden files failed ');
    }
}

async function downloadCollectionFiles(
    collectionName: string,
    collectionID: number,
    isHidden: boolean,
    collectionFiles: EnteFile[],
    setCollectionDownloadProgressAttributes: SetCollectionDownloadProgressAttributes
) {
    if (!collectionFiles.length) {
        return;
    }
    const canceller = new AbortController();
    const increaseSuccess = () => {
        if (canceller.signal.aborted) return;
        setCollectionDownloadProgressAttributes((prev) => ({
            ...prev,
            success: prev.success + 1,
        }));
    };
    const increaseFailed = () => {
        if (canceller.signal.aborted) return;
        setCollectionDownloadProgressAttributes((prev) => ({
            ...prev,
            failed: prev.failed + 1,
        }));
    };
    const isCancelled = () => canceller.signal.aborted;
    const initialProgressAttributes: CollectionDownloadProgressAttributes = {
        collectionName,
        collectionID,
        isHidden,
        canceller,
        total: collectionFiles.length,
        success: 0,
        failed: 0,
        downloadDirPath: null,
    };
    if (isElectron()) {
        const selectedDir = await ElectronService.selectDirectory();
        if (!selectedDir) {
            return;
        }
        const downloadDirPath = await createCollectionDownloadFolder(
            selectedDir,
            collectionName
        );
        setCollectionDownloadProgressAttributes({
            ...initialProgressAttributes,
            downloadDirPath,
        });
        await downloadFilesDesktop(
            collectionFiles,
            { increaseSuccess, increaseFailed, isCancelled },
            downloadDirPath
        );
    } else {
        setCollectionDownloadProgressAttributes(initialProgressAttributes);
        await downloadFiles(collectionFiles, {
            increaseSuccess,
            increaseFailed,
            isCancelled,
        });
    }
}

async function createCollectionDownloadFolder(
    downloadDirPath: string,
    collectionName: string
) {
    const collectionDownloadName = getUniqueCollectionExportName(
        downloadDirPath,
        collectionName
    );
    const collectionDownloadPath = getCollectionExportPath(
        downloadDirPath,
        collectionDownloadName
    );
    await exportService.checkExistsAndCreateDir(collectionDownloadPath);
    return collectionDownloadPath;
}

export function appendCollectionKeyToShareURL(
    url: string,
    collectionKey: string
) {
    if (!url) {
        return null;
    }

    const sharableURL = new URL(url);
    const albumsURL = new URL(getAlbumsURL());

    sharableURL.protocol = albumsURL.protocol;
    sharableURL.host = albumsURL.host;
    sharableURL.pathname = albumsURL.pathname;

    const bytes = Buffer.from(collectionKey, 'base64');
    sharableURL.hash = bs58.encode(bytes);
    return sharableURL.href;
}

const _intSelectOption = (i: number) => {
    const label = i === 0 ? t('NO_DEVICE_LIMIT') : i.toString();
    return { label, value: i };
};

export function getDeviceLimitOptions() {
    return [0, 2, 5, 10, 25, 50].map((i) => _intSelectOption(i));
}

export const shareExpiryOptions = () => [
    { label: t('NEVER'), value: () => 0 },
    {
        label: t('AFTER_TIME.HOUR'),
        value: () => getUnixTimeInMicroSecondsWithDelta({ hours: 1 }),
    },
    {
        label: t('AFTER_TIME.DAY'),
        value: () => getUnixTimeInMicroSecondsWithDelta({ days: 1 }),
    },
    {
        label: t('AFTER_TIME.WEEK'),
        value: () => getUnixTimeInMicroSecondsWithDelta({ days: 7 }),
    },
    {
        label: t('AFTER_TIME.MONTH'),
        value: () => getUnixTimeInMicroSecondsWithDelta({ months: 1 }),
    },
    {
        label: t('AFTER_TIME.YEAR'),
        value: () => getUnixTimeInMicroSecondsWithDelta({ years: 1 }),
    },
];

export const changeCollectionVisibility = async (
    collection: Collection,
    visibility: VISIBILITY_STATE
) => {
    try {
        const updatedMagicMetadataProps: CollectionMagicMetadataProps = {
            visibility,
        };

        const user: User = getData(LS_KEYS.USER);
        if (collection.owner.id === user.id) {
            const updatedMagicMetadata = await updateMagicMetadata(
                updatedMagicMetadataProps,
                collection.magicMetadata,
                collection.key
            );

            await updateCollectionMagicMetadata(
                collection,
                updatedMagicMetadata
            );
        } else {
            const updatedMagicMetadata = await updateMagicMetadata(
                updatedMagicMetadataProps,
                collection.sharedMagicMetadata,
                collection.key
            );
            await updateSharedCollectionMagicMetadata(
                collection,
                updatedMagicMetadata
            );
        }
    } catch (e) {
        logError(e, 'change collection visibility failed');
        throw e;
    }
};

export const changeCollectionSortOrder = async (
    collection: Collection,
    asc: boolean
) => {
    try {
        const updatedPublicMagicMetadataProps: CollectionPublicMagicMetadataProps =
            {
                asc,
            };

        const updatedPubMagicMetadata = await updateMagicMetadata(
            updatedPublicMagicMetadataProps,
            collection.pubMagicMetadata,
            collection.key
        );

        await updatePublicCollectionMagicMetadata(
            collection,
            updatedPubMagicMetadata
        );
    } catch (e) {
        logError(e, 'change collection sort order failed');
    }
};

export const changeCollectionOrder = async (
    collection: Collection,
    order: number
) => {
    try {
        const updatedMagicMetadataProps: CollectionMagicMetadataProps = {
            order,
        };

        const updatedMagicMetadata = await updateMagicMetadata(
            updatedMagicMetadataProps,
            collection.magicMetadata,
            collection.key
        );

        await updateCollectionMagicMetadata(collection, updatedMagicMetadata);
    } catch (e) {
        logError(e, 'change collection order failed');
    }
};

export const changeCollectionSubType = async (
    collection: Collection,
    subType: SUB_TYPE
) => {
    try {
        const updatedMagicMetadataProps: CollectionMagicMetadataProps = {
            subType: subType,
        };

        const updatedMagicMetadata = await updateMagicMetadata(
            updatedMagicMetadataProps,
            collection.magicMetadata,
            collection.key
        );
        await updateCollectionMagicMetadata(collection, updatedMagicMetadata);
    } catch (e) {
        logError(e, 'change collection subType failed');
        throw e;
    }
};

export const getArchivedCollections = (collections: Collection[]) => {
    return new Set<number>(
        collections
            .filter(isArchivedCollection)
            .map((collection) => collection.id)
    );
};

export const getDefaultHiddenCollectionIDs = (collections: Collection[]) => {
    return new Set<number>(
        collections
            .filter(isDefaultHiddenCollection)
            .map((collection) => collection.id)
    );
};

export const hasNonSystemCollections = (
    collectionSummaries: CollectionSummaries
) => {
    for (const collectionSummary of collectionSummaries.values()) {
        if (!isSystemCollection(collectionSummary.type)) return true;
    }
    return false;
};

export const isMoveToAllowedCollection = (type: CollectionSummaryType) => {
    return !MOVE_TO_NOT_ALLOWED_COLLECTION.has(type);
};

export const isAddToAllowedCollection = (type: CollectionSummaryType) => {
    return !ADD_TO_NOT_ALLOWED_COLLECTION.has(type);
};

export const isSystemCollection = (type: CollectionSummaryType) => {
    return SYSTEM_COLLECTION_TYPES.has(type);
};

export const shouldShowOptions = (type: CollectionSummaryType) => {
    return !OPTIONS_NOT_HAVING_COLLECTION_TYPES.has(type);
};
export const showEmptyTrashQuickOption = (type: CollectionSummaryType) => {
    return type === CollectionSummaryType.trash;
};
export const showDownloadQuickOption = (type: CollectionSummaryType) => {
    return (
        type === CollectionSummaryType.folder ||
        type === CollectionSummaryType.favorites ||
        type === CollectionSummaryType.album ||
        type === CollectionSummaryType.uncategorized ||
        type === CollectionSummaryType.hiddenItems ||
        type === CollectionSummaryType.incomingShareViewer ||
        type === CollectionSummaryType.incomingShareCollaborator ||
        type === CollectionSummaryType.outgoingShare ||
        type === CollectionSummaryType.sharedOnlyViaLink ||
        type === CollectionSummaryType.archived ||
        type === CollectionSummaryType.pinned
    );
};
export const showShareQuickOption = (type: CollectionSummaryType) => {
    return (
        type === CollectionSummaryType.folder ||
        type === CollectionSummaryType.album ||
        type === CollectionSummaryType.outgoingShare ||
        type === CollectionSummaryType.sharedOnlyViaLink ||
        type === CollectionSummaryType.archived ||
        type === CollectionSummaryType.incomingShareViewer ||
        type === CollectionSummaryType.incomingShareCollaborator ||
        type === CollectionSummaryType.pinned
    );
};
export const shouldBeShownOnCollectionBar = (type: CollectionSummaryType) => {
    return !HIDE_FROM_COLLECTION_BAR_TYPES.has(type);
};

export const getUserOwnedCollections = (collections: Collection[]) => {
    const user: User = getData(LS_KEYS.USER);
    if (!user?.id) {
        throw Error('user missing');
    }
    return collections.filter((collection) => collection.owner.id === user.id);
};

export const isDefaultHiddenCollection = (collection: Collection) =>
    collection.magicMetadata?.data.subType === SUB_TYPE.DEFAULT_HIDDEN;

export const isHiddenCollection = (collection: Collection) =>
    collection.magicMetadata?.data.visibility === VISIBILITY_STATE.HIDDEN;

export const isQuickLinkCollection = (collection: Collection) =>
    collection.magicMetadata?.data.subType === SUB_TYPE.QUICK_LINK_COLLECTION;

export function isOutgoingShare(collection: Collection, user: User): boolean {
    return collection.owner.id === user.id && collection.sharees?.length > 0;
}

export function isIncomingShare(collection: Collection, user: User) {
    return collection.owner.id !== user.id;
}

export function isIncomingViewerShare(collection: Collection, user: User) {
    const sharee = collection.sharees?.find((sharee) => sharee.id === user.id);
    return sharee?.role === COLLECTION_ROLE.VIEWER;
}

export function isIncomingCollabShare(collection: Collection, user: User) {
    const sharee = collection.sharees?.find((sharee) => sharee.id === user.id);
    return sharee?.role === COLLECTION_ROLE.COLLABORATOR;
}

export function isSharedOnlyViaLink(collection: Collection) {
    return collection.publicURLs?.length && !collection.sharees?.length;
}

export function isValidMoveTarget(
    sourceCollectionID: number,
    targetCollection: Collection,
    user: User
) {
    return (
        sourceCollectionID !== targetCollection.id &&
        !isHiddenCollection(targetCollection) &&
        !isQuickLinkCollection(targetCollection) &&
        !isIncomingShare(targetCollection, user)
    );
}

export function isValidReplacementAlbum(
    collection: Collection,
    user: User,
    wantedCollectionName: string
) {
    return (
        collection.name === wantedCollectionName &&
        (collection.type === CollectionType.album ||
            collection.type === CollectionType.folder) &&
        !isHiddenCollection(collection) &&
        !isQuickLinkCollection(collection) &&
        !isIncomingShare(collection, user)
    );
}

export function getCollectionNameMap(
    collections: Collection[]
): Map<number, string> {
    return new Map<number, string>(
        collections.map((collection) => [collection.id, collection.name])
    );
}

export function getNonEmptyPersonalCollections(
    collections: Collection[],
    personalFiles: EnteFile[],
    user: User
): Collection[] {
    if (!user?.id) {
        throw Error('user missing');
    }
    const nonEmptyCollections = getNonEmptyCollections(
        collections,
        personalFiles
    );
    const personalCollections = nonEmptyCollections.filter(
        (collection) => collection.owner.id === user?.id
    );
    return personalCollections;
}

export function getNonHiddenCollections(
    collections: Collection[]
): Collection[] {
    return collections.filter((collection) => !isHiddenCollection(collection));
}

export function getHiddenCollections(collections: Collection[]): Collection[] {
    return collections.filter((collection) => isHiddenCollection(collection));
}

export async function splitNormalAndHiddenCollections(
    collections: Collection[]
): Promise<{
    normalCollections: Collection[];
    hiddenCollections: Collection[];
}> {
    const normalCollections = [];
    const hiddenCollections = [];
    for (const collection of collections) {
        if (isHiddenCollection(collection)) {
            hiddenCollections.push(collection);
        } else {
            normalCollections.push(collection);
        }
    }
    return { normalCollections, hiddenCollections };
}

export function constructCollectionNameMap(
    collections: Collection[]
): Map<number, string> {
    return new Map<number, string>(
        (collections ?? []).map((collection) => [
            collection.id,
            getCollectionUserFacingName(collection),
        ])
    );
}

export const getCollectionUserFacingName = (collection: Collection) => {
    if (isDefaultHiddenCollection(collection)) {
        return DEFAULT_HIDDEN_COLLECTION_USER_FACING_NAME;
    }
    return collection.name;
};

export const getOrCreateAlbum = async (
    albumName: string,
    existingCollections: Collection[]
) => {
    const user: User = getData(LS_KEYS.USER);
    if (!user?.id) {
        throw Error('user missing');
    }
    for (const collection of existingCollections) {
        if (isValidReplacementAlbum(collection, user, albumName)) {
            return collection;
        }
    }
    return createAlbum(albumName);
};
