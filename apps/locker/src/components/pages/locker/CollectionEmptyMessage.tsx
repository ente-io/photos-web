import { Box, Typography } from '@mui/material';
import { t } from 'i18next';
import Image from 'next/image';

const CollectionEmptyMessage = () => {
    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            flexDirection={'column'}
            gap="2rem"
            marginTop="1rem">
            <Image
                src="/images/empty-state/ente_duck.png"
                height={288}
                width={376}
                alt="Yellow duck smiling and dancing with the word ente in the background"
            />
            <Typography fontSize={24} lineHeight={1.25} textAlign="center">
                {t('NO_FILES_GET_STARTED')}
            </Typography>
        </Box>
    );
};

export default CollectionEmptyMessage;
