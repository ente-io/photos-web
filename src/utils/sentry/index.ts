import * as Sentry from '@sentry/nextjs';
import { getUserAnonymizedID } from 'utils/user';

export const logError = (
    error: any,
    msg: string,
    info?: Record<string, unknown>
) => {
    const err = errorWithContext(error, msg);
    if (!process.env.NEXT_PUBLIC_SENTRY_ENV) {
        console.log(error, { msg, info });
    }
    Sentry.captureException(err, {
        level: Sentry.Severity.Info,
        user: { id: getUserAnonymizedID() },
        contexts: {
            ...(info && {
                info: info,
            }),
            rootCause: { message: error?.message, completeError: error },
        },
    });
};

// copy of errorWithContext to prevent importing error util
function errorWithContext(originalError: Error, context: string) {
    const errorWithContext = new Error(context);
    errorWithContext.stack =
        errorWithContext.stack.split('\n').slice(2, 4).join('\n') +
        '\n' +
        originalError.stack;
    return errorWithContext;
}
