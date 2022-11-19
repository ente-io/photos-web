import VerifyTwoFactor, {
    VerifyTwoFactorCallback,
} from 'components/TwoFactor/VerifyForm';
import router from 'next/router';
import React, { useEffect, useState } from 'react';
import { logoutUser, verifyTwoFactor } from 'services/userService';
import { PAGES } from 'constants/pages';
import { User } from 'types/user';
import { setData, getData } from 'utils/storage/localStorage';
import constants from 'utils/strings/constants';
import LinkButton from 'components/pages/gallery/LinkButton';
import FormContainer from 'components/Form/FormContainer';
import FormPaper from 'components/Form/FormPaper';
import FormTitle from 'components/Form/FormPaper/Title';
import FormPaperFooter from 'components/Form/FormPaper/Footer';

export default function Home() {
    const [sessionID, setSessionID] = useState('');

    useEffect(() => {
        const main = async () => {
            router.prefetch(PAGES.CREDENTIALS);
            const user: User = getData('USER');
            if (!user?.email || !user.twoFactorSessionID) {
                router.push(PAGES.ROOT);
            } else if (
                !user.isTwoFactorEnabled &&
                (user.encryptedToken || user.token)
            ) {
                router.push(PAGES.CREDENTIALS);
            } else {
                setSessionID(user.twoFactorSessionID);
            }
        };
        main();
    }, []);

    const onSubmit: VerifyTwoFactorCallback = async (otp) => {
        try {
            const resp = await verifyTwoFactor(otp, sessionID);
            const { keyAttributes, encryptedToken, token, id } = resp;
            setData('USER', {
                ...getData('USER'),
                token,
                encryptedToken,
                id,
            });
            setData('KEY_ATTRIBUTES', keyAttributes);
            router.push(PAGES.CREDENTIALS);
        } catch (e) {
            if (e.status === 404) {
                logoutUser();
            } else {
                throw e;
            }
        }
    };
    return (
        <FormContainer>
            <FormPaper sx={{ maxWidth: '410px' }}>
                <FormTitle>{constants.TWO_FACTOR}</FormTitle>
                <VerifyTwoFactor
                    onSubmit={onSubmit}
                    buttonText={constants.VERIFY}
                />

                <FormPaperFooter>
                    <LinkButton
                        onClick={() => router.push(PAGES.TWO_FACTOR_RECOVER)}>
                        {constants.LOST_DEVICE}
                    </LinkButton>
                </FormPaperFooter>
            </FormPaper>
        </FormContainer>
    );
}
