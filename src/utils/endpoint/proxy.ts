import { PRODUCTION_ENDPOINTS } from 'constants/endpoint';
import { PROXY_ENDPOINT } from 'types/endpoint/proxy';
import { getEndpoint, isProductionEndpoint } from '.';

const getProxyEndpoint = (name: PROXY_ENDPOINT) => {
    const apiEndpoint = getEndpoint('API');
    const proxyEndpoint = process.env[name];
    if (isProductionEndpoint('API', apiEndpoint)) {
        return PRODUCTION_ENDPOINTS[name];
    } else if (!proxyEndpoint) {
        return apiEndpoint;
    } else {
        return proxyEndpoint;
    }
};

export const getThumbnailURL = (id: number) => {
    const proxyThumbnailAPIEndpoint = getProxyEndpoint('PROXY_THUMBNAILS_API');
    if (
        isProductionEndpoint('PROXY_THUMBNAILS_API', proxyThumbnailAPIEndpoint)
    ) {
        return `${proxyThumbnailAPIEndpoint}?fileID=${id}`;
    } else {
        return `${proxyThumbnailAPIEndpoint}/files/preview/${id}`;
    }
};

export const getFileURL = (id: number) => {
    const proxyFilesAPIEndpoint = getProxyEndpoint('PROXY_FILES_API');
    if (isProductionEndpoint('PROXY_FILES_API', proxyFilesAPIEndpoint)) {
        return `${proxyFilesAPIEndpoint}?fileID=${id}`;
    } else {
        return `${proxyFilesAPIEndpoint}/files/download/${id}`;
    }
};

export const getPublicCollectionThumbnailURL = (id: number) => {
    const proxyPublicCollectionAPIEndpoint = getEndpoint(
        'PROXY_PUBLIC_ALBUMS_API'
    );
    if (
        isProductionEndpoint(
            'PROXY_UPLOADS_API',
            proxyPublicCollectionAPIEndpoint
        )
    ) {
        return `${proxyPublicCollectionAPIEndpoint}?/preview/fileID=${id}`;
    } else {
        return `${proxyPublicCollectionAPIEndpoint}/files/preview/${id}`;
    }
};

export const getPublicCollectionFileURL = (id: number) => {
    const proxyPublicCollectionAPIEndpoint = getEndpoint(
        'PROXY_PUBLIC_ALBUMS_API'
    );
    if (
        isProductionEndpoint(
            'PROXY_UPLOADS_API',
            proxyPublicCollectionAPIEndpoint
        )
    ) {
        return `${proxyPublicCollectionAPIEndpoint}?/download/fileID=${id}`;
    } else {
        return `${proxyPublicCollectionAPIEndpoint}/files/download/${id}`;
    }
};
