import { setupSentry } from '@ente/shared/sentry/config/sentry.config.base';

const DEFAULT_SENTRY_DSN =
    'https://6061cb842359ec43be9def9f63a5a2f5@sentry.ente.io/10';

setupSentry(DEFAULT_SENTRY_DSN);
