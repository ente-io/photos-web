import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useRouter } from 'next/router';
import { clearKeys, getKey, SESSION_KEYS } from 'utils/storage/sessionStorage';
import { getLocalFiles, syncFiles } from 'services/fileService';
import { styled, Typography } from '@mui/material';
import {
    getAllLatestCollections,
    getFavItemIds,
    createAlbum,
    getCollectionSummaries,
    constructEmailList,
    getSectionSummaries,
    getHiddenItemsSummary,
    getAllLocalCollections,
} from 'services/collectionService';
import { t } from 'i18next';

import { checkSubscriptionPurchase } from 'utils/billing';

import FullScreenDropZone from 'components/FullScreenDropZone';
import Sidebar from 'components/Sidebar';
import { mergeMaps, preloadImage } from 'utils/common';
import {
    isFirstLogin,
    justSignedUp,
    setIsFirstLogin,
    setJustSignedUp,
} from 'utils/storage';
import {
    isTokenValid,
    syncMapEnabled,
    validateKey,
} from 'services/userService';
import { useDropzone } from 'react-dropzone';
import EnteSpinner from 'components/EnteSpinner';
import { LoadingOverlay } from 'components/LoadingOverlay';
import PhotoFrame from 'components/PhotoFrame';
import {
    FILE_OPS_TYPE,
    constructFileToCollectionMap,
    getSelectedFiles,
    getUniqueFiles,
    handleFileOps,
    mergeMetadata,
    sortFiles,
} from 'utils/file';
import SelectedFileOptions from 'components/pages/gallery/SelectedFileOptions';
import CollectionSelector, {
    CollectionSelectorAttributes,
} from 'components/Collections/CollectionSelector';

import CollectionNamer, {
    CollectionNamerAttributes,
} from 'components/Collections/CollectionNamer';
import PlanSelector from 'components/pages/gallery/PlanSelector';
import Uploader from 'components/Upload/Uploader';
import {
    ALL_SECTION,
    ARCHIVE_SECTION,
    CollectionSummaryType,
    HIDDEN_ITEMS_SECTION,
    DUMMY_UNCATEGORIZED_COLLECTION,
    TRASH_SECTION,
} from 'constants/collection';
import { AppContext } from 'pages/_app';
import { CustomError } from 'utils/error';
import { PAGES } from 'constants/pages';
import {
    COLLECTION_OPS_TYPE,
    handleCollectionOps,
    getArchivedCollections,
    hasNonSystemCollections,
    splitNormalAndHiddenCollections,
    constructCollectionNameMap,
    getSelectedCollection,
    getDefaultHiddenCollectionIDs,
} from 'utils/collection';
import { logError } from 'utils/sentry';
import { getLocalTrashedFiles, syncTrash } from 'services/trashService';

import FixCreationTime, {
    FixCreationTimeAttributes,
} from 'components/FixCreationTime';
import { Collection, CollectionSummaries } from 'types/collection';
import { EnteFile } from 'types/file';
import {
    GalleryContextType,
    SelectedState,
    UploadTypeSelectorIntent,
} from 'types/gallery';
import Collections from 'components/Collections';
import { GalleryNavbar } from 'components/pages/gallery/Navbar';
import { Search, SearchResultSummary, UpdateSearch } from 'types/search';
import SearchResultInfo from 'components/Search/SearchResultInfo';
import { ITEM_TYPE, TimeStampListItem } from 'components/PhotoList';
import UploadInputs from 'components/UploadSelectorInputs';
import useFileInput from 'hooks/useFileInput';
import { FamilyData, User } from 'types/user';
import { getData, LS_KEYS } from 'utils/storage/localStorage';
import { CenteredFlex } from 'components/Container';
import { checkConnectivity } from 'utils/common';
import { SYNC_INTERVAL_IN_MICROSECONDS } from 'constants/gallery';
import ElectronService from 'services/electron/common';
import uploadManager from 'services/upload/uploadManager';
import { getToken } from 'utils/common/key';
import ExportModal from 'components/ExportModal';
import GalleryEmptyState from 'components/GalleryEmptyState';
import AuthenticateUserModal from 'components/AuthenticateUserModal';
import useMemoSingleThreaded from 'hooks/useMemoSingleThreaded';
import { isArchivedFile } from 'utils/magicMetadata';
import { isSameDayAnyYear, isInsideLocationTag } from 'utils/search';
import { getSessionExpiredMessage } from 'utils/ui';
import { syncEntities } from 'services/entityService';
import { constructUserIDToEmailMap } from 'services/collectionService';
import { getLocalFamilyData } from 'utils/user/family';
import InMemoryStore, { MS_KEYS } from 'services/InMemoryStore';
import { syncEmbeddings } from 'services/embeddingService';
import { ClipService } from 'services/clipService';

