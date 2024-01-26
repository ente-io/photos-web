import { setupSentry } from '@ente/shared/sentry/config/sentry.config.base';

const DEFAULT_SENTRY_DSN =
    'https://1a6aff9f51ca99e9e45524253e5457af@sentry.ente.io/2';
setupSentry(DEFAULT_SENTRY_DSN);
