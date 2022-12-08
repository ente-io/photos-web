import { PRODUCTION_ENDPOINTS } from 'constants/endpoint';
import { ENDPOINT } from 'types/endpoint';
import { runningInBrowser } from '../common';

export const getEndpointEnvOverrideKey = (name: ENDPOINT) =>
    `NEXT_PUBLIC_${name}_ENDPOINT`;

export const getEndpoint = (name: ENDPOINT) => {
    if (isProductionApp()) {
        return PRODUCTION_ENDPOINTS[name];
    } else {
        return process.env[getEndpointEnvOverrideKey(name)];
    }
};

export const isProductionEndpoint = (name: ENDPOINT, endpoint: string) =>
    PRODUCTION_ENDPOINTS[name] === endpoint;

export const getDesktopRedirectURL = () =>
    `${getEndpoint('PAYMENTS')}/desktop-redirect`;

const isProductionApp = () => {
    const isProductionApp =
        window.location.origin === PRODUCTION_ENDPOINTS['WEB'] ||
        window.location.origin === PRODUCTION_ENDPOINTS['ALBUMS'];
    if (!runningInBrowser()) {
        return false;
    }
    return isProductionApp;
};

export {
    getPublicCollectionThumbnailURL,
    getPublicCollectionFileURL,
    getFileURL,
    getThumbnailURL,
} from './proxy';
