import { runningInBrowser } from '.';

export const getEndpoint = () => {
    if (isDevURL() && process.env.NEXT_PUBLIC_ENTE_ENDPOINT !== undefined) {
        return process.env.NEXT_PUBLIC_ENTE_ENDPOINT;
    }
    return 'https://api.ente.io';
};

export const getFileURL = (id: number) => {
    const endpoint = getEndpoint();
    if (!isProdEndpoint(endpoint)) {
        return `${endpoint}/files/download/${id}`;
    }
    return `https://files.ente.io/?fileID=${id}`;
};

export const getPublicCollectionFileURL = (id: number) => {
    const endpoint = getEndpoint();
    if (!isProdEndpoint(endpoint)) {
        return `${endpoint}/public-collection/files/download/${id}`;
    }
    return `https://public-albums.ente.io/download/?fileID=${id}`;
};

export const getThumbnailURL = (id: number) => {
    const endpoint = getEndpoint();
    if (!isProdEndpoint(endpoint)) {
        return `${endpoint}/files/preview/${id}`;
    }
    return `https://thumbnails.ente.io/?fileID=${id}`;
};

export const getPublicCollectionThumbnailURL = (id: number) => {
    const endpoint = getEndpoint();
    if (!isProdEndpoint(endpoint)) {
        return `${endpoint}/public-collection/files/preview/${id}`;
    }
    return `https://public-albums.ente.io/preview/?fileID=${id}`;
};

export const getSentryTunnelURL = () => {
    return `https://sentry-reporter.ente.io`;
};

export const getPaymentsURL = () => {
    if (
        isDevURL() &&
        process.env.NEXT_PUBLIC_ENTE_ALBUM_ENDPOINT !== undefined
    ) {
        return process.env.NEXT_PUBLIC_ENTE_ALBUM_ENDPOINT;
    }
    return 'https://payments.ente.io';
};

// getFamilyPortalURL returns the endpoint for the family dashboard which can be used to
// create or manage family.
export const getFamilyPortalURL = () => {
    if (
        isDevURL() &&
        process.env.NEXT_PUBLIC_ENTE_FAMILY_PORTAL_ENDPOINT !== undefined
    ) {
        return process.env.NEXT_PUBLIC_ENTE_FAMILY_PORTAL_ENDPOINT;
    }
    return 'https://family.ente.io';
};

export const getUploadEndpoint = () => {
    if (
        isDevURL() &&
        process.env.NEXT_PUBLIC_ENTE_UPLOAD_ENDPOINT !== undefined
    ) {
        return process.env.NEXT_PUBLIC_ENTE_UPLOAD_ENDPOINT;
    }
    return 'https://uploader.ente.io';
};

export const getAlbumsURL = () => {
    if (
        isDevURL() &&
        process.env.NEXT_PUBLIC_ENTE_ALBUM_ENDPOINT !== undefined
    ) {
        return process.env.NEXT_PUBLIC_ENTE_ALBUM_ENDPOINT;
    }
    return 'https://albums.ente.io';
};

const isDevURL = () => {
    let isDevDeployment = false;
    if (runningInBrowser()) {
        isDevDeployment =
            process.env.NODE_ENV === 'development' ||
            window.location.origin ===
                process.env.NEXT_PUBLIC_ENTE_DEV_APP_1_ENDPOINT ||
            window.location.origin ===
                process.env.NEXT_PUBLIC_ENTE_DEV_APP_2_ENDPOINT;
    }
    return isDevDeployment;
};

const isProdEndpoint = (endpoint: string) => endpoint !== 'https://api.ente.io';
