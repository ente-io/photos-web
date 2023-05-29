import { CollectionSelectorAttributes } from 'components/Collections/CollectionSelector';
import { TimeStampListItem } from 'components/PhotoList';
import { Collection } from 'types/collection';
import { EnteFile } from 'types/file';
import { User } from 'types/user';

export type SelectedState = {
    [k: number]: boolean;
    ownCount: number;
    count: number;
    collectionID: number;
};
export type SetFiles = React.Dispatch<React.SetStateAction<EnteFile[]>>;
export type SetCollections = React.Dispatch<React.SetStateAction<Collection[]>>;
export type SetLoading = React.Dispatch<React.SetStateAction<boolean>>;
export type SetCollectionSelectorAttributes = React.Dispatch<
    React.SetStateAction<CollectionSelectorAttributes>
>;

export type MergedSourceURL = {
    original: string;
    converted: string;
};
export enum UploadTypeSelectorIntent {
    normalUpload,
    import,
    collectPhotos,
}
export type GalleryContextType = {
    thumbs: Map<number, string>;
    files: Map<number, MergedSourceURL>;
    showPlanSelectorModal: () => void;
    setActiveCollection: (collection: number) => void;
    syncWithRemote: (force?: boolean, silent?: boolean) => Promise<void>;
    setBlockingLoad: (value: boolean) => void;
    photoListHeader: TimeStampListItem;
    openExportModal: () => void;
    authenticateUser: (callback: () => void) => void;
    user: User;
};
