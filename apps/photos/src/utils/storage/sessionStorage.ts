export enum SESSION_KEYS {
    ENCRYPTION_KEY = 'encryptionKey',
    KEY_ENCRYPTION_KEY = 'keyEncryptionKey',
}

export const setKey = (key: SESSION_KEYS, value: object) => {
    if (typeof sessionStorage === 'undefined') {
        return null;
    }
    sessionStorage.setItem(key, JSON.stringify(value));
};

export const getKey = (key: SESSION_KEYS) => {
    if (typeof sessionStorage === 'undefined') {
        return null;
    }
    return JSON.parse(sessionStorage.getItem(key));
};

export const removeKey = (key: SESSION_KEYS) => {
    if (typeof sessionStorage === 'undefined') {
        return null;
    }
    sessionStorage.removeItem(key);
};

export const clearKeys = () => {
    if (typeof sessionStorage === 'undefined') {
        return null;
    }
    sessionStorage.clear();
};
