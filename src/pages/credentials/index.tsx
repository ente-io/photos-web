import React, { useContext, useEffect, useState } from 'react';

import constants from 'utils/strings/constants';
import { clearData, getData, LS_KEYS } from 'utils/storage/localStorage';
import { useRouter } from 'next/router';
import { PAGES } from 'constants/pages';
import { SESSION_KEYS, getKey } from 'utils/storage/sessionStorage';
import CryptoWorker, {
    decryptAndStoreToken,
    generateAndSaveIntermediateKeyAttributes,
    SaveKeyInSessionStore,
} from 'utils/crypto';
import { logoutUser } from 'services/userService';
import { isFirstLogin } from 'utils/storage';
import SingleInputForm from 'components/SingleInputForm';
import Container from 'components/Container';
import { Button, Card } from 'react-bootstrap';
import { AppContext } from 'pages/_app';
import LogoImg from 'components/LogoImg';
import { logError } from 'utils/sentry';
import { KeyAttributes } from 'types/user';

export default function Credentials() {
    const router = useRouter();
    const [keyAttributes, setKeyAttributes] = useState<KeyAttributes>();
    const appContext = useContext(AppContext);

    useEffect(() => {
        router.prefetch(PAGES.GALLERY);
        const user = getData(LS_KEYS.USER);
        const keyAttributes = getData(LS_KEYS.KEY_ATTRIBUTES);
        const key = getKey(SESSION_KEYS.ENCRYPTION_KEY);
        if (
            (!user?.token && !user?.encryptedToken) ||
            (keyAttributes && !keyAttributes.memLimit)
        ) {
            clearData();
            router.push(PAGES.ROOT);
        } else if (!keyAttributes) {
            router.push(PAGES.GENERATE);
        } else if (key) {
            router.push(PAGES.GALLERY);
        } else {
            setKeyAttributes(keyAttributes);
        }
        appContext.showNavBar(false);
    }, []);

    const verifyPassphrase = async (passphrase, setFieldError) => {
        try {
            const cryptoWorker = await new CryptoWorker();
            let kek: string = null;
            try {
                kek = await cryptoWorker.deriveKey(
                    passphrase,
                    keyAttributes.kekSalt,
                    keyAttributes.opsLimit,
                    keyAttributes.memLimit
                );
            } catch (e) {
                logError(e, 'failed to derive key');
                throw e;
            }
            try {
                const key: string = await cryptoWorker.decryptB64(
                    keyAttributes.encryptedKey,
                    keyAttributes.keyDecryptionNonce,
                    kek
                );
                if (isFirstLogin()) {
                    await generateAndSaveIntermediateKeyAttributes(
                        passphrase,
                        keyAttributes,
                        key
                    );
                }
                await SaveKeyInSessionStore(SESSION_KEYS.ENCRYPTION_KEY, key);
                await decryptAndStoreToken(key);
                const redirectUrl = appContext.redirectUrl;
                appContext.setRedirectUrl(null);
                router.push(redirectUrl ?? PAGES.GALLERY);
            } catch (e) {
                logError(e, 'user entered a wrong password');
                setFieldError('passphrase', constants.INCORRECT_PASSPHRASE);
            }
        } catch (e) {
            setFieldError(
                'passphrase',
                `${constants.UNKNOWN_ERROR} ${e.message}`
            );
        }
    };

    return (
        <>
            <Container>
                <Card style={{ minWidth: '320px' }} className="text-center">
                    <Card.Body style={{ padding: '40px 30px' }}>
                        <Card.Title style={{ marginBottom: '32px' }}>
                            <LogoImg src="/icon.svg" />
                            {constants.PASSWORD}
                        </Card.Title>
                        <SingleInputForm
                            callback={verifyPassphrase}
                            placeholder={constants.RETURN_PASSPHRASE_HINT}
                            buttonText={constants.VERIFY_PASSPHRASE}
                            fieldType="password"
                        />
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                marginTop: '12px',
                            }}>
                            <Button
                                variant="link"
                                onClick={() => router.push(PAGES.RECOVER)}>
                                {constants.FORGOT_PASSWORD}
                            </Button>
                            <Button variant="link" onClick={logoutUser}>
                                {constants.GO_BACK}
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
}
