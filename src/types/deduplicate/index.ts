export type DeduplicateContextType = {
    clubSameTimeFilesOnly: boolean;
    setClubSameTimeFilesOnly: (clubSameTimeFilesOnly: boolean) => void;
    clubBySameSize: boolean;
    setClubBySameSize: (clubSameFileHashes: boolean) => void;
    fileSizeMap: Map<number, number>;
    isOnDeduplicatePage: boolean;
    collectionNameMap: Map<number, string>;
};

export const DefaultDeduplicateContext = {
    clubSameTimeFilesOnly: false,
    setClubSameTimeFilesOnly: () => null,
    clubBySameSize: false,
    setClubBySameSize: () => null,
    fileSizeMap: new Map<number, number>(),
    isOnDeduplicatePage: false,
    collectionNameMap: new Map<number, string>(),
};
