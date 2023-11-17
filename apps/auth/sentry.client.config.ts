import { setupSentry } from '@ente/shared/sentry/config/sentry.config.base';

const DEFAULT_SENTRY_DSN =
    'https://7dafb39a7cb442b4a6baaa2e69a1fe02@sentry.ente.io/13';

setupSentry(DEFAULT_SENTRY_DSN);
