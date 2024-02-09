import { setupSentry } from '@ente/shared/sentry/config/sentry.config.base';

const DEFAULT_SENTRY_DSN =
    'https://ad075e4713480307bb8bc0811547c65e@sentry.ente.io/8';

setupSentry(DEFAULT_SENTRY_DSN);
