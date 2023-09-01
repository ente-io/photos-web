import { LockerDashboardContext } from '@/pages/locker';
import { Box, Typography } from '@mui/material';
import { t } from 'i18next';
import Image from 'next/image';
import { useContext } from 'react';

const CollectionEmptyMessage = () => {
    const { dashboardView } = useContext(LockerDashboardContext);

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            flexDirection={'column'}
            gap="2rem"
            marginTop="10rem">
            {dashboardView === 'locker' && (
                <Image
                    src="/images/empty-state/ente_duck.png"
                    height={288}
                    width={376}
                    alt="Yellow duck smiling and dancing with the word ente in the background"
                />
            )}
            <Typography fontSize={24} lineHeight={1.25} textAlign="center">
                {t(
                    dashboardView === 'trash'
                        ? 'NO_TRASH_FILES'
                        : 'NO_FILES_GET_STARTED'
                )}
            </Typography>
        </Box>
    );
};

export default CollectionEmptyMessage;
