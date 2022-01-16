import React, { useState, useEffect, useContext } from 'react';
import constants from 'utils/strings/constants';
import { getData, LS_KEYS, setData } from 'utils/storage/localStorage';
import { useRouter } from 'next/router';
import CryptoWorker, {
    SaveKeyInSessionStore,
    generateAndSaveIntermediateKeyAttributes,
    B64EncryptionResult,
} from 'utils/crypto';
import { getActualKey } from 'utils/common/key';
import { setKeys } from 'services/userService';
import SetPasswordForm from 'components/SetPasswordForm';
import { AppContext } from 'pages/_app';
import { SESSION_KEYS } from 'utils/storage/sessionStorage';
import { PAGES } from 'constants/pages';
import { KEK, UpdatedKey } from 'types/user';

export default function Generate() {
    const [token, setToken] = useState<string>();
    const router = useRouter();
    const appContext = useContext(AppContext);

    useEffect(() => {
        const user = getData(LS_KEYS.USER);
        if (!user?.token) {
            router.push(PAGES.ROOT);
        } else {
            setToken(user.token);
        }
        appContext.showNavBar(true);
    }, []);

    const onSubmit = async (passphrase, setFieldError) => {
        const cryptoWorker = await new CryptoWorker();
        const key: string = await getActualKey();
        const keyAttributes = getData(LS_KEYS.KEY_ATTRIBUTES);
        const kekSalt: string = await cryptoWorker.generateSaltToDeriveKey();
        let kek: KEK;
        try {
            kek = await cryptoWorker.deriveSensitiveKey(passphrase, kekSalt);
        } catch (e) {
            setFieldError('confirm', constants.PASSWORD_GENERATION_FAILED);
            return;
        }
        const encryptedKeyAttributes: B64EncryptionResult =
            await cryptoWorker.encryptToB64(key, kek.key);
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

        await SaveKeyInSessionStore(SESSION_KEYS.ENCRYPTION_KEY, key);
        redirectToGallery();
    };
    const redirectToGallery = () => {
        setData(LS_KEYS.SHOW_BACK_BUTTON, { value: true });
        router.push(PAGES.GALLERY);
    };
    return (
        <SetPasswordForm
            callback={onSubmit}
            buttonText={constants.CHANGE_PASSWORD}
            back={
                getData(LS_KEYS.SHOW_BACK_BUTTON)?.value
                    ? redirectToGallery
                    : null
            }
        />
    );
}
