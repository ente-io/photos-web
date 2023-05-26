import { Box, Button, Container, IconButton, Typography } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';

import FolderIcon from '@mui/icons-material/Folder';
import FolderDeleteIcon from '@mui/icons-material/FolderDelete';
import SettingsIcon from '@mui/icons-material/Settings';
import HTTPService from '@/services/HTTPService';
import { getToken } from '@/utils/key';
import { useEffect, useState } from 'react';
import { Collection, CollectionSummaries } from '@/interfaces/collection';
import {
    createUnCategorizedCollection,
    getCollectionSummaries,
    getUncategorizedCollection,
    syncCollections,
} from '@/services/collectionService';
import { LS_KEYS, getData } from '@/utils/storage/localStorage';
import { User } from '@/interfaces/user';

const borderProperty = '1px solid #414141';

const Locker = () => {
    const [collections, setCollections] = useState<Collection[]>([]);

    useEffect(() => {
        const init = async () => {
            setCollections(await syncCollections());

            let uncategorizedCollection = await getUncategorizedCollection();
            if (!uncategorizedCollection) {
                uncategorizedCollection = await createUnCategorizedCollection();
            }

            console.log(uncategorizedCollection);

            setCollections(await syncCollections());
        };

        init();
    }, []);

    return (
        <>
            <Box
                sx={{
                    height: '100vh',
                    width: '100vw',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                <Box
                    sx={{
                        padding: '1rem',
                        borderBottom: borderProperty,
                    }}>
                    <Link href="/locker">
                        <Image
                            src="/locker.svg"
                            alt="ente Locker logo"
                            width={200}
                            height={50}
                        />
                    </Link>
                </Box>
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
        </>
    );
};

export default Locker;
