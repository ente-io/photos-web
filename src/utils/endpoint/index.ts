import { Endpoint, PRODUCTION_ENDPOINTS } from 'constants/endpoint';
import { runningInBrowser } from '../common';

const getEndpointEnvOverridesKey = (name: Endpoint) =>
    `NEXT_PUBLIC_${name}_ENDPOINT`;

export const getEndpoint = (name: Endpoint) => {
    const endpoint = getEndpointEnvOverridesKey(name);
    if (isProductionApp() || !endpoint) {
        return PRODUCTION_ENDPOINTS[name];
    }
    return endpoint;
};

export const isProductionAPIEndpoint = (apiEndpoint: string) =>
    PRODUCTION_ENDPOINTS['API'] === apiEndpoint;

export const getThumbnailURL = (id: number) => {
    const apiEndpoint = getEndpoint('API');
    if (isProductionAPIEndpoint(apiEndpoint)) {
        return `${PRODUCTION_ENDPOINTS['PROXY_THUMBNAILS_API']}?fileID=${id}`;
    }
    return `${apiEndpoint}/files/preview/${id}`;
};

export const getFileURL = (id: number) => {
    const apiEndpoint = getEndpoint('API');
    if (isProductionAPIEndpoint(apiEndpoint)) {
        return `${PRODUCTION_ENDPOINTS['PROXY_FILES_API']}?fileID=${id}`;
    }
    return `${apiEndpoint}/files/download/${id}`;
};

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
} from './publicAlbums';
