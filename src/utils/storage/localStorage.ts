import { runningInBrowser } from 'utils/common';
import { logError } from 'utils/sentry';

export enum LS_KEYS {
    USER = 'user',
    SESSION = 'session',
    KEY_ATTRIBUTES = 'keyAttributes',
    ORIGINAL_KEY_ATTRIBUTES = 'originalKeyAttributes',
    SUBSCRIPTION = 'subscription',
    FAMILY_DATA = 'familyData',
    PLANS = 'plans',
    IS_FIRST_LOGIN = 'isFirstLogin',
    JUST_SIGNED_UP = 'justSignedUp',
    SHOW_BACK_BUTTON = 'showBackButton',
    EXPORT = 'export',
    AnonymizedUserID = 'anonymizedUserID',
    THUMBNAIL_FIX_STATE = 'thumbnailFixState',
    LIVE_PHOTO_INFO_SHOWN_COUNT = 'livePhotoInfoShownCount',
    LOGS = 'logs',
    USER_DETAILS = 'userDetails',
    COLLECTION_SORT_BY = 'collectionSortBy',
    THEME = 'theme',
}

export const setData = (key: LS_KEYS, value: object) => {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    localStorage.setItem(key, JSON.stringify(value));
};

export const removeData = (key: LS_KEYS) => {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    localStorage.removeItem(key);
};

export const getData = (key: LS_KEYS) => {
    try {
        if (!key) {
            throw Error('Key is undefined');
        }
        if (!runningInBrowser()) {
            // not running in a browser
            return null;
        }
        if (typeof localStorage === 'undefined') {
            throw Error('localStorage is undefined');
        }
        const data = localStorage.getItem(key);
        if (typeof data === 'undefined' || data === null) {
            throw Error('Data is undefined or null');
        }
        try {
            return data && JSON.parse(data);
        } catch (e) {
            logError(e, 'Failed to Parse JSON for key ' + key);
        }
    } catch (e) {
        logError(e, 'Failed to get data for key ' + key);
    }
};

export const clearData = () => {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    localStorage.clear();
};
