import React, { useEffect, useState } from 'react';
import { enableTwoFactor, setupTwoFactor } from 'services/userService';
import constants from 'utils/strings/constants';
import VerticallyCentered from 'components/Container';
import { useRouter } from 'next/router';
import VerifyTwoFactor, {
    VerifyTwoFactorCallback,
} from 'components/TwoFactor/VerifyForm';
import { encryptWithRecoveryKey } from 'utils/crypto';
import { setData, getData } from 'utils/storage/localStorage';
import { PAGES } from 'constants/pages';
import { TwoFactorSecret } from 'types/user';
import Card from '@mui/material/Card';
import { Box, CardContent, Typography } from '@mui/material';
import { TwoFactorSetup } from 'components/TwoFactor/Setup';
import LinkButton from 'components/pages/gallery/LinkButton';
import { logError } from 'utils/sentry';

export enum SetupMode {
    QR_CODE,
    MANUAL_CODE,
}

export default function SetupTwoFactor() {
    const [twoFactorSecret, setTwoFactorSecret] =
        useState<TwoFactorSecret>(null);

    const router = useRouter();
    useEffect(() => {
        if (twoFactorSecret) {
            return;
        }
        const main = async () => {
            try {
                const twoFactorSecret = await setupTwoFactor();
                setTwoFactorSecret(twoFactorSecret);
            } catch (e) {
                logError(e, 'failed to get two factor setup code');
            }
        };
        main();
    }, []);

    const onSubmit: VerifyTwoFactorCallback = async (
        otp: string,
        markSuccessful
    ) => {
        const recoveryEncryptedTwoFactorSecret = await encryptWithRecoveryKey(
            twoFactorSecret.secretCode
        );
        await enableTwoFactor(otp, recoveryEncryptedTwoFactorSecret);
        await markSuccessful();
        setData('USER', {
            ...getData('USER'),
            isTwoFactorEnabled: true,
        });
        router.push(PAGES.GALLERY);
    };

    return (
        <VerticallyCentered>
            <Card>
                <CardContent>
                    <VerticallyCentered sx={{ p: 3 }}>
                        <Box mb={4}>
                            <Typography variant="title">
                                {constants.TWO_FACTOR}
                            </Typography>
                        </Box>
                        <TwoFactorSetup twoFactorSecret={twoFactorSecret} />
                        <VerifyTwoFactor
                            onSubmit={onSubmit}
                            buttonText={constants.ENABLE}
                        />
                        <LinkButton sx={{ mt: 2 }} onClick={router.back}>
                            {constants.GO_BACK}
                        </LinkButton>
                    </VerticallyCentered>
                </CardContent>
            </Card>
        </VerticallyCentered>
    );
}
