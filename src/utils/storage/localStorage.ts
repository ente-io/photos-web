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
    HIDE_BACK_BUTTON = 'hideBackButton',
    EXPORT = 'export',
    AnonymizedUserID = 'anonymizedUserID',
    THUMBNAIL_FIX_STATE = 'thumbnailFixState',
    LIVE_PHOTO_INFO_SHOWN_COUNT = 'livePhotoInfoShownCount',
    LOGS = 'logs',
    USER_DETAILS = 'userDetails',
    COLLECTION_SORT_BY = 'collectionSortBy',
    THEME = 'theme',
    WAIT_TIME = 'waitTime',
    API_ENDPOINT = 'apiEndpoint',
    LOCALE = 'locale',
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
        if (
            typeof localStorage === 'undefined' ||
            typeof key === 'undefined' ||
            typeof localStorage.getItem(key) === 'undefined' ||
            localStorage.getItem(key) === 'undefined'
        ) {
            return null;
        }
        const data = localStorage.getItem(key);
        return data && JSON.parse(data);
    } catch (e) {
        logError(e, 'Failed to Parse JSON for key ' + key);
    }
};

export const clearData = () => {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    localStorage.clear();
};
