import { setupSentry } from '@ente/shared/sentry/config/sentry.config.base';

const DEFAULT_SENTRY_DSN =
    'https://0a13fceb0f5542fd82a56f1cfa55e5b3@sentry.ente.io/14';

setupSentry(DEFAULT_SENTRY_DSN);
