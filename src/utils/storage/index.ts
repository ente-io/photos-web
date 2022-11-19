import { getData, setData } from './localStorage';

export const isFirstLogin = () => getData('IS_FIRST_LOGIN')?.status ?? false;

export function setIsFirstLogin(status) {
    setData('IS_FIRST_LOGIN', { status });
}

export const justSignedUp = () => getData('JUST_SIGNED_UP')?.status ?? false;

export function setJustSignedUp(status) {
    setData('JUST_SIGNED_UP', { status });
}

export function getLivePhotoInfoShownCount() {
    return getData('LIVE_PHOTO_INFO_SHOWN_COUNT')?.count ?? 0;
}

export function setLivePhotoInfoShownCount(count) {
    setData('LIVE_PHOTO_INFO_SHOWN_COUNT', { count });
}
