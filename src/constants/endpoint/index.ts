export type Endpoint =
    | 'API'
    | 'PAYMENTS'
    | 'WEB'
    | 'ALBUMS'
    | 'PROXY_FILES_API'
    | 'PROXY_THUMBNAILS_API'
    | 'PROXY_PUBLIC_ALBUMS_API'
    | 'SENTRY_REPORTER_TUNNEL';

export const PRODUCTION_ENDPOINTS: Record<Endpoint, string> = {
    API: 'https://api.ente.io',
    WEB: 'https://web.ente.io',
    PAYMENTS: 'https://payments.ente.io',
    ALBUMS: 'https://albums.ente.io',
    PROXY_FILES_API: 'https://files.ente.io',
    PROXY_THUMBNAILS_API: 'https://thumbnails.ente.io',
    PROXY_PUBLIC_ALBUMS_API: 'https://public-albums.ente.io',
    SENTRY_REPORTER_TUNNEL: 'https://sentry-reporter.ente.io',
};
