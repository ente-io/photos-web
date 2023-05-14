// import '@/styles/globals.css'
import type { AppProps } from 'next/app';

import {
    DialogBoxAttributesV2,
    SetDialogBoxAttributes,
} from '@ente/types/dialogBox';
import { THEME_COLOR } from '@ente/constants/theme';
import { SetTheme } from '@ente/types/theme';
import { SetNotificationAttributes } from '@ente/types/Notification';

type AppContextType = {
    showNavBar: (show: boolean) => void;
    sharedFiles: File[];
    resetSharedFiles: () => void;
    redirectURL: string;
    setRedirectURL: (url: string) => void;
    mlSearchEnabled: boolean;
    updateMlSearchEnabled: (enabled: boolean) => Promise<void>;
    startLoading: () => void;
    finishLoading: () => void;
    closeMessageDialog: () => void;
    setDialogMessage: SetDialogBoxAttributes;
    setNotificationAttributes: SetNotificationAttributes;
    isFolderSyncRunning: boolean;
    setIsFolderSyncRunning: (isRunning: boolean) => void;
    watchFolderView: boolean;
    setWatchFolderView: (isOpen: boolean) => void;
    watchFolderFiles: FileList;
    setWatchFolderFiles: (files: FileList) => void;
    isMobile: boolean;
    themeColor: THEME_COLOR;
    setThemeColor: SetTheme;
    somethingWentWrong: () => void;
    setDialogBoxAttributesV2: (attributes: DialogBoxAttributesV2) => void;
};

export const AppContext = createContext<AppContextType>(null);

export default function App({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}
