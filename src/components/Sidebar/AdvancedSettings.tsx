import ChevronRight from '@mui/icons-material/ChevronRight';
import ScienceIcon from '@mui/icons-material/Science';
import { Box, DialogProps, Stack } from '@mui/material';
import { EnteDrawer } from 'components/EnteDrawer';
import MLSearchSettings from 'components/MachineLearning/MLSearchSettings';
import MenuSectionTitle from 'components/Menu/MenuSectionTitle';
import Titlebar from 'components/Titlebar';
import { PAGES } from 'constants/pages';
import { useRouter } from 'next/router';
import { useState } from 'react';
import constants from 'utils/strings/constants';
import SidebarButton from './Button';

export default function AdvancedSettings({ open, onClose, onRootClose }) {
    const [mlSearchSettingsView, setMlSearchSettingsView] = useState(false);

    const router = useRouter();

    const openMlSearchSettings = () => setMlSearchSettingsView(true);
    const closeMlSearchSettings = () => setMlSearchSettingsView(false);

    const handleRootClose = () => {
        onClose();
        onRootClose();
    };

    const handleDrawerClose: DialogProps['onClose'] = (_, reason) => {
        if (reason === 'backdropClick') {
            handleRootClose();
        } else {
            onClose();
        }
    };

    const openMLDebugPage = () => {
        router.push(PAGES.ML_DEBUG);
    };

    return (
        <EnteDrawer
            transitionDuration={0}
            open={open}
            onClose={handleDrawerClose}
            BackdropProps={{
                sx: { '&&&': { backgroundColor: 'transparent' } },
            }}>
            <Stack spacing={'4px'} py={'12px'}>
                <Titlebar
                    onClose={onClose}
                    title={constants.ADVANCED}
                    onRootClose={handleRootClose}
                />

                <Box px={'8px'}>
                    <Stack py="20px" spacing="24px">
                        <Box>
                            <MenuSectionTitle
                                title={constants.LABS}
                                icon={<ScienceIcon />}
                            />
                            <SidebarButton
                                variant="contained"
                                color="secondary"
                                endIcon={<ChevronRight />}
                                onClick={openMlSearchSettings}>
                                {constants.ML_SEARCH}
                            </SidebarButton>
                        </Box>
                        <SidebarButton
                            variant="contained"
                            color="secondary"
                            endIcon={<ChevronRight />}
                            onClick={openMLDebugPage}>
                            {constants.ML_DEBUG}
                        </SidebarButton>
                    </Stack>
                </Box>
            </Stack>
            <MLSearchSettings
                open={mlSearchSettingsView}
                onClose={closeMlSearchSettings}
                onRootClose={handleRootClose}
            />
        </EnteDrawer>
    );
}
