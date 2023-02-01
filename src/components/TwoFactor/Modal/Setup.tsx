import React from 'react';
import LockIcon from '@mui/icons-material/Lock';
import { PAGES } from 'constants/pages';
import { useRouter } from 'next/router';
import constants from 'utils/strings/constants';
import VerticallyCentered from 'components/Container';
import { Typography } from '@mui/material';
import EnteButton from 'components/EnteButton';

interface Iprops {
    closeDialog: () => void;
}

export default function TwoFactorModalSetupSection({ closeDialog }: Iprops) {
    const router = useRouter();
    const redirectToTwoFactorSetup = () => {
        closeDialog();
        router.push(PAGES.TWO_FACTOR_SETUP);
    };

    return (
        <VerticallyCentered sx={{ mb: 2 }}>
            <LockIcon sx={{ fontSize: (theme) => theme.spacing(5), mb: 2 }} />
            <Typography mb={4}>{constants.TWO_FACTOR_INFO}</Typography>
            <EnteButton
                variant="primary"
                size="large"
                onClick={redirectToTwoFactorSetup}>
                {constants.ENABLE_TWO_FACTOR}
            </EnteButton>
        </VerticallyCentered>
    );
}
