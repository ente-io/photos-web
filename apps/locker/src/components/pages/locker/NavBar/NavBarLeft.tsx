import { LockerDashboardContext } from '@/pages/locker';
import { Box, IconButton, Typography } from '@mui/material';
import { useContext } from 'react';
import Image from 'next/image';
import MenuIcon from '@mui/icons-material/Menu';
import ClearIcon from '@mui/icons-material/Clear';

const NavBarLeft = () => {
    const {
        setCurrentCollection,
        uncategorizedCollection,
        setLeftDrawerOpened,
        selectedFiles,
        setSelectedFiles,
    } = useContext(LockerDashboardContext);
    return (
        <>
            {selectedFiles.length > 0 ? (
                <Box
                    height="inherit"
                    display="flex"
                    alignItems="center"
                    gap="1rem">
                    <IconButton
                        onClick={() => {
                            setSelectedFiles([]);
                        }}>
                        <ClearIcon />
                    </IconButton>
                    <Typography>
                        <b>{selectedFiles.length} files</b> selected
                    </Typography>
                </Box>
            ) : (
                <Box
                    height="inherit"
                    display="flex"
                    alignItems="center"
                    gap="1rem">
                    <IconButton
                        onClick={() => {
                            setLeftDrawerOpened(true);
                        }}>
                        <MenuIcon />
                    </IconButton>
                    <Image
                        src="/locker.svg"
                        alt="ente Locker logo"
                        width={200}
                        height={50}
                        onClick={() => {
                            setCurrentCollection(uncategorizedCollection);
                        }}
                    />
                </Box>
            )}
        </>
    );
};

export default NavBarLeft;
