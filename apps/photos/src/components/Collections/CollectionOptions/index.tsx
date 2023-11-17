import { AlbumCollectionOption } from './AlbumCollectionOption';
import React, { useContext, useRef, useState } from 'react';
import * as CollectionAPI from 'services/collectionService';
import * as TrashService from 'services/trashService';
import {
    changeCollectionOrder,
    changeCollectionSortOrder,
    changeCollectionVisibility,
    downloadCollectionHelper,
    downloadDefaultHiddenCollectionHelper,
    isHiddenCollection,
} from 'utils/collection';
import { SetCollectionNamerAttributes } from '../CollectionNamer';
import { Collection } from 'types/collection';
import { isArchivedCollection, isPinnedCollection } from 'utils/magicMetadata';
import { GalleryContext } from 'pages/gallery';
import { logError } from 'utils/sentry';
import { VISIBILITY_STATE } from 'types/magicMetadata';
import { AppContext } from 'pages/_app';
import OverflowMenu from 'components/OverflowMenu/menu';
import {
    ALL_SECTION,
    CollectionSummaryType,
    HIDDEN_ITEMS_SECTION,
} from 'constants/collection';
import { TrashCollectionOption } from './TrashCollectionOption';
import { SharedCollectionOption } from './SharedCollectionOption';
import { OnlyDownloadCollectionOption } from './OnlyDownloadCollectionOption';
import { QuickOptions } from './QuickOptions';
import MoreHoriz from '@mui/icons-material/MoreHoriz';
import { HorizontalFlex } from 'components/Container';
import { Trans } from 'react-i18next';
import { t } from 'i18next';
import { Box } from '@mui/material';
import CollectionSortOrderMenu from './CollectionSortOrderMenu';
import { SetCollectionDownloadProgressAttributes } from 'types/gallery';

interface CollectionOptionsProps {
    setCollectionNamerAttributes: SetCollectionNamerAttributes;
    setCollectionDownloadProgressAttributesCreator: (
        collectionID: number
    ) => SetCollectionDownloadProgressAttributes;
    isActiveCollectionDownloadInProgress: () => boolean;
    activeCollection: Collection;
    collectionSummaryType: CollectionSummaryType;
    showCollectionShareModal: () => void;
    setActiveCollectionID: (collectionID: number) => void;
}

export enum CollectionActions {
    SHOW_RENAME_DIALOG,
    RENAME,
    DOWNLOAD,
    ARCHIVE,
    UNARCHIVE,
    CONFIRM_DELETE,
    DELETE_WITH_FILES,
    DELETE_BUT_KEEP_FILES,
    SHOW_SHARE_DIALOG,
    CONFIRM_EMPTY_TRASH,
    EMPTY_TRASH,
    CONFIRM_LEAVE_SHARED_ALBUM,
    LEAVE_SHARED_ALBUM,
    SHOW_SORT_ORDER_MENU,
    UPDATE_COLLECTION_SORT_ORDER,
    PIN,
    UNPIN,
    HIDE,
    UNHIDE,
}