export const DeadCenter = styled('div')`
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    flex-direction: column;
`;

const defaultGalleryContext: GalleryContextType = {
    thumbs: new Map(),
    files: new Map(),
    showPlanSelectorModal: () => null,
    setActiveCollectionID: () => null,
    syncWithRemote: () => null,
    setBlockingLoad: () => null,
    setIsInSearchMode: () => null,
    photoListHeader: null,
    openExportModal: () => null,
    authenticateUser: () => null,
    user: null,
    userIDToEmailMap: null,
    emailList: null,
    openHiddenSection: () => null,
    isClipSearchResult: null,
};

export const GalleryContext = createContext<GalleryContextType>(
    defaultGalleryContext
);

export default function Gallery() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [familyData, setFamilyData] = useState<FamilyData>(null);
    const [collections, setCollections] = useState<Collection[]>(null);
    const [hiddenCollections, setHiddenCollections] =
        useState<Collection[]>(null);
    const [defaultHiddenCollectionIDs, setDefaultHiddenCollectionIDs] =
        useState<Set<number>>();
    const [files, setFiles] = useState<EnteFile[]>(null);
    const [hiddenFiles, setHiddenFiles] = useState<EnteFile[]>(null);
    const [trashedFiles, setTrashedFiles] = useState<EnteFile[]>(null);

    const [favItemIds, setFavItemIds] = useState<Set<number>>();

    const [isFirstLoad, setIsFirstLoad] = useState(false);
    const [isFirstFetch, setIsFirstFetch] = useState(false);
    const [selected, setSelected] = useState<SelectedState>({
        ownCount: 0,
        count: 0,
        collectionID: 0,
    });
    const [planModalView, setPlanModalView] = useState(false);
    const [blockingLoad, setBlockingLoad] = useState(false);
    const [collectionSelectorAttributes, setCollectionSelectorAttributes] =
        useState<CollectionSelectorAttributes>(null);
    const [collectionSelectorView, setCollectionSelectorView] = useState(false);
    const [collectionNamerAttributes, setCollectionNamerAttributes] =
        useState<CollectionNamerAttributes>(null);
    const [collectionNamerView, setCollectionNamerView] = useState(false);
    const [search, setSearch] = useState<Search>(null);
    const [shouldDisableDropzone, setShouldDisableDropzone] = useState(false);
    const [isPhotoSwipeOpen, setIsPhotoSwipeOpen] = useState(false);

    const {
        getRootProps: getDragAndDropRootProps,
        getInputProps: getDragAndDropInputProps,
        acceptedFiles: dragAndDropFiles,
    } = useDropzone({
        noClick: true,
        noKeyboard: true,
        disabled: shouldDisableDropzone,
    });
    const {
        selectedFiles: webFileSelectorFiles,
        open: openFileSelector,
        getInputProps: getFileSelectorInputProps,
    } = useFileInput({
        directory: false,
    });
    const {
        selectedFiles: webFolderSelectorFiles,
        open: openFolderSelector,
        getInputProps: getFolderSelectorInputProps,
    } = useFileInput({
        directory: true,
    });

    const [isInSearchMode, setIsInSearchMode] = useState(false);
    const [searchResultSummary, setSetSearchResultSummary] =
        useState<SearchResultSummary>(null);
    const syncInProgress = useRef(true);
    const syncInterval = useRef<NodeJS.Timeout>();
    const resync = useRef<{ force: boolean; silent: boolean }>();
    const [deletedFileIds, setDeletedFileIds] = useState<Set<number>>(
        new Set<number>()
    );
    const [hiddenFileIds, setHiddenFileIds] = useState<Set<number>>(
        new Set<number>()
    );
    const { startLoading, finishLoading, setDialogMessage, ...appContext } =
        useContext(AppContext);
    const [collectionSummaries, setCollectionSummaries] =
        useState<CollectionSummaries>();
    const [hiddenCollectionSummaries, setHiddenCollectionSummaries] =
        useState<CollectionSummaries>();
    const [userIDToEmailMap, setUserIDToEmailMap] =
        useState<Map<number, string>>(null);
    const [emailList, setEmailList] = useState<string[]>(null);
    const [activeCollectionID, setActiveCollectionID] =
        useState<number>(undefined);
    const [fixCreationTimeView, setFixCreationTimeView] = useState(false);
    const [fixCreationTimeAttributes, setFixCreationTimeAttributes] =
        useState<FixCreationTimeAttributes>(null);

    const [archivedCollections, setArchivedCollections] =
        useState<Set<number>>();

    const showPlanSelectorModal = () => setPlanModalView(true);

    const [uploadTypeSelectorView, setUploadTypeSelectorView] = useState(false);
    const [uploadTypeSelectorIntent, setUploadTypeSelectorIntent] =
        useState<UploadTypeSelectorIntent>(
            UploadTypeSelectorIntent.normalUpload
        );

    const [sidebarView, setSidebarView] = useState(false);

    const closeSidebar = () => setSidebarView(false);
    const openSidebar = () => setSidebarView(true);
    const [photoListHeader, setPhotoListHeader] =
        useState<TimeStampListItem>(null);

    const [exportModalView, setExportModalView] = useState(false);

    const [authenticateUserModalView, setAuthenticateUserModalView] =
        useState(false);

    const onAuthenticateCallback = useRef<() => void>();

    const authenticateUser = (callback: () => void) => {
        onAuthenticateCallback.current = callback;
        setAuthenticateUserModalView(true);
    };
    const closeAuthenticateUserModal = () =>
        setAuthenticateUserModalView(false);

    const [isInHiddenSection, setIsInHiddenSection] = useState(false);

    const openHiddenSection: GalleryContextType['openHiddenSection'] = (
        callback
    ) => {
        authenticateUser(() => {
            setIsInHiddenSection(true);
            setActiveCollectionID(HIDDEN_ITEMS_SECTION);
            callback?.();
        });
    };

    const [isClipSearchResult, setIsClipSearchResult] =
        useState<boolean>(false);

    useEffect(() => {
        appContext.showNavBar(true);
        const key = getKey(SESSION_KEYS.ENCRYPTION_KEY);
        if (!key) {
            InMemoryStore.set(MS_KEYS.REDIRECT_URL, PAGES.GALLERY);
            router.push(PAGES.ROOT);
            return;
        }
        preloadImage('/images/subscription-card-background');
        const main = async () => {
            const valid = await validateKey();
            if (!valid) {
                return;
            }
            setupSelectAllKeyBoardShortcutHandler();
            setActiveCollectionID(ALL_SECTION);
            setIsFirstLoad(isFirstLogin());
            setIsFirstFetch(true);
            if (justSignedUp()) {
                setPlanModalView(true);
            }
            setIsFirstLogin(false);
            const user = getData(LS_KEYS.USER);
            const familyData = getLocalFamilyData();
            const files = sortFiles(
                mergeMetadata(await getLocalFiles('normal'))
            );
            const hiddenFiles = sortFiles(
                mergeMetadata(await getLocalFiles('hidden'))
            );
            const collections = await getAllLocalCollections();
            const { normalCollections, hiddenCollections } =
                await splitNormalAndHiddenCollections(collections);
            const trashedFiles = await getLocalTrashedFiles();

            setUser(user);
            setFamilyData(familyData);
            setFiles(files);
            setTrashedFiles(trashedFiles);
            setHiddenFiles(hiddenFiles);
            setCollections(normalCollections);
            setHiddenCollections(hiddenCollections);
            void ClipService.setupOnFileUploadListener();
            await syncWithRemote(true);
            setIsFirstLoad(false);
            setJustSignedUp(false);
            setIsFirstFetch(false);
            syncInterval.current = setInterval(() => {
                syncWithRemote(false, true);
            }, SYNC_INTERVAL_IN_MICROSECONDS);
            ElectronService.registerForegroundEventListener(() => {
                syncWithRemote(false, true);
            });
        };
        main();
        return () => {
            clearInterval(syncInterval.current);
            ElectronService.registerForegroundEventListener(() => {});
            ClipService.removeOnFileUploadListener();
        };
    }, []);

    useEffect(() => {
        if (!user || !files || !collections || !hiddenFiles || !trashedFiles) {
            return;
        }
        setDerivativeState(
            user,
            collections,
            hiddenCollections,
            files,
            trashedFiles,
            hiddenFiles
        );
    }, [
        collections,
        hiddenCollections,
        files,
        hiddenFiles,
        trashedFiles,
        user,
    ]);

    useEffect(() => {
        if (!collections || !user) {
            return;
        }
        const userIdToEmailMap = constructUserIDToEmailMap(user, collections);
        setUserIDToEmailMap(userIdToEmailMap);
    }, [collections]);

    useEffect(() => {
        if (!user || !collections) {
            return;
        }
        const emailList = constructEmailList(user, collections, familyData);
        setEmailList(emailList);
    }, [user, collections, familyData]);

    useEffect(() => {
        collectionSelectorAttributes && setCollectionSelectorView(true);
    }, [collectionSelectorAttributes]);

    useEffect(() => {
        collectionNamerAttributes && setCollectionNamerView(true);
    }, [collectionNamerAttributes]);
    useEffect(() => {
        fixCreationTimeAttributes && setFixCreationTimeView(true);
    }, [fixCreationTimeAttributes]);

    useEffect(() => {
        if (typeof activeCollectionID === 'undefined') {
            return;
        }
        let collectionURL = '';
        if (activeCollectionID !== ALL_SECTION) {
            collectionURL += '?collection=';
            if (activeCollectionID === ARCHIVE_SECTION) {
                collectionURL += t('ARCHIVE_SECTION_NAME');
            } else if (activeCollectionID === TRASH_SECTION) {
                collectionURL += t('TRASH');
            } else if (activeCollectionID === DUMMY_UNCATEGORIZED_COLLECTION) {
                collectionURL += t('UNCATEGORIZED');
            } else if (activeCollectionID === HIDDEN_ITEMS_SECTION) {
                collectionURL += t('HIDDEN_ITEMS_SECTION_NAME');
            } else {
                collectionURL += activeCollectionID;
            }
        }
        const href = `/gallery${collectionURL}`;
        const delayRouteChange = () => {
            setTimeout(() => {
                router.push(href, undefined, { shallow: true });
            }, 1000);
        };

        delayRouteChange();
    }, [activeCollectionID]);

    useEffect(() => {
        const key = getKey(SESSION_KEYS.ENCRYPTION_KEY);
        if (router.isReady && key) {
            checkSubscriptionPurchase(
                setDialogMessage,
                router,
                setBlockingLoad
            );
        }
    }, [router.isReady]);

    useEffect(() => {
        if (isInSearchMode && searchResultSummary) {
            setPhotoListHeader({
                height: 104,
                item: (
                    <SearchResultInfo
                        searchResultSummary={searchResultSummary}
                    />
                ),
                itemType: ITEM_TYPE.HEADER,
            });
        }
    }, [isInSearchMode, searchResultSummary]);

    const activeCollection = useMemo(() => {
        if (!collections || !hiddenCollections) {
            return null;
        }
        return [...collections, ...hiddenCollections].find(
            (collection) => collection.id === activeCollectionID
        );
    }, [collections, activeCollectionID]);

    const filteredData = useMemoSingleThreaded((): EnteFile[] => {
        if (
            !files ||
            !user ||
            !trashedFiles ||
            !hiddenFiles ||
            !archivedCollections
        ) {
            return;
        }

        if (activeCollectionID === TRASH_SECTION && !isInSearchMode) {
            return getUniqueFiles([
                ...trashedFiles,
                ...files.filter((file) => deletedFileIds?.has(file.id)),
            ]);
        }

        const filteredFiles = getUniqueFiles(
            (isInHiddenSection ? hiddenFiles : files).filter((item) => {
                if (deletedFileIds?.has(item.id)) {
                    return false;
                }

                if (!isInHiddenSection && hiddenFileIds?.has(item.id)) {
                    return false;
                }

                // SEARCH MODE
                if (isInSearchMode) {
                    if (
                        search?.date &&
                        !isSameDayAnyYear(search.date)(
                            new Date(item.metadata.creationTime / 1000)
                        )
                    ) {
                        return false;
                    }
                    if (
                        search?.location &&
                        !isInsideLocationTag(
                            {
                                latitude: item.metadata.latitude,
                                longitude: item.metadata.longitude,
                            },
                            search.location
                        )
                    ) {
                        return false;
                    }
                    if (
                        search?.person &&
                        search.person.files.indexOf(item.id) === -1
                    ) {
                        return false;
                    }
                    if (
                        search?.thing &&
                        search.thing.files.indexOf(item.id) === -1
                    ) {
                        return false;
                    }
                    if (
                        search?.text &&
                        search.text.files.indexOf(item.id) === -1
                    ) {
                        return false;
                    }
                    if (search?.files && search.files.indexOf(item.id) === -1) {
                        return false;
                    }
                    if (
                        typeof search?.fileType !== 'undefined' &&
                        search.fileType !== item.metadata.fileType
                    ) {
                        return false;
                    }
                    if (search?.clip && search.clip.has(item.id) === false) {
                        return false;
                    }
                    return true;
                }

                // archived collections files can only be seen in their respective collection
                if (archivedCollections.has(item.collectionID)) {
                    if (activeCollectionID === item.collectionID) {
                        return true;
                    } else {
                        return false;
                    }
                }

                // HIDDEN ITEMS SECTION - show all individual hidden files
                if (
                    activeCollectionID === HIDDEN_ITEMS_SECTION &&
                    defaultHiddenCollectionIDs.has(item.collectionID)
                ) {
                    return true;
                }

                // Archived files can only be seen in archive section or their respective collection
                if (isArchivedFile(item)) {
                    if (
                        activeCollectionID === ARCHIVE_SECTION ||
                        activeCollectionID === item.collectionID
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                }

                // ALL SECTION - show all files
                if (activeCollectionID === ALL_SECTION) {
                    return true;
                }

                // COLLECTION SECTION - show files in the active collection
                if (activeCollectionID === item.collectionID) {
                    return true;
                } else {
                    return false;
                }
            })
        );
        if (search?.clip) {
            return filteredFiles.sort((a, b) => {
                return search.clip.get(b.id) - search.clip.get(a.id);
            });
        }
        const sortAsc = activeCollection?.pubMagicMetadata?.data?.asc ?? false;
        if (sortAsc) {
            return sortFiles(filteredFiles, true);
        } else {
            return filteredFiles;
        }
    }, [
        files,
        trashedFiles,
        hiddenFiles,
        deletedFileIds,
        hiddenFileIds,
        search,
        activeCollectionID,
        archivedCollections,
    ]);

    const selectAll = (e: KeyboardEvent) => {
        // ignore ctrl/cmd + a if the user is typing in a text field
        if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement
        ) {
            return;
        }
        // if any of the modals are open, don't select all
        if (
            sidebarView ||
            uploadTypeSelectorView ||
            collectionSelectorView ||
            collectionNamerView ||
            fixCreationTimeView ||
            planModalView ||
            exportModalView ||
            authenticateUserModalView ||
            isPhotoSwipeOpen ||
            !filteredData?.length ||
            !user
        ) {
            return;
        }
        e.preventDefault();
        const selected = {
            ownCount: 0,
            count: 0,
            collectionID: activeCollectionID,
        };

        filteredData.forEach((item) => {
            if (item.ownerID === user.id) {
                selected.ownCount++;
            }
            selected.count++;
            selected[item.id] = true;
        });
        setSelected(selected);
    };

    const clearSelection = () => {
        if (!selected?.count) {
            return;
        }
        setSelected({ ownCount: 0, count: 0, collectionID: 0 });
    };

    const keyboardShortcutHandlerRef = useRef({
        selectAll,
        clearSelection,
    });

    useEffect(() => {
        keyboardShortcutHandlerRef.current = {
            selectAll,
            clearSelection,
        };
    }, [selectAll, clearSelection]);

    const fileToCollectionsMap = useMemoSingleThreaded(() => {
        return constructFileToCollectionMap(files);
    }, [files]);

    const collectionNameMap = useMemo(() => {
        if (!collections || !hiddenCollections) {
            return new Map();
        }
        return constructCollectionNameMap([
            ...collections,
            ...hiddenCollections,
        ]);
    }, [collections, hiddenCollections]);

    const showSessionExpiredMessage = () => {
        setDialogMessage(getSessionExpiredMessage());
    };

    const syncWithRemote = async (force = false, silent = false) => {
        if (syncInProgress.current && !force) {
            resync.current = { force, silent };
            return;
        }
        syncInProgress.current = true;
        try {
            checkConnectivity();
            const token = getToken();
            if (!token) {
                return;
            }
            const tokenValid = await isTokenValid(token);
            if (!tokenValid) {
                throw new Error(CustomError.SESSION_EXPIRED);
            }
            !silent && startLoading();
            const collections = await getAllLatestCollections();
            const { normalCollections, hiddenCollections } =
                await splitNormalAndHiddenCollections(collections);
            setCollections(normalCollections);
            setHiddenCollections(hiddenCollections);
            await syncFiles('normal', normalCollections, setFiles);
            await syncFiles('hidden', hiddenCollections, setHiddenFiles);
            await syncTrash(collections, setTrashedFiles);
            await syncEntities();
            await syncMapEnabled();
            if (await ClipService.isClipSupported()) {
                await syncEmbeddings();
                void ClipService.scheduleImageEmbeddingExtraction();
            }
        } catch (e) {
            switch (e.message) {
                case CustomError.SESSION_EXPIRED:
                    showSessionExpiredMessage();
                    break;
                case CustomError.KEY_MISSING:
                    clearKeys();
                    router.push(PAGES.CREDENTIALS);
                    break;
                case CustomError.NO_INTERNET_CONNECTION:
                    break;
                default:
                    logError(e, 'syncWithRemote failed');
            }
        } finally {
            setDeletedFileIds(new Set());
            setHiddenFileIds(new Set());
            !silent && finishLoading();
        }
        syncInProgress.current = false;
        if (resync.current) {
            const { force, silent } = resync.current;
            setTimeout(() => syncWithRemote(force, silent), 0);
            resync.current = null;
        }
    };

    const setupSelectAllKeyBoardShortcutHandler = () => {
        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    keyboardShortcutHandlerRef.current.clearSelection();
                    break;
                case 'a':
                    if (e.ctrlKey || e.metaKey) {
                        keyboardShortcutHandlerRef.current.selectAll(e);
                    }
                    break;
            }
        };
        document.addEventListener('keydown', handleKeyUp);
        return () => {
            document.removeEventListener('keydown', handleKeyUp);
        };
    };

    const setDerivativeState = async (
        user: User,
        collections: Collection[],
        hiddenCollections: Collection[],
        files: EnteFile[],
        trashedFiles: EnteFile[],
        hiddenFiles: EnteFile[]
    ) => {
        const favItemIds = await getFavItemIds(files);
        setFavItemIds(favItemIds);
        const archivedCollections = getArchivedCollections(collections);
        setArchivedCollections(archivedCollections);
        const defaultHiddenCollectionIDs =
            getDefaultHiddenCollectionIDs(hiddenCollections);
        setDefaultHiddenCollectionIDs(defaultHiddenCollectionIDs);
        const collectionSummaries = getCollectionSummaries(
            user,
            collections,
            files
        );
        const sectionSummaries = getSectionSummaries(
            files,
            trashedFiles,
            archivedCollections
        );
        const hiddenCollectionSummaries = getCollectionSummaries(
            user,
            hiddenCollections,
            hiddenFiles
        );
        const hiddenItemsSummaries = getHiddenItemsSummary(
            hiddenFiles,
            hiddenCollections
        );
        hiddenCollectionSummaries.set(
            HIDDEN_ITEMS_SECTION,
            hiddenItemsSummaries
        );
        setCollectionSummaries(
            mergeMaps(collectionSummaries, sectionSummaries)
        );
        setHiddenCollectionSummaries(hiddenCollectionSummaries);
    };

    if (!collectionSummaries || !filteredData) {
        return <div />;
    }

    const collectionOpsHelper =
        (ops: COLLECTION_OPS_TYPE) => async (collection: Collection) => {
            startLoading();
            try {
                setCollectionSelectorView(false);
                const selectedFiles = getSelectedFiles(selected, filteredData);
                const toProcessFiles =
                    ops === COLLECTION_OPS_TYPE.REMOVE
                        ? selectedFiles
                        : selectedFiles.filter(
                              (file) => file.ownerID === user.id
                          );
                if (toProcessFiles.length > 0) {
                    await handleCollectionOps(
                        ops,
                        collection,
                        toProcessFiles,
                        selected.collectionID
                    );
                }

                clearSelection();
                await syncWithRemote(false, true);
                if (isInHiddenSection && ops === COLLECTION_OPS_TYPE.UNHIDE) {
                    exitHiddenSection();
                }
                setActiveCollectionID(collection.id);
            } catch (e) {
                logError(e, 'collection ops failed', { ops });
                setDialogMessage({
                    title: t('ERROR'),

                    close: { variant: 'critical' },
                    content: t('UNKNOWN_ERROR'),
                });
            } finally {
                finishLoading();
            }
        };

    const fileOpsHelper = (ops: FILE_OPS_TYPE) => async () => {
        startLoading();
        try {
            // passing files here instead of filteredData for hide ops because we want to move all files copies to hidden collection
            const selectedFiles = getSelectedFiles(
                selected,
                ops === FILE_OPS_TYPE.HIDE ? files : filteredData
            );
            const toProcessFiles =
                ops === FILE_OPS_TYPE.DOWNLOAD
                    ? selectedFiles
                    : selectedFiles.filter((file) => file.ownerID === user.id);
            if (toProcessFiles.length > 0) {
                await handleFileOps(
                    ops,
                    toProcessFiles,
                    setDeletedFileIds,
                    setHiddenFileIds,
                    setFixCreationTimeAttributes
                );
            }
            clearSelection();
            await syncWithRemote(false, true);
        } catch (e) {
            logError(e, 'file ops failed', { ops });
            setDialogMessage({
                title: t('ERROR'),

                close: { variant: 'critical' },
                content: t('UNKNOWN_ERROR'),
            });
        } finally {
            finishLoading();
        }
    };

    const showCreateCollectionModal = (ops: COLLECTION_OPS_TYPE) => {
        const callback = async (collectionName: string) => {
            try {
                startLoading();
                const collection = await createAlbum(collectionName);
                await collectionOpsHelper(ops)(collection);
            } catch (e) {
                logError(e, 'create and collection ops failed', { ops });
                setDialogMessage({
                    title: t('ERROR'),

                    close: { variant: 'critical' },
                    content: t('UNKNOWN_ERROR'),
                });
            } finally {
                finishLoading();
            }
        };
        return () =>
            setCollectionNamerAttributes({
                title: t('CREATE_COLLECTION'),
                buttonText: t('CREATE'),
                autoFilledName: '',
                callback,
            });
    };

    const updateSearch: UpdateSearch = (newSearch, summary) => {
        if (newSearch?.collection) {
            setActiveCollectionID(newSearch?.collection);
        } else {
            setSearch(newSearch);
        }
        setIsClipSearchResult(!!newSearch?.clip);
        if (!newSearch?.collection) {
            setIsInSearchMode(!!newSearch);
            setSetSearchResultSummary(summary);
        } else {
            setIsInSearchMode(false);
        }
    };

    const openUploader = (intent = UploadTypeSelectorIntent.normalUpload) => {
        if (!uploadManager.shouldAllowNewUpload()) {
            return;
        }
        setUploadTypeSelectorView(true);
        setUploadTypeSelectorIntent(intent);
    };

    const closeCollectionSelector = () => {
        setCollectionSelectorView(false);
    };

    const openExportModal = () => {
        setExportModalView(true);
    };

    const closeExportModal = () => {
        setExportModalView(false);
    };

    const exitHiddenSection = () => {
        setIsInHiddenSection(false);
        setActiveCollectionID(ALL_SECTION);
    };

    return (
        <GalleryContext.Provider
            value={{
                ...defaultGalleryContext,
                showPlanSelectorModal,
                setActiveCollectionID,
                syncWithRemote,
                setBlockingLoad,
                setIsInSearchMode,
                photoListHeader,
                openExportModal,
                authenticateUser,
                userIDToEmailMap,
                user,
                emailList,
                openHiddenSection,
                isClipSearchResult,
            }}>
            <FullScreenDropZone
                getDragAndDropRootProps={getDragAndDropRootProps}>
                <UploadInputs
                    getDragAndDropInputProps={getDragAndDropInputProps}
                    getFileSelectorInputProps={getFileSelectorInputProps}
                    getFolderSelectorInputProps={getFolderSelectorInputProps}
                />
                {blockingLoad && (
                    <LoadingOverlay>
                        <EnteSpinner />
                    </LoadingOverlay>
                )}
                {isFirstLoad && (
                    <CenteredFlex>
                        <Typography color="text.muted" variant="small">
                            {t('INITIAL_LOAD_DELAY_WARNING')}
                        </Typography>
                    </CenteredFlex>
                )}
                <PlanSelector
                    modalView={planModalView}
                    closeModal={() => setPlanModalView(false)}
                    setLoading={setBlockingLoad}
                />
                <CollectionNamer
                    show={collectionNamerView}
                    onHide={setCollectionNamerView.bind(null, false)}
                    attributes={collectionNamerAttributes}
                />
                <CollectionSelector
                    open={collectionSelectorView}
                    onClose={closeCollectionSelector}
                    collectionSummaries={collectionSummaries}
                    attributes={collectionSelectorAttributes}
                    collections={collections}
                />
                <FixCreationTime
                    isOpen={fixCreationTimeView}
                    hide={() => setFixCreationTimeView(false)}
                    show={() => setFixCreationTimeView(true)}
                    attributes={fixCreationTimeAttributes}
                />
                <GalleryNavbar
                    openSidebar={openSidebar}
                    isFirstFetch={isFirstFetch}
                    setIsInSearchMode={setIsInSearchMode}
                    isInHiddenSection={isInHiddenSection}
                    openUploader={openUploader}
                    isInSearchMode={isInSearchMode}
                    collections={collections}
                    files={files}
                    updateSearch={updateSearch}
                    exitHiddenSection={exitHiddenSection}
                />

                <Collections
                    activeCollection={activeCollection}
                    isInSearchMode={isInSearchMode}
                    isInHiddenSection={isInHiddenSection}
                    activeCollectionID={activeCollectionID}
                    setActiveCollectionID={setActiveCollectionID}
                    collectionSummaries={collectionSummaries}
                    hiddenCollectionSummaries={hiddenCollectionSummaries}
                    setCollectionNamerAttributes={setCollectionNamerAttributes}
                    setPhotoListHeader={setPhotoListHeader}
                />

                <Uploader
                    activeCollection={activeCollection}
                    syncWithRemote={syncWithRemote}
                    showCollectionSelector={setCollectionSelectorView.bind(
                        null,
                        true
                    )}
                    closeUploadTypeSelector={setUploadTypeSelectorView.bind(
                        null,
                        false
                    )}
                    setCollectionSelectorAttributes={
                        setCollectionSelectorAttributes
                    }
                    closeCollectionSelector={setCollectionSelectorView.bind(
                        null,
                        false
                    )}
                    uploadTypeSelectorIntent={uploadTypeSelectorIntent}
                    setLoading={setBlockingLoad}
                    setCollectionNamerAttributes={setCollectionNamerAttributes}
                    setShouldDisableDropzone={setShouldDisableDropzone}
                    setFiles={setFiles}
                    setCollections={setCollections}
                    isFirstUpload={
                        !hasNonSystemCollections(collectionSummaries)
                    }
                    webFileSelectorFiles={webFileSelectorFiles}
                    webFolderSelectorFiles={webFolderSelectorFiles}
                    dragAndDropFiles={dragAndDropFiles}
                    uploadTypeSelectorView={uploadTypeSelectorView}
                    showUploadFilesDialog={openFileSelector}
                    showUploadDirsDialog={openFolderSelector}
                    showSessionExpiredMessage={showSessionExpiredMessage}
                />
                <Sidebar
                    collectionSummaries={collectionSummaries}
                    sidebarView={sidebarView}
                    closeSidebar={closeSidebar}
                />
                {!isInSearchMode &&
                !isFirstLoad &&
                !files?.length &&
                !hiddenFiles?.length &&
                activeCollectionID === ALL_SECTION ? (
                    <GalleryEmptyState openUploader={openUploader} />
                ) : (
                    <PhotoFrame
                        files={filteredData}
                        syncWithRemote={syncWithRemote}
                        favItemIds={favItemIds}
                        setSelected={setSelected}
                        selected={selected}
                        deletedFileIds={deletedFileIds}
                        setDeletedFileIds={setDeletedFileIds}
                        setIsPhotoSwipeOpen={setIsPhotoSwipeOpen}
                        activeCollectionID={activeCollectionID}
                        enableDownload={true}
                        fileToCollectionsMap={fileToCollectionsMap}
                        collectionNameMap={collectionNameMap}
                        showAppDownloadBanner={
                            files.length < 30 && !isInSearchMode
                        }
                        isInHiddenSection={isInHiddenSection}
                    />
                )}
                {selected.count > 0 &&
                    selected.collectionID === activeCollectionID && (
                        <SelectedFileOptions
                            handleCollectionOps={collectionOpsHelper}
                            handleFileOps={fileOpsHelper}
                            showCreateCollectionModal={
                                showCreateCollectionModal
                            }
                            setCollectionSelectorAttributes={
                                setCollectionSelectorAttributes
                            }
                            count={selected.count}
                            ownCount={selected.ownCount}
                            clearSelection={clearSelection}
                            activeCollectionID={activeCollectionID}
                            selectedCollection={getSelectedCollection(
                                selected.collectionID,
                                collections
                            )}
                            isFavoriteCollection={
                                collectionSummaries.get(activeCollectionID)
                                    ?.type === CollectionSummaryType.favorites
                            }
                            isUncategorizedCollection={
                                collectionSummaries.get(activeCollectionID)
                                    ?.type ===
                                CollectionSummaryType.uncategorized
                            }
                            isIncomingSharedCollection={
                                collectionSummaries.get(activeCollectionID)
                                    ?.type ===
                                    CollectionSummaryType.incomingShareCollaborator ||
                                collectionSummaries.get(activeCollectionID)
                                    ?.type ===
                                    CollectionSummaryType.incomingShareViewer
                            }
                            isInSearchMode={isInSearchMode}
                            isInHiddenSection={isInHiddenSection}
                        />
                    )}
                <ExportModal
                    show={exportModalView}
                    onHide={closeExportModal}
                    collectionNameMap={collectionNameMap}
                />
                <AuthenticateUserModal
                    open={authenticateUserModalView}
                    onClose={closeAuthenticateUserModal}
                    onAuthenticate={onAuthenticateCallback.current}
                />
            </FullScreenDropZone>
        </GalleryContext.Provider>
    );
}
