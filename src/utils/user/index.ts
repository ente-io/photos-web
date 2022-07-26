import {
    EncryptedUserPreferences,
    UserDetails,
    UserPreferences,
} from 'types/user';
import { getActualKey } from 'utils/common/key';
import CryptoWorker from 'utils/crypto';
import { getData, LS_KEYS } from 'utils/storage/localStorage';

export function getLocalUserDetails(): UserDetails {
    return getData(LS_KEYS.USER_DETAILS)?.value;
}

export function getLocalUserPreferences(): UserPreferences {
    return getData(LS_KEYS.USER_PREFERENCES);
}

const newDefaultUserPreferences = (): UserPreferences => {
    return {
        version: 0,
        data: {
            isImgTranscodingEnabled: false,
            isVidTranscodingEnabled: false,
        },
        header: '',
    };
};

export const decryptUserPreferences = async (
    encryptedUserPreferences: EncryptedUserPreferences
): Promise<UserPreferences> => {
    if (!encryptedUserPreferences?.version) {
        return newDefaultUserPreferences();
    }
    const worker = await new CryptoWorker();
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
    const worker = await new CryptoWorker();
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
