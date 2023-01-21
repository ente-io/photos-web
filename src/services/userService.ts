import { PAGES } from 'constants/pages';
import { getEndpoint, getFamilyPortalURL } from 'utils/common/apiUtil';
import { clearKeys } from 'utils/storage/sessionStorage';
import router from 'next/router';
import {
    clearData,
    getData,
    LS_KEYS,
    setData,
} from 'utils/storage/localStorage';
import localForage from 'utils/storage/localForage';
import { getToken } from 'utils/common/key';
import HTTPService from './HTTPService';
import { getRecoveryKey } from 'utils/crypto';
import { logError } from 'utils/sentry';
import {
    KeyAttributes,
    UpdatedKey,
    RecoveryKey,
    TwoFactorSecret,
    TwoFactorVerificationResponse,
    TwoFactorRecoveryResponse,
    UserDetails,
    UserPreferences,
    EncryptedUserPreferences,
    DeleteChallengeResponse,
} from 'types/user';
import { getLocalFamilyData, isPartOfFamily } from 'utils/billing';
import { ServerErrorCodes } from 'utils/error';
import { decryptUserPreferences, encryptUserPreferences } from 'utils/user';
import isElectron from 'is-electron';
import safeStorageService from './electron/safeStorage';
import { deleteThumbnailCache } from './cacheService';
import { B64EncryptionResult } from 'types/crypto';

const ENDPOINT = getEndpoint();

const HAS_SET_KEYS = 'hasSetKeys';

export const sendOtt = (email: string) =>
    HTTPService.post(`${ENDPOINT}/users/ott`, {
        email,
        client: 'web',
    });
export const getPublicKey = async (email: string) => {
    const token = getToken();

    const resp = await HTTPService.get(
        `${ENDPOINT}/users/public-key`,
        { email },
        {
            'X-Auth-Token': token,
        }
    );
    return resp.data.publicKey;
};

export const getPaymentToken = async () => {
    const token = getToken();

    const resp = await HTTPService.get(
        `${ENDPOINT}/users/payment-token`,
        null,
        {
            'X-Auth-Token': token,
        }
    );
    return resp.data['paymentToken'];
};

export const getFamiliesToken = async () => {
    try {
        const token = getToken();

        const resp = await HTTPService.get(
            `${ENDPOINT}/users/families-token`,
            null,
            {
                'X-Auth-Token': token,
            }
        );
        return resp.data['familiesToken'];
    } catch (e) {
        logError(e, 'failed to get family token');
        throw e;
    }
};

export const getRoadmapRedirectURL = async () => {
    try {
        const token = getToken();

        const resp = await HTTPService.get(
            `${ENDPOINT}/users/roadmap/v2`,
            null,
            {
                'X-Auth-Token': token,
            }
        );
        return resp.data['url'];
    } catch (e) {
        logError(e, 'failed to get roadmap url');
        throw e;
    }
};

export const verifyOtt = (email: string, ott: string) =>
    HTTPService.post(`${ENDPOINT}/users/verify-email`, { email, ott });

export const putAttributes = (token: string, keyAttributes: KeyAttributes) =>
    HTTPService.put(`${ENDPOINT}/users/attributes`, { keyAttributes }, null, {
        'X-Auth-Token': token,
    });

export const setKeys = (token: string, updatedKey: UpdatedKey) =>
    HTTPService.put(`${ENDPOINT}/users/keys`, updatedKey, null, {
        'X-Auth-Token': token,
    });

export const setRecoveryKey = (token: string, recoveryKey: RecoveryKey) =>
    HTTPService.put(`${ENDPOINT}/users/recovery-key`, recoveryKey, null, {
        'X-Auth-Token': token,
    });

export const logoutUser = async () => {
    try {
        // ignore server logout result as logoutUser can be triggered before sign up or on token expiry
        await _logout();
        clearKeys();
        clearData();
        try {
            await deleteThumbnailCache();
        } catch (e) {
            // ignore
        }
        await clearFiles();
        if (isElectron()) {
            safeStorageService.clearElectronStore();
        }
        router.push(PAGES.ROOT);
    } catch (e) {
        logError(e, 'logoutUser failed');
    }
};

export const clearFiles = async () => {
    await localForage.clear();
};

export const isTokenValid = async () => {
    try {
        if (!getToken()) {
            return false;
        }
        const resp = await HTTPService.get(
            `${ENDPOINT}/users/session-validity/v2`,
            null,
            {
                'X-Auth-Token': getToken(),
            }
        );
        try {
            if (resp.data[HAS_SET_KEYS] === undefined) {
                throw Error('resp.data.hasSetKey undefined');
            }
            if (!resp.data['hasSetKeys']) {
                try {
                    await putAttributes(
                        getToken(),
                        getData(LS_KEYS.ORIGINAL_KEY_ATTRIBUTES)
                    );
                } catch (e) {
                    logError(e, 'put attribute failed');
                }
            }
        } catch (e) {
            logError(e, 'hasSetKeys not set in session validity response');
        }
        return true;
    } catch (e) {
        logError(e, 'session-validity api call failed');
        if (e.status?.toString() === ServerErrorCodes.SESSION_EXPIRED) {
            return false;
        } else {
            return true;
        }
    }
};

export const setupTwoFactor = async () => {
    const resp = await HTTPService.post(
        `${ENDPOINT}/users/two-factor/setup`,
        null,
        null,
        {
            'X-Auth-Token': getToken(),
        }
    );
    return resp.data as TwoFactorSecret;
};

