import {
    Box,
    Button,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
} from '@mui/material';

import FolderDeleteIcon from '@mui/icons-material/FolderDelete';
import SettingsIcon from '@mui/icons-material/Settings';
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

import CloudIcon from '@mui/icons-material/Cloud';
import CollectionComponent from '@/components/pages/locker/Collection';
import FileComponent from '@/components/pages/locker/File';
import { UserDetails } from '@/interfaces/user';
import { getUserDetailsV2 } from '@/services/userService';
import SubscriptionCard from '@/components/Sidebar/SubscriptionCard';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import Image from 'next/image';
import { sortFiles } from '@/utils/file';
interface lockerDashboardContextProps {
    currentCollection: Collection;
    setCurrentCollection: Dispatch<SetStateAction<Collection>>;
    files: EnteFile[];
    setFiles: Dispatch<SetStateAction<EnteFile[]>>;
    syncCollections: () => Promise<void>;
    uncategorizedCollection: Collection;
    syncFiles: () => Promise<void>;
    leftDrawerOpened: boolean;
    setLeftDrawerOpened: Dispatch<SetStateAction<boolean>>;
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

    const doSyncCollections = async () => {
        setCollections(await syncCollections());
    };

    useEffect(() => {
        const init = async () => {
            await doSyncCollections();

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

            const userDetails = await getUserDetailsV2();
            setUserDetails(userDetails);
        };

        init();
    }, []);

    const doSyncFiles = async () => {
        if (!currentCollection) return;
        addLogLine(`Syncing files for collection ${currentCollection.name}`);

        const files = await syncFiles(collections, () => {});
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
        if (!currentCollection) return;
        filterFiles();
    }, [files, currentCollection]);

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
                }}>
                <Box
                    height="100vh"
                    width="100vw"
                    display="flex"
                    flexDirection="column">
                    <NavBar />
                    <Box width="100%" height="100%" display="flex">
                        <Drawer
                            anchor="left"
                            open={leftDrawerOpened}
                            onClose={() => {
                                setLeftDrawerOpened(false);
                            }}>
                            <List>
                                <ListItem>
                                    <IconButton
                                        onClick={() => {
                                            setLeftDrawerOpened(false);
                                        }}>
                                        <MenuIcon />
                                    </IconButton>
                                </ListItem>
                                <ListItem>
                                    {userDetails && (
                                        <SubscriptionCard
                                            userDetails={userDetails}
                                            onClick={() => {
                                                console.log('Hello!');
                                            }}
                                        />
                                    )}
                                </ListItem>
                                <ListItem>
                                    <ListItemButton>
                                        <ListItemIcon>
                                            <CloudIcon />
                                        </ListItemIcon>
                                        <ListItemText primary="Locker" />
                                    </ListItemButton>
                                </ListItem>
                                <ListItem>
                                    <ListItemButton>
                                        <ListItemIcon>
                                            <FolderDeleteIcon />
                                        </ListItemIcon>
                                        <ListItemText primary="Trash" />
                                    </ListItemButton>
                                </ListItem>
                                <ListItem>
                                    <ListItemButton>
                                        <ListItemIcon>
                                            <SettingsIcon />
                                        </ListItemIcon>
                                        <ListItemText primary="Settings" />
                                    </ListItemButton>
                                </ListItem>
                            </List>
                        </Drawer>
                        <Box
                            width="100%"
                            height="100%"
                            padding="1rem"
                            boxSizing="border-box">
                            {currentCollection?.id !==
                                uncategorizedCollection?.id && (
                                <Box
                                    display="flex"
                                    gap="0.5rem"
                                    alignItems="center">
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
                                        display="flex"
                                        flexWrap="wrap"
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
