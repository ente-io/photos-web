import { ENDPOINT } from 'types/endpoint';

export const PRODUCTION_ENDPOINTS: Record<ENDPOINT, string> = {
    API: 'https://api.ente.io',
    WEB: 'https://web.ente.io',
    PAYMENTS: 'https://payments.ente.io',
    ALBUMS: 'https://albums.ente.io',
    FAMILY: 'https://family.ente.io',
    PROXY_FILES_API: 'https://files.ente.io',
    PROXY_THUMBNAILS_API: 'https://thumbnails.ente.io',
    PROXY_PUBLIC_ALBUMS_API: 'https://public-albums.ente.io',
    PROXY_UPLOADS_API: 'https://uploader.ente.io',
    SENTRY_REPORTER_TUNNEL: 'https://sentry-reporter.ente.io',
};
