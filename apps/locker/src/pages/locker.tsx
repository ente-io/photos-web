import { Box, Button, Container, IconButton, Typography } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';

import FolderIcon from '@mui/icons-material/Folder';
import FolderDeleteIcon from '@mui/icons-material/FolderDelete';
import SettingsIcon from '@mui/icons-material/Settings';
import HTTPService from '@/services/HTTPService';
import { getToken } from '@/utils/key';
import { useEffect } from 'react';

const borderProperty = '1px solid #414141';

const Locker = () => {
    const fetchCollections = async () => {
        const res = await HTTPService.get(
            `${process.env.NEXT_PUBLIC_API_URL}/collections`,
            {},
            {
                'X-Auth-Token': getToken(),
            }
        );

        const data = res.data;
    };

    useEffect(() => {
        fetchCollections();
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
                        <Button
                            variant="text"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}>
                            <FolderIcon />
                            <Typography>Files</Typography>
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
                </Box>
            </Box>
        </>
    );
};

export default Locker;
