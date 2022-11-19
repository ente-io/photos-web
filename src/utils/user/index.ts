import isElectron from 'is-electron';
import { UserDetails } from 'types/user';
import { getData, setData } from 'utils/storage/localStorage';
import ElectronService from 'services/electron/common';

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

export async function getSentryUserID(): Promise<string> {
    if (isElectron()) {
        return await ElectronService.getSentryUserID();
    } else {
        let anonymizeUserID = getData('AnonymizedUserID')?.id;
        if (!anonymizeUserID) {
            anonymizeUserID = makeID(6);
            setData('AnonymizedUserID', { id: anonymizeUserID });
        }
        return anonymizeUserID;
    }
}

export function getLocalUserDetails(): UserDetails {
    return getData('USER_DETAILS')?.value;
}
