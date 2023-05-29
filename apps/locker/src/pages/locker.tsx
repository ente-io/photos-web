import { Box, Button, Typography } from '@mui/material';

import FolderIcon from '@mui/icons-material/Folder';
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
            // setCurrentCollection(uncategorizedCollection);
        };

        init();
    }, []);

    useEffect(() => {
        if (!currentCollection) return;
        addLogLine(`Syncing files for collection ${currentCollection.name}`);
        const sync = async () => {
            const files = await syncFiles([currentCollection], () => {});
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
                            {collections.length > 0 && (
                                <>
                                    {collections.map((collection) => (
                                        <Button
                                            key={collection.id}
                                            variant="text"
                                            color={
                                                currentCollection?.id ===
                                                collection.id
                                                    ? 'accent'
                                                    : 'inherit'
                                            }
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                            }}
                                            onClick={() => {
                                                setCurrentCollection(
                                                    collection
                                                );
                                            }}>
                                            <FolderIcon />
                                            <Typography>
                                                {collection.name}
                                            </Typography>
                                        </Button>
                                    ))}
                                </>
                            )}
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
                        <Box
                            sx={{
                                width: '100%',
                            }}>
                            {files.map((file) => (
                                <Typography key={file.id}>
                                    {file.metadata.title}
                                </Typography>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </LockerDashboardContext.Provider>
        </>
    );
};

export default Locker;
