import React, { useState, useEffect } from 'react';
import { t } from 'i18next';

import { getData, LS_KEYS, setData } from 'utils/storage/localStorage';
import { useRouter } from 'next/router';
import {
    saveKeyInSessionStore,
    generateAndSaveIntermediateKeyAttributes,
} from 'utils/crypto';
import { getActualKey } from 'utils/common/key';
import { setKeys } from 'services/userService';
import SetPasswordForm, {
    SetPasswordFormProps,
} from 'components/SetPasswordForm';
import { SESSION_KEYS } from 'utils/storage/sessionStorage';
import { PAGES } from 'constants/pages';
import { KEK, KeyAttributes, UpdatedKey, User } from 'types/user';
import LinkButton from 'components/pages/gallery/LinkButton';
import { VerticallyCentered } from 'components/Container';
import FormPaper from 'components/Form/FormPaper';
import FormPaperFooter from 'components/Form/FormPaper/Footer';
import FormPaperTitle from 'components/Form/FormPaper/Title';
import ComlinkCryptoWorker from 'utils/comlink/ComlinkCryptoWorker';
import { APPS, getAppName } from 'constants/apps';

export default function ChangePassword() {
    const [token, setToken] = useState<string>();
    const router = useRouter();
    const [user, setUser] = useState<User>();

    useEffect(() => {
        const user = getData(LS_KEYS.USER);
        setUser(user);
        if (!user?.token) {
            router.push(PAGES.ROOT);
        } else {
            setToken(user.token);
        }
    }, []);

    const onSubmit: SetPasswordFormProps['callback'] = async (
        passphrase,
        setFieldError
    ) => {
        const cryptoWorker = await ComlinkCryptoWorker.getInstance();
        const key = await getActualKey();
        const keyAttributes: KeyAttributes = getData(LS_KEYS.KEY_ATTRIBUTES);
        const kekSalt = await cryptoWorker.generateSaltToDeriveKey();
        let kek: KEK;
        try {
            kek = await cryptoWorker.deriveSensitiveKey(passphrase, kekSalt);
        } catch (e) {
            setFieldError('confirm', t('PASSWORD_GENERATION_FAILED'));
            return;
        }
        const encryptedKeyAttributes = await cryptoWorker.encryptToB64(
            key,
            kek.key
        );
        const updatedKey: UpdatedKey = {
            kekSalt,
            encryptedKey: encryptedKeyAttributes.encryptedData,
            keyDecryptionNonce: encryptedKeyAttributes.nonce,
            opsLimit: kek.opsLimit,
            memLimit: kek.memLimit,
        };

        await setKeys(token, updatedKey);

        const updatedKeyAttributes = Object.assign(keyAttributes, updatedKey);
        await generateAndSaveIntermediateKeyAttributes(
            passphrase,
            updatedKeyAttributes,
            key
        );

        await saveKeyInSessionStore(SESSION_KEYS.ENCRYPTION_KEY, key);
        redirectToAppHome();
    };

    const redirectToAppHome = () => {
        setData(LS_KEYS.SHOW_BACK_BUTTON, { value: true });
        const appName = getAppName();
        if (appName === APPS.AUTH) {
            router.push(PAGES.AUTH);
        } else {
            router.push(PAGES.GALLERY);
        }
    };

    return (
        <VerticallyCentered>
            <FormPaper>
                <FormPaperTitle>{t('CHANGE_PASSWORD')}</FormPaperTitle>
                <SetPasswordForm
                    userEmail={user?.email}
                    callback={onSubmit}
                    buttonText={t('CHANGE_PASSWORD')}
                />
                {(getData(LS_KEYS.SHOW_BACK_BUTTON)?.value ?? true) && (
                    <FormPaperFooter>
                        <LinkButton onClick={router.back}>
                            {t('GO_BACK')}
                        </LinkButton>
                    </FormPaperFooter>
                )}
            </FormPaper>
        </VerticallyCentered>
    );
}
