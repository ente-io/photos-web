import { MOBILE_BREAKPOINT } from '@/constants/resolution/mobile';

export const isMobileDisplay = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    const { innerWidth } = window;

    return innerWidth < MOBILE_BREAKPOINT;
};
