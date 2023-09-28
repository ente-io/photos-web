import { Box, Button } from '@mui/material';

import {
    Dispatch,
    Fragment,
    SetStateAction,
    createContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Collection } from '@/interfaces/collection';
import {
    createUnCategorizedCollection,
    getUncategorizedCollection,
    syncCollections,
} from '@/services/collectionService';
import NavBar from '@/components/pages/locker/NavBar';
import { syncFiles } from '@/services/fileService';
import { EnteFile } from '@/interfaces/file';

import { UserDetails } from '@/interfaces/user';
import { getUserDetailsV2 } from '@/services/userService';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { sortFiles } from '@/utils/file';
import { useRouter } from 'next/router';
import LockerDrawer from '@/components/pages/locker/Drawer';
import { getLocalTrash, syncTrash } from '@/services/trashService';
import FullScreenLoader from '@/components/FullScreenLoader';
import FilesSection from '@/components/pages/locker/FilesSection';
import CollectionsSection from '@/components/pages/locker/CollectionsSection';
import CollectionEmptyMessage from '@/components/pages/locker/CollectionEmptyMessage';
import TutorialDialog from '@/components/pages/locker/TutorialDialog';
import { LS_KEYS, getData, setData } from '@/utils/storage/localStorage';
import { FILE_SORT_DIRECTION, FILE_SORT_FIELD } from '@/interfaces/sort';
import DragAndDropModal from '@/components/pages/locker/DragAndDropModal';

interface lockerDashboardContextProps {
    currentCollection: Collection;
    setCurrentCollection: Dispatch<SetStateAction<Collection>>;
    collections: Collection[];
    files: EnteFile[];
    setFiles: Dispatch<SetStateAction<EnteFile[]>>;
    syncCollections: () => Promise<Collection[]>;
    uncategorizedCollection: Collection;
    syncFiles: () => Promise<void>;
    leftDrawerOpened: boolean;
    setLeftDrawerOpened: Dispatch<SetStateAction<boolean>>;
    userDetails: UserDetails;
    dashboardView: 'locker' | 'trash';
    setDashboardView: Dispatch<SetStateAction<'locker' | 'trash'>>;
    selectedFiles: EnteFile[];
    setSelectedFiles: Dispatch<SetStateAction<EnteFile[]>>;
    selectedCollections: Collection[];
    setSelectedCollections: Dispatch<SetStateAction<Collection[]>>;
    syncTrash: () => Promise<void>;
    showUploaderBoxComponent: boolean;
    setShowUploaderBoxComponent: Dispatch<SetStateAction<boolean>>;
    filteredFiles: EnteFile[];
    nameSearchQuery: string;
    setNameSearchQuery: Dispatch<SetStateAction<string>>;
    fileSortField: FILE_SORT_FIELD;
    setFileSortField: Dispatch<SetStateAction<FILE_SORT_FIELD>>;
    fileSortDirection: FILE_SORT_DIRECTION;
    setFileSortDirection: Dispatch<SetStateAction<FILE_SORT_DIRECTION>>;
}

export const LockerUploaderContext = createContext(
    {} as {
        filesToUpload: File[];
        setFilesToUpload: Dispatch<SetStateAction<File[]>>;
    }
);

export const LockerDashboardContext =
    createContext<lockerDashboardContextProps>(
        {} as lockerDashboardContextProps
    );

