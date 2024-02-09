import { setupSentry } from '@ente/shared/sentry/config/sentry.config.base';

const DEFAULT_SENTRY_DSN =
    'https://cbed7333f2810fbbdb692dcd76d8ca1a@sentry.ente.io/2';
setupSentry(DEFAULT_SENTRY_DSN);