export const enableTwoFactor = async (
    code: string,
    recoveryEncryptedTwoFactorSecret: B64EncryptionResult
) => {
    await HTTPService.post(
        `${ENDPOINT}/users/two-factor/enable`,
        {
            code,
            encryptedTwoFactorSecret:
                recoveryEncryptedTwoFactorSecret.encryptedData,
            twoFactorSecretDecryptionNonce:
                recoveryEncryptedTwoFactorSecret.nonce,
        },
        null,
        {
            'X-Auth-Token': getToken(),
        }
    );
};

export const verifyTwoFactor = async (code: string, sessionID: string) => {
    const resp = await HTTPService.post(
        `${ENDPOINT}/users/two-factor/verify`,
        {
            code,
            sessionID,
        },
        null
    );
    return resp.data as TwoFactorVerificationResponse;
};

export const recoverTwoFactor = async (sessionID: string) => {
    const resp = await HTTPService.get(`${ENDPOINT}/users/two-factor/recover`, {
        sessionID,
    });
    return resp.data as TwoFactorRecoveryResponse;
};

export const removeTwoFactor = async (sessionID: string, secret: string) => {
    const resp = await HTTPService.post(`${ENDPOINT}/users/two-factor/remove`, {
        sessionID,
        secret,
    });
    return resp.data as TwoFactorVerificationResponse;
};

export const disableTwoFactor = async () => {
    await HTTPService.post(`${ENDPOINT}/users/two-factor/disable`, null, null, {
        'X-Auth-Token': getToken(),
    });
};

export const getTwoFactorStatus = async () => {
    const resp = await HTTPService.get(
        `${ENDPOINT}/users/two-factor/status`,
        null,
        {
            'X-Auth-Token': getToken(),
        }
    );
    return resp.data['status'];
};

export const _logout = async () => {
    if (!getToken()) return true;
    try {
        await HTTPService.post(`${ENDPOINT}/users/logout`, null, null, {
            'X-Auth-Token': getToken(),
        });
        return true;
    } catch (e) {
        logError(e, '/users/logout failed');
        return false;
    }
};

export const sendOTTForEmailChange = async (email: string) => {
    if (!getToken()) {
        return null;
    }
    await HTTPService.post(`${ENDPOINT}/users/ott`, {
        email,
        client: 'web',
        purpose: 'change',
    });
};

export const changeEmail = async (email: string, ott: string) => {
    if (!getToken()) {
        return null;
    }
    await HTTPService.post(
        `${ENDPOINT}/users/change-email`,
        {
            email,
            ott,
        },
        null,
        {
            'X-Auth-Token': getToken(),
        }
    );
};

export const getUserDetailsV2 = async (): Promise<UserDetails> => {
    try {
        const token = getToken();

        const resp = await HTTPService.get(
            `${ENDPOINT}/users/details/v2`,
            null,
            {
                'X-Auth-Token': token,
            }
        );
        return resp.data;
    } catch (e) {
        logError(e, 'failed to get user details v2');
        throw e;
    }
};

export const getFamilyPortalRedirectURL = async () => {
    try {
        const jwtToken = await getFamiliesToken();
        const isFamilyCreated = isPartOfFamily(getLocalFamilyData());
        return `${getFamilyPortalURL()}?token=${jwtToken}&isFamilyCreated=${isFamilyCreated}&redirectURL=${
            window.location.origin
        }/gallery`;
    } catch (e) {
        logError(e, 'unable to generate to family portal URL');
        throw e;
    }
};

export const getAccountDeleteChallenge = async () => {
    try {
        const token = getToken();

        const resp = await HTTPService.get(
            `${ENDPOINT}/users/delete-challenge`,
            null,
            {
                'X-Auth-Token': token,
            }
        );
        return resp.data as DeleteChallengeResponse;
    } catch (e) {
        logError(e, 'failed to get account delete challenge');
        throw e;
    }
};

export const deleteAccount = async (challenge: string) => {
    try {
        const token = getToken();
        if (!token) {
            return;
        }

        await HTTPService.delete(
            `${ENDPOINT}/users/delete`,
            { challenge },
            null,
            {
                'X-Auth-Token': token,
            }
        );
    } catch (e) {
        logError(e, 'deleteAccount api call failed');
        throw e;
    }
};

const getUserPreferences = async (): Promise<UserPreferences> => {
    try {
        const token = getToken();

        const resp = await HTTPService.get(
            `${ENDPOINT}/users/preferences`,
            null,
            {
                'X-Auth-Token': token,
            }
        );

        const encryptedUserPreferences = resp.data
            .userPreferences as EncryptedUserPreferences;
        const decryptedUserPreferences = await decryptUserPreferences(
            encryptedUserPreferences
        );
        return decryptedUserPreferences;
    } catch (e) {
        logError(e, 'failed to get user preferences');
        throw e;
    }
};

export const syncUserPreferences = async () => {
    try {
        const updatedUserPreference = await getUserPreferences();
        setData(LS_KEYS.USER_PREFERENCES, updatedUserPreference);
    } catch (e) {
        logError(e, 'failed to update local user preferences');
    }
};

export const updateUserPreferences = async (
    preferences: UserPreferences
): Promise<void> => {
    try {
        const encryptedUserPreferences = await encryptUserPreferences(
            preferences
        );

        const token = getToken();

        await HTTPService.put(
            `${ENDPOINT}/users/preferences`,
            {
                userPreferences: encryptedUserPreferences,
            },

            null,
            {
                'X-Auth-Token': token,
            }
        );
        preferences.version += 1;
        setData(LS_KEYS.USER_PREFERENCES, preferences);
    } catch (e) {
        logError(e, 'failed to update user preferences');
        throw e;
    }
};

export const validateKey = async () => {
    try {
        await getRecoveryKey();
        return true;
    } catch (e) {
        await logoutUser();
        return false;
    }
};
