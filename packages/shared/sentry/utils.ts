import ElectronAPIs from '@ente/shared/electron';
import {
    getLocalSentryUserID,
    setLocalSentryUserID,
} from '@ente/shared/storage/localStorage/helpers';
import isElectron from 'is-electron';
import { getAppEnv } from '@ente/shared/apps/env';
import { APP_ENV } from '@ente/shared/apps/constants';
import { isEnableSentryFlagSet } from '@ente/shared/apps/env';

export async function getSentryUserID() {
    if (isElectron()) {
        return await ElectronAPIs.getSentryUserID();
    } else {
        let anonymizeUserID = getLocalSentryUserID();
        if (!anonymizeUserID) {
            anonymizeUserID = makeID(6);
            setLocalSentryUserID(anonymizeUserID);
        }
        return anonymizeUserID;
    }
}

function makeID(length) {
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

export function isErrorUnnecessaryForSentry(error: any) {
    if (error?.message?.includes('Network Error')) {
        return true;
    } else if (error?.status === 401) {
        return true;
    }
    return false;
}

export const getIsSentryEnabled = () => {
    const isAppENVDevelopment = getAppEnv() === APP_ENV.DEVELOPMENT;
    const isSentryEnabled = isEnableSentryFlagSet();
    return !isAppENVDevelopment || isSentryEnabled;
};
