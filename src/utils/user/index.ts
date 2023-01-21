import {
    EncryptedUserPreferences,
    UserDetails,
    UserPreferences,
} from 'types/user';
import { getActualKey } from 'utils/common/key';
import { getData, LS_KEYS } from 'utils/storage/localStorage';
import ComlinkCryptoWorker from 'utils/comlink/ComlinkCryptoWorker';
import { DEFAULT_USER_PREFERENCES } from 'constants/user';

export function getLocalUserDetails(): UserDetails {
    return getData(LS_KEYS.USER_DETAILS)?.value;
}

export function getLocalUserPreferences(): UserPreferences {
    return getData(LS_KEYS.USER_PREFERENCES);
}

export const decryptUserPreferences = async (
    encryptedUserPreferences: EncryptedUserPreferences
): Promise<UserPreferences> => {
    if (!encryptedUserPreferences?.version) {
        return DEFAULT_USER_PREFERENCES;
    }
    const worker = await ComlinkCryptoWorker.getInstance();
    const masterKey = await getActualKey();
    const data: UserPreferences['data'] = await worker.decryptMetadata(
        encryptedUserPreferences.data,
        encryptedUserPreferences.header,
        masterKey
    );
    return {
        version: encryptedUserPreferences.version,
        data,
        header: encryptedUserPreferences.header,
    };
};

export const encryptUserPreferences = async (
    userPreferences: UserPreferences
): Promise<EncryptedUserPreferences> => {
    const worker = await ComlinkCryptoWorker.getInstance();
    const masterKey = await getActualKey();
    const { file: encryptedUserPreferencesData } = await worker.encryptMetadata(
        userPreferences.data,
        masterKey
    );
    return {
        version: userPreferences.version ?? 0,
        data: encryptedUserPreferencesData.encryptedData as string,
        header: encryptedUserPreferencesData.decryptionHeader,
    };
};

export const isInternalUser = () => {
    const userEmail = getData(LS_KEYS.USER)?.email;

    return (
        userEmail.endsWith('@ente.io') || userEmail === 'kr.anand619@gmail.com'
    );
};
