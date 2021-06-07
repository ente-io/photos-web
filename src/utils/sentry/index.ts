import * as Sentry from '@sentry/browser';

export const logError = (e: any, msg?: string) => {
    Sentry.captureException(e, {
        level: Sentry.Severity.Info,
        contexts: {
            context: {
                message: msg,
            },
        },
    });
};
