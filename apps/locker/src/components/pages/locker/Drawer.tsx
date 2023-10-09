import SubscriptionCard from '@/components/Sidebar/SubscriptionCard';
import { DrawerSidebar } from '@/components/Sidebar/drawer';
import { LockerDashboardContext } from '@/pages/locker';
import { Box, Typography, Stack, Divider } from '@mui/material';
import {
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from 'react';
import CloudIcon from '@mui/icons-material/Cloud';
// import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { t } from 'i18next';
import { EnteMenuItem } from '@/components/Menu/EnteMenuItem';
import HelpSection from '@/components/Sidebar/HelpSection';
import HeaderSection from '@/components/Sidebar/Header';
import { openLink } from '@/utils/common';
import { NoStyleAnchor } from '@/components/Sidebar/styledComponents';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { getLocalFiles, syncFiles } from '@/services/fileService';
import { getLocalTrash, syncTrash } from '@/services/trashService';
import { syncCollections } from '@/services/collectionService';
import LogoutConfirmationDialog from './LogoutConfirmationDialog';
const LockerDrawer = ({
    isOpen,
    setIsOpen,
}: {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}) => {
    const { userDetails, setDashboardView } = useContext(
        LockerDashboardContext
    );

    const { collections, files } = useContext(LockerDashboardContext);

    const [localFilesCount, setLocalFilesCount] = useState<number>(0);
    const [localTrashCount, setLocalTrashCount] = useState<number>(0);

    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

    useEffect(() => {
        syncCollections().then((collections) => {
            syncFiles(collections)
                .then(() => {
                    getLocalFiles().then((files) => {
                        setLocalFilesCount(files.length);
                    });
                })
                .then(() => {
                    syncTrash(collections, files, () => {}).then(() => {
                        getLocalTrash().then((trash) => {
                            setLocalTrashCount(trash.length);
                        });
                    });
                });
        });
    }, [files, isOpen]);

    return (
        <>
            <DrawerSidebar
                disablePortal
                anchor="left"
                open={isOpen}
                onClose={() => {
                    setIsOpen(false);
                }}>
                <HeaderSection closeSidebar={() => setIsOpen(false)} />
                <Divider />
                <Typography
                    padding={1}
                    fontWeight={'medium'}
                    color="text.muted">
                    {userDetails?.email}
                </Typography>
                {userDetails && (
                    <Box px={0.5} mt={0.5} pb={1.5} mb={1}>
                        <SubscriptionCard
                            userDetails={userDetails}
                            onClick={() => {
                                window.open('https://web.ente.io');
                            }}
                        />
                    </Box>
                )}
                <Stack spacing={0.5} mb={3}>
                    <EnteMenuItem
                        startIcon={<CloudIcon />}
                        label={t('LOCKER')}
                        onClick={() => {
                            setDashboardView('locker');
                            setIsOpen(false);
                        }}
                        variant="captioned"
                        subText={(
                            localFilesCount +
                            collections.length -
                            1
                        ).toString()}
                    />
                    <EnteMenuItem
                        startIcon={<DeleteOutlineIcon />}
                        label={t('TRASH')}
                        onClick={() => {
                            setDashboardView('trash');
                            setIsOpen(false);
                        }}
                        variant="captioned"
                        subText={localTrashCount.toString()}
                    />
                    <EnteMenuItem
                        labelComponent={
                            <NoStyleAnchor href="https://web.ente.io">
                                <Typography fontWeight={'bold'}>
                                    {t('ACCOUNT_SETTINGS')}
                                </Typography>
                            </NoStyleAnchor>
                        }
                        variant="secondary"
                        onClick={() => openLink('https://web.ente.io', true)}
                    />

                    <Divider />
                    <HelpSection />
                    <Divider />
                    <EnteMenuItem
                        startIcon={<LogoutIcon />}
                        label={t('LOGOUT')}
                        onClick={() => {
                            setShowLogoutConfirmation(true);
                        }}
                        color="critical"
                        variant="secondary"
                    />
                </Stack>{' '}
                {/* </Stack> */}
                {/* <ListItem>
                    <ListItemButton>
                        <ListItemIcon>
                            <SettingsIcon />
                        </ListItemIcon>
                        <ListItemText primary="Settings" />
                    </ListItemButton>
                </ListItem> */}
                {/* </List> */}
            </DrawerSidebar>
            <LogoutConfirmationDialog
                show={showLogoutConfirmation}
                onHide={() => {
                    setShowLogoutConfirmation(false);
                }}
            />
        </>
    );
};

export default LockerDrawer;
