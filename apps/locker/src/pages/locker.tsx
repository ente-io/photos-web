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
import { borderProperty } from '@/constants/ui/locker/border';
import NavBar from '@/components/pages/locker/NavBar';
import { syncFiles } from '@/services/fileService';
import { EnteFile } from '@/interfaces/file';
import { addLogLine } from '@/utils/logging';

import CloudIcon from '@mui/icons-material/Cloud';
import CollectionComponent from '@/components/pages/locker/Collection';
import FileComponent from '@/components/pages/locker/File';
import StorageSection from '@/components/Sidebar/SubscriptionCard/contentOverlay/storageSection';
import { IndividualSubscriptionCardContent } from '@/components/Sidebar/SubscriptionCard/contentOverlay/individual';
import { UserDetails } from '@/interfaces/user';
import { getUserDetailsV2 } from '@/services/userService';
import SubscriptionCard from '@/components/Sidebar/SubscriptionCard';
import MenuIcon from '@mui/icons-material/Menu';

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

    const [uncategorizedCollection, setUncategorizedCollection] =
        useState<Collection | null>(null);

    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

    const [leftDrawerOpened, setLeftDrawerOpened] = useState<boolean>(false);

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

            const userDetails = await getUserDetailsV2();
            setUserDetails(userDetails);
        };

        init();
    }, []);

    const doSyncFiles = async () => {
        if (!currentCollection) return;
        addLogLine(`Syncing files for collection ${currentCollection.name}`);

        const files = await syncFiles([currentCollection], () => {});
        setFiles(files);
    };

    useEffect(() => {
        doSyncFiles();
    }, [currentCollection]);

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
                        <Box width="100%" padding="1rem" boxSizing="border-box">
                            {collections.length > 0 && (
                                <>
                                    <h3>Collections</h3>
                                    <Box
                                        gap="1rem"
                                        flexWrap="wrap"
                                        display="flex">
                                        {collections.map((collection) => (
                                            <CollectionComponent
                                                collection={collection}
                                                key={collection.id}
                                            />
                                        ))}
                                    </Box>
                                </>
                            )}

                            <h3>Files</h3>
                            <Box
                                display="flex"
                                flexWrap="wrap"
                                gap="1rem"
                                width="100%">
                                {files.map((file) => (
                                    <FileComponent file={file} key={file.id} />
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </LockerDashboardContext.Provider>
        </>
    );
};

export default Locker;
