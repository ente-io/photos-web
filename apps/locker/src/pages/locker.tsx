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

interface lockerDashboardContextProps {
    currentCollection: Collection;
    setCurrentCollection: Dispatch<SetStateAction<Collection>>;
}

const LockerDashboardContext = createContext({} as lockerDashboardContextProps);

const Locker = () => {
    const [collections, setCollections] = useState<Collection[]>([]);

    const [currentCollection, setCurrentCollection] = useState<Collection>();

    useEffect(() => {
        const init = async () => {
            setCollections(await syncCollections());

            let uncategorizedCollection = await getUncategorizedCollection();
            if (!uncategorizedCollection) {
                uncategorizedCollection = await createUnCategorizedCollection();
            }

            setCollections(await syncCollections());

            // set the current collection to uncategorized
        };

        init();
    }, []);

    return (
        <>
            <LockerDashboardContext.Provider
                value={{
                    currentCollection,
                    setCurrentCollection,
                }}>
                <Box
                    sx={{
                        height: '100vh',
                        width: '100vw',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                    <NavBar />
                    <Box
                        sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                        }}>
                        <Box
                            sx={{
                                height: '100%',
                                borderRight: borderProperty,
                                width: 'fit-content',
                                padding: '1rem',
                                boxSizing: 'border-box',
                                display: 'flex',
                                flexDirection: 'column',
                            }}>
                            {collections.map((collection) => (
                                <Button
                                    key={collection.id}
                                    variant="text"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color:
                                            currentCollection?.id ===
                                            collection.id
                                                ? '#fff'
                                                : '#2AB954',
                                    }}
                                    onClick={() => {
                                        setCurrentCollection(collection);
                                    }}>
                                    <FolderIcon />
                                    <Typography>{collection.name}</Typography>
                                </Button>
                            ))}
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
                    </Box>
                </Box>
            </LockerDashboardContext.Provider>
        </>
    );
};

export default Locker;
