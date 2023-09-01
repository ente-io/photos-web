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
}

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

    useEffect(() => {
        init();
    }, []);

    const doSyncFiles = async () => {
        if (!currentCollection) return;

        const collections = await doSyncCollections();

        const files = await syncFiles(collections);
        setFiles(sortFiles(files));
    };

    const filteredFiles = useMemo(() => {
        if (dashboardView === 'trash') return files;
        if (!currentCollection) return files;

        const filtered = files.filter((file) => {
            return file.collectionID === currentCollection.id;
        });

        return filtered;
    }, [files, currentCollection, dashboardView]);

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
                }}>
                <Box
                    height="100vh"
                    width="100vw"
                    display="flex"
                    flexDirection="column">
                    <NavBar />
                    <Box width="100%" height="100%" display="flex">
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
