import { FIX_STATE } from 'components/FixLargeThumbnail';
import { COLLECTION_SORT_BY } from 'constants/collection';
import { Plan, Subscription } from 'types/billing';
import { FamilyData, KeyAttributes, User, UserDetails } from 'types/user';
import { Log } from 'utils/logging';
import { logError } from 'utils/sentry';

enum LS_KEYS {
    USER = 'user',
    PRE_LOGIN_USER = 'preLoginUser',
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
}

interface LSEntries {
    PRE_LOGIN_USER: Partial<User>;
    USER: User;
    KEY_ATTRIBUTES: KeyAttributes;
    ORIGINAL_KEY_ATTRIBUTES: KeyAttributes;
    SUBSCRIPTION: Subscription;
    FAMILY_DATA: FamilyData;
    PLANS: Plan[];
    IS_FIRST_LOGIN: { status: boolean };
    JUST_SIGNED_UP: { status: boolean };
    SHOW_BACK_BUTTON: { value: boolean };
    EXPORT: { folder: string };
    AnonymizedUserID: { id: string };
    THUMBNAIL_FIX_STATE: { state: FIX_STATE };
    LIVE_PHOTO_INFO_SHOWN_COUNT: { count: number };
    LOGS: { logs: Log[] };
    USER_DETAILS: { value: UserDetails };
    COLLECTION_SORT_BY: { value: COLLECTION_SORT_BY };
}

export const setData = <Entry extends keyof LSEntries>(
    entry: Entry,
    value: LSEntries[Entry]
): void => {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    localStorage.setItem(LS_KEYS[entry], JSON.stringify(value));
};

export const removeData = (entry: keyof LSEntries): void => {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    localStorage.removeItem(LS_KEYS[entry]);
};

export const getData = <Entry extends keyof LSEntries>(
    entry: Entry
): LSEntries[Entry] => {
    try {
        // if not running in browser return undefined
        if (localStorage === undefined) {
            return undefined;
        }
        const key = LS_KEYS[entry];
        if (typeof key === 'undefined') {
            return undefined;
        }

        const data = localStorage.getItem(key);
        // a previous bug had set value as "undefined" instead of calling clear
        if (!data || data === 'undefined') {
            return undefined;
        }
        return JSON.parse(data) as LSEntries[Entry];
    } catch (e) {
        logError(e, 'Failed to Parse JSON for key ' + entry);
    }
};

export const clearData = () => {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    localStorage.clear();
};
