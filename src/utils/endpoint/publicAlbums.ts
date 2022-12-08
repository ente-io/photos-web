import { PRODUCTION_ENDPOINTS } from 'constants/endpoint';
import { getEndpoint, isProductionAPIEndpoint } from '.';

export const getPublicCollectionThumbnailURL = (id: number) => {
    const apiEndpoint = getEndpoint('API');
    if (isProductionAPIEndpoint(apiEndpoint)) {
        return `${PRODUCTION_ENDPOINTS['PROXY_PUBLIC_ALBUMS_API']}/preview?fileID=${id}`;
    }
    return `${apiEndpoint}/public-albums/files/preview/${id}`;
};

export const getPublicCollectionFileURL = (id: number) => {
    const apiEndpoint = getEndpoint('API');
    if (isProductionAPIEndpoint(apiEndpoint)) {
        return `${PRODUCTION_ENDPOINTS['PROXY_PUBLIC_ALBUMS_API']}/download?fileID=${id}`;
    }
    return `${apiEndpoint}/public-albums/files/download/${id}`;
};
