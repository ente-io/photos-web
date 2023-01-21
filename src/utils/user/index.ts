import {
    EncryptedUserPreferences,
    UserDetails,
    UserPreferences,
} from 'types/user';
import { getActualKey } from 'utils/common/key';
import isElectron from 'is-electron';
import { getData, LS_KEYS, setData } from 'utils/storage/localStorage';
import ElectronService from 'services/electron/common';
import ComlinkCryptoWorker from 'utils/comlink/ComlinkCryptoWorker';

export function makeID(length) {
    let result = '';
    const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
    }
    return result;
}

export async function getSentryUserID() {
    if (isElectron()) {
        return await ElectronService.getSentryUserID();
    } else {
        let anonymizeUserID = getData(LS_KEYS.AnonymizedUserID)?.id;
        if (!anonymizeUserID) {
            anonymizeUserID = makeID(6);
            setData(LS_KEYS.AnonymizedUserID, { id: anonymizeUserID });
        }
        return anonymizeUserID;
    }
}

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
