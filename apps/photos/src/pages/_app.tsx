import React, {
    createContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import AppNavbar from 'components/Navbar/app';
import { t } from 'i18next';

import { useRouter } from 'next/router';
import { Overlay } from 'components/Container';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'photoswipe/dist/photoswipe.css';
import 'styles/global.css';
import EnteSpinner from 'components/EnteSpinner';
import { logError } from '../utils/sentry';
import { getData, LS_KEYS } from 'utils/storage/localStorage';
import HTTPService from 'services/HTTPService';
import Head from 'next/head';
import { eventBus, Events } from 'services/events';
import mlWorkManager from 'services/machineLearning/mlWorkManager';
import {
    getMLSearchConfig,
    updateMLSearchConfig,
} from 'utils/machineLearning/config';
import LoadingBar from 'react-top-loading-bar';
import DialogBox from 'components/DialogBox';
import { styled, ThemeProvider } from '@mui/material/styles';
import { CssBaseline, useMediaQuery } from '@mui/material';
import {
    SetDialogBoxAttributes,
    DialogBoxAttributes,
    DialogBoxAttributesV2,
} from 'types/dialogBox';
import {
    getFamilyPortalRedirectURL,
    getRoadmapRedirectURL,
} from 'services/userService';
import { CustomError } from 'utils/error';
import {
    addLogLine,
    clearLogsIfLocalStorageLimitExceeded,
} from 'utils/logging';
import isElectron from 'is-electron';
import ElectronUpdateService from 'services/electron/update';
import {
    getUpdateAvailableForDownloadMessage,
    getUpdateReadyToInstallMessage,
} from 'utils/ui';
import Notification from 'components/Notification';
import {
    NotificationAttributes,
    SetNotificationAttributes,
} from 'types/Notification';
import ArrowForward from '@mui/icons-material/ArrowForward';
import { AppUpdateInfo } from 'types/electron';
import { getSentryUserID } from 'utils/user';
import { User } from 'types/user';
import { SetTheme } from 'types/theme';
import { useLocalState } from 'hooks/useLocalState';
import { THEME_COLOR } from 'constants/theme';
import { setupI18n } from 'i18n';
import createEmotionCache from 'themes/createEmotionCache';
import { CacheProvider, EmotionCache } from '@emotion/react';
import { AppProps } from 'next/app';
import DialogBoxV2 from 'components/DialogBoxV2';
import { getTheme } from 'themes';
import { PAGES } from 'constants/pages';
import {
    ALLOWED_APP_PAGES,
    APPS,
    CLIENT_PACKAGE_NAMES,
    getAppNameAndTitle,
} from 'constants/apps';
import exportService from 'services/export';
import { ExportStage } from 'constants/export';
import { REDIRECTS } from 'constants/redirects';

const redirectMap = new Map([
    [REDIRECTS.ROADMAP, getRoadmapRedirectURL],
    [REDIRECTS.FAMILIES, getFamilyPortalRedirectURL],
]);

export const MessageContainer = styled('div')`
    background-color: #111;
    padding: 0;
    font-size: 14px;
    text-align: center;
    line-height: 32px;
`;

export interface BannerMessage {
    message: string;
    variant: string;
}

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

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export interface EnteAppProps extends AppProps {
    emotionCache?: EmotionCache;
}

export default function App(props) {
    const {
        Component,
        emotionCache = clientSideEmotionCache,
        pageProps,
    } = props;
    const router = useRouter();
    const [isI18nReady, setIsI18nReady] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const [offline, setOffline] = useState(
        typeof window !== 'undefined' && !window.navigator.onLine
    );
    const [showNavbar, setShowNavBar] = useState(false);
    const [sharedFiles, setSharedFiles] = useState<File[]>(null);
    const [redirectName, setRedirectName] = useState<string>(null);
    const [redirectURL, setRedirectURL] = useState(null);
    const [mlSearchEnabled, setMlSearchEnabled] = useState(false);
    const isLoadingBarRunning = useRef(false);
    const loadingBar = useRef(null);
    const [dialogMessage, setDialogMessage] = useState<DialogBoxAttributes>();
    const [dialogBoxAttributeV2, setDialogBoxAttributesV2] =
        useState<DialogBoxAttributesV2>();
    useState<DialogBoxAttributes>(null);
    const [messageDialogView, setMessageDialogView] = useState(false);
    const [dialogBoxV2View, setDialogBoxV2View] = useState(false);
    const [isFolderSyncRunning, setIsFolderSyncRunning] = useState(false);
    const [watchFolderView, setWatchFolderView] = useState(false);
    const [watchFolderFiles, setWatchFolderFiles] = useState<FileList>(null);
    const isMobile = useMediaQuery('(max-width:428px)');
    const [notificationView, setNotificationView] = useState(false);
    const closeNotification = () => setNotificationView(false);
    const [notificationAttributes, setNotificationAttributes] =
        useState<NotificationAttributes>(null);
    const [themeColor, setThemeColor] = useLocalState(
        LS_KEYS.THEME,
        THEME_COLOR.DARK
    );

    const { name: appName, title: appTitle } = useMemo(() => {
        return getAppNameAndTitle();
    }, []);

    useEffect(() => {
        setupI18n().finally(() => setIsI18nReady(true));
    }, []);

    useEffect(() => {
        if (!appName) {
            return;
        }
        HTTPService.setHeaders({
            'X-Client-Package': CLIENT_PACKAGE_NAMES.get(appName),
        });
    }, [appName]);

    useEffect(() => {
        HTTPService.getInterceptors().response.use(
            (resp) => resp,
            (error) => {
                logError(error, 'HTTP Service Error');
                return Promise.reject(error);
            }
        );
        clearLogsIfLocalStorageLimitExceeded();
        const main = async () => {
            addLogLine(`userID: ${(getData(LS_KEYS.USER) as User)?.id}`);
            addLogLine(`sentryID: ${await getSentryUserID()}`);
            addLogLine(`sentry release ID: ${process.env.SENTRY_RELEASE}`);
        };
        main();
    }, []);

    useEffect(() => {
        if (isElectron()) {
            const showUpdateDialog = (updateInfo: AppUpdateInfo) => {
                if (updateInfo.autoUpdatable) {
                    setDialogMessage(
                        getUpdateReadyToInstallMessage(updateInfo)
                    );
                } else {
                    setNotificationAttributes({
                        endIcon: <ArrowForward />,
                        variant: 'secondary',
                        message: t('UPDATE_AVAILABLE'),
                        onClick: () =>
                            setDialogMessage(
                                getUpdateAvailableForDownloadMessage(updateInfo)
                            ),
                    });
                }
            };
            ElectronUpdateService.registerUpdateEventListener(showUpdateDialog);
        }
    }, []);

    useEffect(() => {
        if (!isElectron()) {
            return;
        }
        const loadMlSearchState = async () => {
            try {
                const mlSearchConfig = await getMLSearchConfig();
                setMlSearchEnabled(mlSearchConfig.enabled);
                mlWorkManager.setMlSearchEnabled(mlSearchConfig.enabled);
            } catch (e) {
                logError(e, 'Error while loading mlSearchEnabled');
            }
        };
        loadMlSearchState();
        try {
            eventBus.on(Events.LOGOUT, () => {
                setMlSearchEnabled(false);
                mlWorkManager.setMlSearchEnabled(false);
            });
        } catch (e) {
            logError(e, 'Error while subscribing to logout event');
        }
    }, []);

    useEffect(() => {
        if (!isElectron()) {
            return;
        }
        const initExport = async () => {
            try {
                addLogLine('init export');
                const exportSettings = exportService.getExportSettings();
                if (!exportService.exportFolderExists(exportSettings?.folder)) {
                    return;
                }
                const exportRecord = await exportService.getExportRecord(
                    exportSettings.folder
                );
                if (exportSettings.continuousExport) {
                    exportService.enableContinuousExport();
                }
                if (exportRecord.stage === ExportStage.INPROGRESS) {
                    addLogLine('export was in progress, resuming');
                    exportService.scheduleExport();
                }
            } catch (e) {
                logError(e, 'init export failed');
            }
        };
        initExport();
        try {
            eventBus.on(Events.LOGOUT, () => {
                exportService.disableContinuousExport();
            });
        } catch (e) {
            logError(e, 'Error while subscribing to logout event');
        }
    }, []);

    const setUserOnline = () => setOffline(false);
    const setUserOffline = () => setOffline(true);
    const resetSharedFiles = () => setSharedFiles(null);

    useEffect(() => {
        if (isI18nReady) {
            console.log(
                `%c${t('CONSOLE_WARNING_STOP')}`,
                'color: red; font-size: 52px;'
            );
            console.log(`%c${t('CONSOLE_WARNING_DESC')}`, 'font-size: 20px;');
        }
    }, [isI18nReady]);

    useEffect(() => {
        const redirectTo = async (redirect) => {
            if (
                redirectMap.has(redirect) &&
                typeof redirectMap.get(redirect) === 'function'
            ) {
                const redirectAction = redirectMap.get(redirect);
                window.location.href = await redirectAction();
            } else {
                logError(CustomError.BAD_REQUEST, 'invalid redirection', {
                    redirect,
                });
            }
        };

        const query = new URLSearchParams(window.location.search);
        const redirectName = query.get('redirect');
        if (redirectName) {
            const user = getData(LS_KEYS.USER);
            if (user?.token) {
                redirectTo(redirectName);
            } else {
                setRedirectName(redirectName);
            }
        }

        router.events.on('routeChangeStart', (url: string) => {
            const newPathname = url.split('?')[0] as PAGES;
            if (window.location.pathname !== newPathname) {
                setLoading(true);
            }

            if (
                appName === APPS.ALBUMS &&
                ALLOWED_APP_PAGES.get(APPS.ALBUMS).indexOf(newPathname) === -1
            ) {
                router.replace(PAGES.SHARED_ALBUMS);
                throw `Aborting route change, changing page ${newPathname} is not allowed for ${appName}`;
            } else if (
                appName === APPS.AUTH &&
                ALLOWED_APP_PAGES.get(APPS.AUTH).indexOf(newPathname) === -1
            ) {
                router.replace(PAGES.AUTH);
                throw `Aborting route change, changing page ${newPathname} is not allowed for ${appName}`;
            }

            if (redirectName) {
                const user = getData(LS_KEYS.USER);
                if (user?.token) {
                    redirectTo(redirectName);

                    // https://github.com/vercel/next.js/issues/2476#issuecomment-573460710
                    // eslint-disable-next-line no-throw-literal
                    throw 'Aborting route change, redirection in process....';
                }
            }
        });

        router.events.on('routeChangeComplete', () => {
            setLoading(false);
        });

        window.addEventListener('online', setUserOnline);
        window.addEventListener('offline', setUserOffline);

        return () => {
            window.removeEventListener('online', setUserOnline);
            window.removeEventListener('offline', setUserOffline);
        };
    }, [redirectName, appName]);

    useEffect(() => {
        setMessageDialogView(true);
    }, [dialogMessage]);

    useEffect(() => {
        setDialogBoxV2View(true);
    }, [dialogBoxAttributeV2]);

    useEffect(() => {
        setNotificationView(true);
    }, [notificationAttributes]);

    const showNavBar = (show: boolean) => setShowNavBar(show);
    const updateMlSearchEnabled = async (enabled: boolean) => {
        try {
            const mlSearchConfig = await getMLSearchConfig();
            mlSearchConfig.enabled = enabled;
            await updateMLSearchConfig(mlSearchConfig);
            setMlSearchEnabled(enabled);
            mlWorkManager.setMlSearchEnabled(enabled);
        } catch (e) {
            logError(e, 'Error while updating mlSearchEnabled');
        }
    };

    const startLoading = () => {
        !isLoadingBarRunning.current && loadingBar.current?.continuousStart();
        isLoadingBarRunning.current = true;
    };
    const finishLoading = () => {
        setTimeout(() => {
            isLoadingBarRunning.current && loadingBar.current?.complete();
            isLoadingBarRunning.current = false;
        }, 100);
    };

    const closeMessageDialog = () => setMessageDialogView(false);
    const closeDialogBoxV2 = () => setDialogBoxV2View(false);

    const somethingWentWrong = () =>
        setDialogMessage({
            title: t('ERROR'),
            close: { variant: 'critical' },
            content: t('UNKNOWN_ERROR'),
        });

    return (
        <CacheProvider value={emotionCache}>
            <Head>
                <title>
                    {isI18nReady ? t('TITLE', { context: appName }) : appTitle}
                </title>
                <meta
                    name="viewport"
                    content="initial-scale=1, width=device-width"
                />
            </Head>

            <ThemeProvider theme={getTheme(themeColor, appName)}>
                <CssBaseline enableColorScheme />
                {showNavbar && <AppNavbar />}
                <MessageContainer>
                    {offline && t('OFFLINE_MSG')}
                </MessageContainer>
                {sharedFiles &&
                    (router.pathname === '/gallery' ? (
                        <MessageContainer>
                            {t('files_to_be_uploaded', {
                                count: sharedFiles.length,
                            })}
                        </MessageContainer>
                    ) : (
                        <MessageContainer>
                            {t('login_to_upload_files', {
                                count: sharedFiles.length,
                            })}
                        </MessageContainer>
                    ))}
                <LoadingBar color="#51cd7c" ref={loadingBar} />

                <DialogBox
                    sx={{ zIndex: 1600 }}
                    size="xs"
                    open={messageDialogView}
                    onClose={closeMessageDialog}
                    attributes={dialogMessage}
                />
                <DialogBoxV2
                    sx={{ zIndex: 1600 }}
                    open={dialogBoxV2View}
                    onClose={closeDialogBoxV2}
                    attributes={dialogBoxAttributeV2}
                />
                <Notification
                    open={notificationView}
                    onClose={closeNotification}
                    attributes={notificationAttributes}
                />

                <AppContext.Provider
                    value={{
                        showNavBar,
                        mlSearchEnabled,
                        updateMlSearchEnabled,
                        sharedFiles,
                        resetSharedFiles,
                        redirectURL,
                        setRedirectURL,
                        startLoading,
                        finishLoading,
                        closeMessageDialog,
                        setDialogMessage,
                        isFolderSyncRunning,
                        setIsFolderSyncRunning,
                        watchFolderView,
                        setWatchFolderView,
                        watchFolderFiles,
                        setWatchFolderFiles,
                        isMobile,
                        setNotificationAttributes,
                        themeColor,
                        setThemeColor,
                        somethingWentWrong,
                        setDialogBoxAttributesV2,
                    }}>
                    {(loading || !isI18nReady) && (
                        <Overlay
                            sx={(theme) => ({
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 2000,
                                backgroundColor: theme.colors.background.base,
                            })}>
                            <EnteSpinner>
                                <span className="sr-only">Loading...</span>
                            </EnteSpinner>
                        </Overlay>
                    )}
                    <Component setLoading={setLoading} {...pageProps} />
                </AppContext.Provider>
            </ThemeProvider>
        </CacheProvider>
    );
}
