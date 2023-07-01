import { Box, Button, Typography } from '@mui/material';

import {
    Dispatch,
    Fragment,
    SetStateAction,
    createContext,
    useEffect,
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
import { addLogLine } from '@/utils/logging';

import CollectionComponent from '@/components/pages/locker/Collection';
import FileComponent from '@/components/pages/locker/File';
import { UserDetails } from '@/interfaces/user';
import { getUserDetailsV2 } from '@/services/userService';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import Image from 'next/image';
import { sortFiles } from '@/utils/file';
import { useRouter } from 'next/router';
import LockerDrawer from '@/components/pages/locker/Drawer';
import { getLocalTrash, syncTrash } from '@/services/trashService';

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
    const [filteredFiles, setFilteredFiles] = useState<EnteFile[]>([]);

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

            await syncTrash(collections, files, setFiles);

            const localTrash = await getLocalTrash();

            setFiles(sortFiles(localTrash.map((item) => item.file)));
        }
    };

    const doSyncTrash = async () => {
        await syncTrash(collections, files, setFiles);

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

    const filterFiles = async () => {
        const filtered = files.filter((file) => {
            return file.collectionID === currentCollection.id;
        });

        setFilteredFiles(filtered);
    };

    useEffect(() => {
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

    useEffect(() => {
        if (dashboardView === 'trash') {
            setFilteredFiles(files);
            return;
        } else if (!currentCollection) {
            return;
        }
        filterFiles();
    }, [files, currentCollection, dashboardView]);

    return (
        <>
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
                            {currentCollection?.id !==
                                uncategorizedCollection?.id && (
                                <Box display="flex" alignItems="center">
                                    {collectionsPath.map((collection, i) => (
                                        <Fragment key={collection.id}>
                                            <Button
                                                variant="text"
                                                onClick={() => {
                                                    setCurrentCollection(
                                                        collection
                                                    );
                                                }}>
                                                {collection.name}
                                            </Button>
                                            {collectionsPath.length - 1 !==
                                                i && (
                                                <ChevronRightRoundedIcon />
                                            )}
                                        </Fragment>
                                    ))}
                                </Box>
                            )}
                            {collections.length > 0 &&
                                currentCollection?.id ===
                                    uncategorizedCollection?.id && (
                                    <>
                                        <h3>Collections</h3>
                                        <Box
                                            gap="1rem"
                                            flexWrap="wrap"
                                            display="flex">
                                            {collections
                                                .filter(
                                                    (r) =>
                                                        r.id !==
                                                        uncategorizedCollection?.id
                                                )
                                                .map((collection) => (
                                                    <CollectionComponent
                                                        collection={collection}
                                                        key={collection.id}
                                                    />
                                                ))}
                                        </Box>
                                    </>
                                )}

                            {filteredFiles.length > 0 ? (
                                <>
                                    <h3>Files</h3>
                                    <Box
                                        display="grid"
                                        gridTemplateColumns={
                                            'repeat(auto-fill, minmax(200px, 1fr))'
                                        }
                                        gap="1rem"
                                        width="100%">
                                        {filteredFiles.map((file) => (
                                            <FileComponent
                                                file={file}
                                                key={file.id}
                                            />
                                        ))}
                                    </Box>
                                </>
                            ) : (
                                <Box
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                    flexDirection={'column'}
                                    gap="2rem"
                                    marginTop="1rem">
                                    <Image
                                        src="/images/empty-state/ente_duck.png"
                                        height={288}
                                        width={376}
                                        alt="Yellow duck smiling and dancing with the word ente in the background"
                                    />
                                    <Typography fontSize={24}>
                                        No files in this collection. Upload some
                                        files to get started!
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            </LockerDashboardContext.Provider>
        </>
    );
};

export default Locker;
