import { Box, Button, Typography } from '@mui/material';

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

import DownloadIcon from '@mui/icons-material/Download';
import { downloadFile } from '@/utils/file';
import CloudIcon from '@mui/icons-material/Cloud';
import CollectionComponent from '@/components/pages/locker/Collection';

interface lockerDashboardContextProps {
    currentCollection: Collection;
    setCurrentCollection: Dispatch<SetStateAction<Collection>>;
    files: EnteFile[];
    setFiles: Dispatch<SetStateAction<EnteFile[]>>;
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

    useEffect(() => {
        const init = async () => {
            setCollections(await syncCollections());

            let uncategorizedCollection = await getUncategorizedCollection();
            if (!uncategorizedCollection) {
                uncategorizedCollection = await createUnCategorizedCollection();
            }

            setCollections(await syncCollections());

            // set the current collection to uncategorized
            setCurrentCollection(uncategorizedCollection);
        };

        init();
    }, []);

    useEffect(() => {
        if (!currentCollection) return;
        addLogLine(`Syncing files for collection ${currentCollection.name}`);
        const sync = async () => {
            const files = await syncFiles([currentCollection], () => {});
            console.log(files);
            setFiles(files);
        };

        sync();
    }, [currentCollection]);

    return (
        <>
            <LockerDashboardContext.Provider
                value={{
                    currentCollection,
                    setCurrentCollection,
                    files,
                    setFiles,
                }}>
                <Box
                    height="100vh"
                    width="100vw"
                    display="flex"
                    flexDirection="column">
                    <NavBar />
                    <Box width="100%" height="100%" display="flex">
                        <Box
                            width="fit-content"
                            borderRight={borderProperty}
                            padding="1rem"
                            boxSizing={'border-box'}
                            height="100%"
                            display="flex"
                            flexDirection="column">
                            <Button
                                variant="text"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}>
                                <CloudIcon />
                                <Typography>Locker</Typography>
                            </Button>
                            <Button
                                variant="text"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}>
                                <FolderDeleteIcon />
                                <Typography>Trash</Typography>
                            </Button>
                            <Box
                                sx={{
                                    height: '100%',
                                }}
                            />
                            <Button
                                variant="text"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}>
                                <SettingsIcon />
                                <Typography>Settings</Typography>
                            </Button>
                        </Box>
                        <Box width="100%" padding="1rem" boxSizing="border-box">
                            {collections.length > 0 && (
                                <>
                                    <h3>Collections</h3>
                                    {collections.map((collection) => (
                                        <CollectionComponent
                                            collection={collection}
                                            key={collection.id}
                                        />
                                    ))}
                                </>
                            )}

                            <h3>Files</h3>
                            <Box
                                display="flex"
                                flexWrap="wrap"
                                gap="1rem"
                                width="100%">
                                {files.map((file) => (
                                    <Box
                                        bgcolor="#201E1E"
                                        width="15rem"
                                        height="3rem"
                                        borderRadius="10px"
                                        padding=".5rem"
                                        boxSizing={'border-box'}
                                        key={file.id}
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="space-between">
                                        <Typography
                                            textOverflow="ellipsis"
                                            overflow="hidden">
                                            {file.metadata.title}
                                        </Typography>
                                        <button
                                            style={{
                                                all: 'unset',
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}>
                                            <DownloadIcon
                                                onClick={() => {
                                                    downloadFile(file, false);
                                                }}
                                            />
                                        </button>
                                    </Box>
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
