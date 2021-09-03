import { AxiosResponse } from 'axios';
import ErrorWithContext from 'utils/error/errorWithContext';
import constants from 'utils/strings/constants';

export const ServerErrorCodes = {
    SESSION_EXPIRED: '401',
    NO_ACTIVE_SUBSCRIPTION: '402',
    FORBIDDEN: '403',
    STORAGE_LIMIT_EXCEEDED: '426',
    FILE_TOO_LARGE: '413',
};

export enum CustomError {
    UNKNOWN_ERROR = 'unknown error',
    SUBSCRIPTION_VERIFICATION_ERROR = 'Subscription verification failed',
    THUMBNAIL_GENERATION_FAILED = 'thumbnail generation failed',
    VIDEO_PLAYBACK_FAILED = 'video playback failed',
    ETAG_MISSING = 'no header/etag present in response body',
    KEY_MISSING = 'encrypted key missing from localStorage',
    FAILED_TO_LOAD_WEB_WORKER = 'failed to load web worker',
    CHUNK_MORE_THAN_EXPECTED = 'chunks more than expected',
    UNSUPPORTED_FILE_FORMAT = 'unsupported file formats',
    FILE_TOO_LARGE = 'file too large',
    SUBSCRIPTION_EXPIRED = 'subscription expired',
    STORAGE_QUOTA_EXCEEDED = 'storage quota exceeded',
    SESSION_EXPIRED_MESSAGE = 'session expired',
    TYPE_DETECTION_FAILED = 'type detection failed',
    RESPONSE_DATA_MISSING = 'response data missing',
}

function parseUploadError(error: AxiosResponse) {
    let parsedMessage = null;
    if (error?.status) {
        const errorCode = error.status.toString();
        switch (errorCode) {
            case ServerErrorCodes.NO_ACTIVE_SUBSCRIPTION:
                parsedMessage = CustomError.SUBSCRIPTION_EXPIRED;
                break;
            case ServerErrorCodes.STORAGE_LIMIT_EXCEEDED:
                parsedMessage = CustomError.STORAGE_QUOTA_EXCEEDED;
                break;
            case ServerErrorCodes.SESSION_EXPIRED:
                parsedMessage = CustomError.SESSION_EXPIRED_MESSAGE;
                break;
            case ServerErrorCodes.FILE_TOO_LARGE:
                parsedMessage = CustomError.FILE_TOO_LARGE;
                break;
        }
    }
    if (parsedMessage) {
        return new Error(parsedMessage);
    } else {
        return new Error(CustomError.UNKNOWN_ERROR);
    }
}

export function handleUploadError(error: AxiosResponse | Error): Error {
    let parsedError: Error = null;
    if ('status' in error) {
        parsedError = parseUploadError(error);
    } else {
        parsedError = error;
    }
    // breaking errors
    switch (parsedError.message) {
        case CustomError.SUBSCRIPTION_EXPIRED:
        case CustomError.STORAGE_QUOTA_EXCEEDED:
        case CustomError.SESSION_EXPIRED_MESSAGE:
            throw parsedError;
    }
    return parsedError;
}

export function getUserFacingErrorMessage(
    err: CustomError,
    action: () => void
) {
    switch (err) {
        case CustomError.SESSION_EXPIRED_MESSAGE:
            return constants.SESSION_EXPIRED_MESSAGE;
        case CustomError.SUBSCRIPTION_EXPIRED:
            return constants.SUBSCRIPTION_EXPIRED(action);
        case CustomError.STORAGE_QUOTA_EXCEEDED:
            return constants.STORAGE_QUOTA_EXCEEDED(action);
        default:
            return constants.UNKNOWN_ERROR;
    }
}

export function errorWithContext(
    originalError: Error,
    context: string,
    shift = 0
) {
    const errorWithContext = new ErrorWithContext(
        originalError as ErrorWithContext,
        context,
        shift
    );
    return errorWithContext;
}
