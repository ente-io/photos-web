import { LockerDashboardContext, LockerUploaderContext } from '@/pages/locker';
import { Box, IconButton, Typography } from '@mui/material';
import { useContext } from 'react';
import Image from 'next/image';
import MenuIcon from '@mui/icons-material/Menu';
import ClearIcon from '@mui/icons-material/Clear';
import { t } from 'i18next';

const NavBarLeft = () => {
    const {
        setCurrentCollection,
        uncategorizedCollection,
        setLeftDrawerOpened,
        // selectedFiles,
        // setSelectedFiles,
        // selectedCollections,
        // setSelectedCollections,
        selectedExplorerItems,
        setSelectedExplorerItems,
    } = useContext(LockerDashboardContext);

    return (
        <>
            {selectedExplorerItems.length > 0 ? (
                <Box
                    height="inherit"
                    display="flex"
                    alignItems="center"
                    gap="1rem">
                    <IconButton
                        onClick={() => {
                            setSelectedExplorerItems([]);
                        }}>
                        <ClearIcon />
                    </IconButton>
                    <Typography>
                        <b>
                            {selectedExplorerItems.length}{' '}
                            {selectedExplorerItems.length > 1
                                ? t('ITEMS')
                                : t('ITEM')}
                        </b>{' '}
                        {t('SELECTED')}
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
                        width={100}
                        height={40}
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
