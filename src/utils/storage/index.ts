import { getData, LS_KEYS, setData } from './localStorage';

export interface Log {
    type: string;
    timestamp: number;
    logLine: string;
}

const MAX_LOG_LINES = 1000;

export const isFirstLogin = () =>
    getData(LS_KEYS.IS_FIRST_LOGIN)?.status ?? false;

export function setIsFirstLogin(status) {
    setData(LS_KEYS.IS_FIRST_LOGIN, { status });
}

export const justSignedUp = () =>
    getData(LS_KEYS.JUST_SIGNED_UP)?.status ?? false;

export function setJustSignedUp(status) {
    setData(LS_KEYS.JUST_SIGNED_UP, { status });
}

export function getLivePhotoInfoShownCount() {
    return getData(LS_KEYS.LIVE_PHOTO_INFO_SHOWN_COUNT)?.count ?? 0;
}

export function setLivePhotoInfoShownCount(count) {
    setData(LS_KEYS.LIVE_PHOTO_INFO_SHOWN_COUNT, { count });
}

export function saveLogLine(log: Log) {
    setData(LS_KEYS.LOGS, {
        logs: [...getLogs(), log].slice(-1 * MAX_LOG_LINES),
    });
}

export function getLogs(): Log[] {
    return getData(LS_KEYS.LOGS)?.logs ?? [];
}
