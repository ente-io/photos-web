export const ARCHIVE_SECTION = -1;
export const TRASH_SECTION = -2;
export const ALL_SECTION = 0;

export enum CollectionType {
    folder = 'folder',
    favorites = 'favorites',
    album = 'album',
}

export enum CollectionSummaryType {
    folder = 'folder',
    favorites = 'favorites',
    album = 'album',
    archive = 'archive',
    trash = 'trash',
    all = 'all',
    shared = 'shared',
    archived = 'archived',
}
export enum COLLECTION_SORT_BY {
    NAME,
    CREATION_TIME_ASCENDING,
    CREATION_TIME_DESCENDING,
    UPDATION_TIME_DESCENDING,
}

export const COLLECTION_SHARE_DEFAULT_VALID_DURATION =
    10 * 24 * 60 * 60 * 1000 * 1000;
export const COLLECTION_SHARE_DEFAULT_DEVICE_LIMIT = 4;

export const COLLECTION_SORT_ORDER = new Map([
    [CollectionSummaryType.all, 0],
    [CollectionSummaryType.favorites, 1],
    [CollectionSummaryType.album, 2],
    [CollectionSummaryType.folder, 2],
    [CollectionSummaryType.shared, 2],
    [CollectionSummaryType.archived, 2],
    [CollectionSummaryType.archive, 3],
    [CollectionSummaryType.trash, 4],
]);

export const SYSTEM_COLLECTION_TYPES = new Set([
    CollectionSummaryType.all,
    CollectionSummaryType.archive,
    CollectionSummaryType.trash,
]);

export const UPLOAD_NOT_ALLOWED_COLLECTION_TYPES = new Set([
    CollectionSummaryType.all,
    CollectionSummaryType.archive,
    CollectionSummaryType.shared,
    CollectionSummaryType.trash,
]);

export const OPTIONS_NOT_HAVING_COLLECTION_TYPES = new Set([
    CollectionSummaryType.all,
    CollectionSummaryType.archive,
    CollectionSummaryType.shared,
    CollectionSummaryType.favorites,
]);

export const HIDE_FROM_COLLECTION_BAR_TYPES = new Set([
    CollectionSummaryType.trash,
    CollectionSummaryType.archive,
]);