const CollectionOptions = (props: CollectionOptionsProps) => {
    const {
        activeCollection,
        collectionSummaryType,
        setActiveCollectionID,
        setCollectionNamerAttributes,
        showCollectionShareModal,
        setCollectionDownloadProgressAttributesCreator,
        isActiveCollectionDownloadInProgress,
    } = props;

    const { startLoading, finishLoading, setDialogMessage } =
        useContext(AppContext);
    const { syncWithRemote } = useContext(GalleryContext);
    const overFlowMenuIconRef = useRef<SVGSVGElement>(null);
    const [collectionSortOrderMenuView, setCollectionSortOrderMenuView] =
        useState(false);

    const openCollectionSortOrderMenu = () => {
        setCollectionSortOrderMenuView(true);
    };
    const closeCollectionSortOrderMenu = () => {
        setCollectionSortOrderMenuView(false);
    };

    const handleCollectionAction = (
        action: CollectionActions,
        loader = true
    ) => {
        let callback;
        switch (action) {
            case CollectionActions.SHOW_RENAME_DIALOG:
                callback = showRenameCollectionModal;
                break;
            case CollectionActions.RENAME:
                callback = renameCollection;
                break;
            case CollectionActions.DOWNLOAD:
                callback = downloadCollection;
                break;
            case CollectionActions.ARCHIVE:
                callback = archiveCollection;
                break;
            case CollectionActions.UNARCHIVE:
                callback = unArchiveCollection;
                break;
            case CollectionActions.CONFIRM_DELETE:
                callback = confirmDeleteCollection;
                break;
            case CollectionActions.DELETE_WITH_FILES:
                callback = deleteCollectionAlongWithFiles;
                break;
            case CollectionActions.DELETE_BUT_KEEP_FILES:
                callback = deleteCollectionButKeepFiles;
                break;
            case CollectionActions.SHOW_SHARE_DIALOG:
                callback = showCollectionShareModal;
                break;
            case CollectionActions.CONFIRM_EMPTY_TRASH:
                callback = confirmEmptyTrash;
                break;
            case CollectionActions.EMPTY_TRASH:
                callback = emptyTrash;
                break;
            case CollectionActions.CONFIRM_LEAVE_SHARED_ALBUM:
                callback = confirmLeaveSharedAlbum;
                break;
            case CollectionActions.LEAVE_SHARED_ALBUM:
                callback = leaveSharedAlbum;
                break;
            case CollectionActions.SHOW_SORT_ORDER_MENU:
                callback = openCollectionSortOrderMenu;
                break;
            case CollectionActions.UPDATE_COLLECTION_SORT_ORDER:
                callback = updateCollectionSortOrder;
                break;
            case CollectionActions.PIN:
                callback = pinAlbum;
                break;
            case CollectionActions.UNPIN:
                callback = unPinAlbum;
                break;
            case CollectionActions.HIDE:
                callback = hideAlbum;
                break;
            case CollectionActions.UNHIDE:
                callback = unHideAlbum;
                break;

            default:
                logError(
                    Error('invalid collection action '),
                    'handleCollectionAction failed'
                );
                {
                    action;
                }
        }
        return async (...args) => {
            try {
                loader && startLoading();
                await callback(...args);
            } catch (e) {
                logError(e, 'collection action failed', { action });
                setDialogMessage({
                    title: t('ERROR'),
                    content: t('UNKNOWN_ERROR'),
                    close: { variant: 'critical' },
                });
            } finally {
                syncWithRemote(false, true);
                loader && finishLoading();
            }
        };
    };

    const renameCollection = async (newName: string) => {
        if (activeCollection.name !== newName) {
            await CollectionAPI.renameCollection(activeCollection, newName);
        }
    };

    const deleteCollectionAlongWithFiles = async () => {
        await CollectionAPI.deleteCollection(activeCollection.id, false);
        setActiveCollectionID(ALL_SECTION);
    };

    const deleteCollectionButKeepFiles = async () => {
        await CollectionAPI.deleteCollection(activeCollection.id, true);
        setActiveCollectionID(ALL_SECTION);
    };

    const leaveSharedAlbum = async () => {
        await CollectionAPI.leaveSharedAlbum(activeCollection.id);
        setActiveCollectionID(ALL_SECTION);
    };

    const archiveCollection = () => {
        changeCollectionVisibility(activeCollection, VISIBILITY_STATE.ARCHIVED);
    };

    const unArchiveCollection = () => {
        changeCollectionVisibility(activeCollection, VISIBILITY_STATE.VISIBLE);
    };

    const downloadCollection = () => {
        if (isActiveCollectionDownloadInProgress()) {
            return;
        }
        if (collectionSummaryType === CollectionSummaryType.hiddenItems) {
            const setCollectionDownloadProgressAttributes =
                setCollectionDownloadProgressAttributesCreator(
                    HIDDEN_ITEMS_SECTION
                );
            downloadDefaultHiddenCollectionHelper(
                setCollectionDownloadProgressAttributes
            );
        } else {
            const setCollectionDownloadProgressAttributes =
                setCollectionDownloadProgressAttributesCreator(
                    activeCollection.id
                );
            downloadCollectionHelper(
                activeCollection.id,
                setCollectionDownloadProgressAttributes
            );
        }
    };

    const emptyTrash = async () => {
        await TrashService.emptyTrash();
        await TrashService.clearLocalTrash();
        setActiveCollectionID(ALL_SECTION);
    };

    const showRenameCollectionModal = () => {
        setCollectionNamerAttributes({
            title: t('RENAME_COLLECTION'),
            buttonText: t('RENAME'),
            autoFilledName: activeCollection.name,
            callback: handleCollectionAction(CollectionActions.RENAME),
        });
    };

    const confirmDeleteCollection = () => {
        setDialogMessage({
            title: t('DELETE_COLLECTION_TITLE'),
            content: (
                <Trans
                    i18nKey={'DELETE_COLLECTION_MESSAGE'}
                    components={{
                        a: <Box component={'span'} color="text.base" />,
                    }}
                />
            ),
            proceed: {
                text: t('DELETE_PHOTOS'),
                action: handleCollectionAction(
                    CollectionActions.DELETE_WITH_FILES
                ),
                variant: 'critical',
            },
            secondary: {
                text: t('KEEP_PHOTOS'),
                action: handleCollectionAction(
                    CollectionActions.DELETE_BUT_KEEP_FILES
                ),
                variant: 'primary',
            },
            close: {
                text: t('CANCEL'),
            },
        });
    };

    const confirmEmptyTrash = () =>
        setDialogMessage({
            title: t('EMPTY_TRASH_TITLE'),
            content: t('EMPTY_TRASH_MESSAGE'),

            proceed: {
                action: handleCollectionAction(CollectionActions.EMPTY_TRASH),
                text: t('EMPTY_TRASH'),
                variant: 'critical',
            },
            close: { text: t('CANCEL') },
        });

    const confirmLeaveSharedAlbum = () => {
        setDialogMessage({
            title: t('LEAVE_SHARED_ALBUM_TITLE'),
            content: t('LEAVE_SHARED_ALBUM_MESSAGE'),
            proceed: {
                text: t('LEAVE_SHARED_ALBUM'),
                action: handleCollectionAction(
                    CollectionActions.LEAVE_SHARED_ALBUM
                ),
                variant: 'critical',
            },
            close: {
                text: t('CANCEL'),
            },
        });
    };

    const updateCollectionSortOrder = async ({ asc }: { asc: boolean }) => {
        await changeCollectionSortOrder(activeCollection, asc);
    };

    const pinAlbum = async () => {
        await changeCollectionOrder(activeCollection, 1);
    };

    const unPinAlbum = async () => {
        await changeCollectionOrder(activeCollection, 0);
    };

    const hideAlbum = async () => {
        await changeCollectionVisibility(
            activeCollection,
            VISIBILITY_STATE.HIDDEN
        );
        setActiveCollectionID(ALL_SECTION);
    };
    const unHideAlbum = async () => {
        await changeCollectionVisibility(
            activeCollection,
            VISIBILITY_STATE.VISIBLE
        );
        setActiveCollectionID(HIDDEN_ITEMS_SECTION);
    };

    return (
        <HorizontalFlex sx={{ display: 'inline-flex', gap: '16px' }}>
            <QuickOptions
                handleCollectionAction={handleCollectionAction}
                collectionSummaryType={collectionSummaryType}
                isDownloadInProgress={isActiveCollectionDownloadInProgress()}
            />

            <OverflowMenu
                ariaControls={'collection-options'}
                triggerButtonIcon={<MoreHoriz ref={overFlowMenuIconRef} />}>
                {collectionSummaryType === CollectionSummaryType.trash ? (
                    <TrashCollectionOption
                        handleCollectionAction={handleCollectionAction}
                    />
                ) : collectionSummaryType ===
                  CollectionSummaryType.favorites ? (
                    <OnlyDownloadCollectionOption
                        isDownloadInProgress={isActiveCollectionDownloadInProgress()}
                        handleCollectionAction={handleCollectionAction}
                        downloadOptionText={t('DOWNLOAD_FAVORITES')}
                    />
                ) : collectionSummaryType ===
                  CollectionSummaryType.uncategorized ? (
                    <OnlyDownloadCollectionOption
                        handleCollectionAction={handleCollectionAction}
                        downloadOptionText={t('DOWNLOAD_UNCATEGORIZED')}
                    />
                ) : collectionSummaryType ===
                  CollectionSummaryType.hiddenItems ? (
                    <OnlyDownloadCollectionOption
                        handleCollectionAction={handleCollectionAction}
                        downloadOptionText={t('DOWNLOAD_HIDDEN_ITEMS')}
                    />
                ) : collectionSummaryType ===
                      CollectionSummaryType.incomingShareViewer ||
                  collectionSummaryType ===
                      CollectionSummaryType.incomingShareCollaborator ? (
                    <SharedCollectionOption
                        isArchived={isArchivedCollection(activeCollection)}
                        handleCollectionAction={handleCollectionAction}
                    />
                ) : (
                    <AlbumCollectionOption
                        isArchived={isArchivedCollection(activeCollection)}
                        isHidden={isHiddenCollection(activeCollection)}
                        isPinned={isPinnedCollection(activeCollection)}
                        handleCollectionAction={handleCollectionAction}
                    />
                )}
            </OverflowMenu>
            <CollectionSortOrderMenu
                handleCollectionAction={handleCollectionAction}
                overFlowMenuIconRef={overFlowMenuIconRef}
                collectionSortOrderMenuView={collectionSortOrderMenuView}
                closeCollectionSortOrderMenu={closeCollectionSortOrderMenu}
            />
        </HorizontalFlex>
    );
};

export default CollectionOptions;