const Locker = () => {
    const [collections, setCollections] = useState<Collection[]>([]);

    const [currentCollection, setCurrentCollection] =
        useState<Collection | null>(null);
    const [files, setFiles] = useState<EnteFile[]>([]);

    const [uncategorizedCollection, setUncategorizedCollection] =
        useState<Collection | null>(null);

    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

    const [leftDrawerOpened, setLeftDrawerOpened] = useState<boolean>(false);

    const [collectionsPath, setCollectionsPath] = useState<Collection[]>([]);

    const [dashboardView, setDashboardView] = useState<'locker' | 'trash'>(
        'locker'
    );

    const [selectedFiles, setSelectedFiles] = useState<EnteFile[]>([]);
    const [selectedCollections, setSelectedCollections] = useState<
        Collection[]
    >([]);

    const [showUploaderBoxComponent, setShowUploaderBoxComponent] =
        useState(false);

    const [initialLoadFinished, setInitialLoadFinished] = useState(false);

    const [showTutorialDialog, setShowTutorialDialog] = useState(false);

    const [nameSearchQuery, setNameSearchQuery] = useState('');

    const [fileSortField, setFileSortField] = useState<FILE_SORT_FIELD>(
        FILE_SORT_FIELD.DATE_ADDED
    );
    const [fileSortDirection, setFileSortDirection] =
        useState<FILE_SORT_DIRECTION>(FILE_SORT_DIRECTION.ASC);

    const [showDragAndDropModal, setShowDragAndDropModal] = useState(false);

    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

    const router = useRouter();

    const doSyncCollections = async () => {
        const collections = await syncCollections();
        setCollections(collections);

        return collections;
    };

    const init = async () => {
        let userDetails: UserDetails;

        try {
            userDetails = await getUserDetailsV2();
        } catch {
            router.push('/login');
            return;
        }

        setUserDetails(userDetails);

        if (dashboardView === 'locker') {
            try {
                await doSyncCollections();
            } catch {
                router.push('/login');
                return;
            }

            let uncategorizedCollection = await getUncategorizedCollection();
            if (!uncategorizedCollection) {
                uncategorizedCollection = await createUnCategorizedCollection();
            }

            await doSyncCollections();

            // set the current collection to uncategorized
            setCurrentCollection(uncategorizedCollection);
            setUncategorizedCollection(uncategorizedCollection);
            // set path
            setCollectionsPath([uncategorizedCollection]);
        } else {
            setCollectionsPath([]);
            setCurrentCollection(null);

            await syncTrash(collections, files, () => {});

            const localTrash = await getLocalTrash();

            setFiles(sortFiles(localTrash.map((item) => item.file)));
        }

        setInitialLoadFinished(true);

        setShowTutorialDialog(!getData(LS_KEYS.TUTORIAL)?.viewed);
    };

    const doSyncTrash = async () => {
        await syncTrash(collections, files, () => {});

        if (dashboardView !== 'trash') {
            return;
        }

        const localTrash = await getLocalTrash();

        setFiles(sortFiles(localTrash.map((item) => item.file)));
    };

    useEffect(() => {
        init();
    }, [dashboardView]);

    const [dragCounter, setDragCounter] = useState(0);

    const onDragEnter = (e) => {
        e.preventDefault();
        setDragCounter((counter) => counter + 1);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        setDragCounter((counter) => counter - 1);
    };

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        if (dragCounter > 0) {
            setShowDragAndDropModal(true);
        } else if (dragCounter === 0) {
            setShowDragAndDropModal(false);
        }
    }, [dragCounter]);

    const doSyncFiles = async () => {
        if (!currentCollection) return;

        const collections = await doSyncCollections();

        const files = await syncFiles(collections);
        setFiles(sortFiles(files));
    };

    const filteredFiles = useMemo(() => {
        // if (dashboardView === 'trash') return files;
        if (!currentCollection && dashboardView !== 'trash') return files;

        let filtered: EnteFile[] = files;

        if (currentCollection) {
            filtered = filtered.filter((file) => {
                return file.collectionID === currentCollection.id;
            });
        }

        if (nameSearchQuery.trim().length > 0) {
            filtered = filtered.filter((file) => {
                return file.metadata.title
                    .toLowerCase()
                    .includes(nameSearchQuery.toLowerCase());
            });
        }

        switch (fileSortField) {
            // case FILE_SORT_FIELD.DATE_ADDED: already done by default
            case FILE_SORT_FIELD.SIZE:
                filtered = filtered.sort((a, b) => {
                    return a.info.fileSize - b.info.fileSize;
                });
                break;
            case FILE_SORT_FIELD.NAME:
                filtered = filtered.sort((a, b) => {
                    return a.metadata.title.localeCompare(b.metadata.title);
                });
                break;
            default:
                break;
        }

        if (fileSortDirection === FILE_SORT_DIRECTION.DESC) {
            filtered.reverse();
        }

        return filtered;
    }, [
        files,
        currentCollection,
        dashboardView,
        nameSearchQuery,
        fileSortField,
        fileSortDirection,
    ]);

    useEffect(() => {
        setSelectedCollections([]);
        setSelectedFiles([]);

        doSyncFiles();

        doSyncCollections();

        // set path
        if (collectionsPath.length === 0 && uncategorizedCollection) {
            setCollectionsPath([uncategorizedCollection]);
        } else if (
            collectionsPath.length > 0 &&
            collectionsPath[collectionsPath.length - 1].id !==
                currentCollection?.id
        ) {
            // if the user selects a previous collection, remove all the collections after it
            const index = collectionsPath.findIndex(
                (collection) => collection.id === currentCollection?.id
            );
            if (index !== -1) {
                setCollectionsPath(collectionsPath.slice(0, index + 1));
            } else {
                setCollectionsPath([
                    ...collectionsPath,
                    currentCollection as Collection,
                ]);
            }
        }
    }, [currentCollection]);

    return (
        <>
            {!initialLoadFinished && <FullScreenLoader />}
            <LockerDashboardContext.Provider
                value={{
                    currentCollection,
                    setCurrentCollection,
                    files,
                    setFiles,
                    syncCollections: doSyncCollections,
                    uncategorizedCollection,
                    syncFiles: doSyncFiles,
                    leftDrawerOpened,
                    setLeftDrawerOpened,
                    userDetails,
                    dashboardView,
                    setDashboardView,
                    selectedFiles,
                    setSelectedFiles,
                    collections,
                    selectedCollections,
                    setSelectedCollections,
                    syncTrash: doSyncTrash,
                    showUploaderBoxComponent,
                    setShowUploaderBoxComponent,
                    filteredFiles,
                    nameSearchQuery,
                    setNameSearchQuery,
                    fileSortField,
                    setFileSortField,
                    fileSortDirection,
                    setFileSortDirection,
                }}>
                <Box
                    height="100vh"
                    width="100vw"
                    display="flex"
                    flexDirection="column"
                    // onDragEnter={(e) => {
                    //     e.preventDefault();
                    //     setShowDragAndDropModal(true);
                    // }}
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => {
                        e.preventDefault();
                    }}>
                    <LockerUploaderContext.Provider
                        value={{ filesToUpload, setFilesToUpload }}>
                        <NavBar />
                        <DragAndDropModal
                            show={showDragAndDropModal}
                            onHide={() => {
                                setShowDragAndDropModal(false);
                            }}
                        />
                    </LockerUploaderContext.Provider>
                    <Box
                        width="100%"
                        height="100%"
                        display="flex"
                        paddingTop="5rem">
                        <LockerDrawer
                            isOpen={leftDrawerOpened}
                            setIsOpen={setLeftDrawerOpened}
                        />
                        <Box
                            width="100%"
                            height="100%"
                            padding="1rem"
                            boxSizing="border-box">
                            {dashboardView === 'locker' && (
                                <>
                                    {currentCollection?.id !==
                                        uncategorizedCollection?.id && (
                                        <Box display="flex" alignItems="center">
                                            {collectionsPath.map(
                                                (collection, i) => (
                                                    <Fragment
                                                        key={collection.id}>
                                                        <Button
                                                            variant="text"
                                                            onClick={() => {
                                                                setCurrentCollection(
                                                                    collection
                                                                );
                                                            }}>
                                                            {collection.name ===
                                                            'Uncategorized'
                                                                ? 'Home'
                                                                : collection.name}
                                                        </Button>
                                                        {collectionsPath.length -
                                                            1 !==
                                                            i && (
                                                            <ChevronRightRoundedIcon />
                                                        )}
                                                    </Fragment>
                                                )
                                            )}
                                        </Box>
                                    )}
                                </>
                            )}

                            {collections.length > 0 &&
                                currentCollection?.id ===
                                    uncategorizedCollection?.id && (
                                    <CollectionsSection />
                                )}

                            {filteredFiles.length > 0 ? (
                                <FilesSection />
                            ) : (
                                <CollectionEmptyMessage />
                            )}
                        </Box>
                    </Box>
                </Box>
            </LockerDashboardContext.Provider>
            <TutorialDialog
                open={showTutorialDialog}
                onHide={() => {
                    setShowTutorialDialog(false);
                    setData(LS_KEYS.TUTORIAL, {
                        viewed: true,
                    });
                }}
            />
        </>
    );
};

export default Locker;
