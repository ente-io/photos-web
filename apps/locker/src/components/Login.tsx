import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { sendOtt } from 'services/userService';
import { setData, LS_KEYS } from 'utils/storage/localStorage';
import { PAGES } from 'constants/pages';
import FormPaperTitle from './Form/FormPaper/Title';
import FormPaperFooter from './Form/FormPaper/Footer';
import LinkButton from './pages/gallery/LinkButton';
import SingleInputForm, { SingleInputFormProps } from './SingleInputForm';
import { Box, Input } from '@mui/material';
import { t } from 'i18next';
import NoRegistrationDialog from './NoRegistrationDialog';

// interface LoginProps {
//     signUp: () => void;
// }

export default function Login() {
    // props: LoginProps
    const [showNoRegistrationDialog, setShowNoRegistrationDialog] =
        useState(false);

    const router = useRouter();

    const loginUser: SingleInputFormProps['callback'] = async (
        email,
        setFieldError
    ) => {
        try {
            await sendOtt(email);
            setData(LS_KEYS.USER, { email });
            router.push(PAGES.VERIFY);
        } catch (e) {
            setFieldError(`${t('UNKNOWN_ERROR} ${e.message}')}`);
        }
    };

    return (
        <>
            <Box>
                <FormPaperTitle>{t('LOGIN')} to ente Locker</FormPaperTitle>
                <SingleInputForm
                    callback={loginUser}
                    fieldType="email"
                    placeholder={t('ENTER_EMAIL')}
                    buttonText={t('LOGIN')}
                    autoComplete="username"
                    hiddenPostInput={
                        <Input
                            hidden
                            style={{
                                display: 'none',
                            }}
                            type="password"
                            value=""
                        />
                    }
                />

                <FormPaperFooter>
                    <LinkButton
                        onClick={() => {
                            setShowNoRegistrationDialog(true);
                        }}>
                        {t('NO_ACCOUNT')}
                    </LinkButton>
                </FormPaperFooter>
            </Box>
            <NoRegistrationDialog
                show={showNoRegistrationDialog}
                onHide={() => {
                    setShowNoRegistrationDialog(false);
                }}
            />
        </>
    );
}
