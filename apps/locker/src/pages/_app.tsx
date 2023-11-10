import '../../public/css/global.css';

import { ThemeProvider } from '@mui/material/styles';

export const metadata = {
    title: 'ente Locker',
    description: 'The safe space for your documents.',
    image: '/locker.svg',
};

import Head from 'next/head';
import { createContext, useEffect, useRef, useState } from 'react';
import { setupI18n } from '@ente/shared/i18n';
import { THEME_COLOR } from '@ente/shared/themes/constants';
import { SetTheme } from '@ente/shared/themes/types';
import {
    DialogBoxAttributesV2,
    SetDialogBoxAttributesV2,
} from '@ente/shared/components/DialogBoxV2/types';
import { t } from 'i18next';
import { getTheme } from '@ente/shared/themes';
import createEmotionCache from '@ente/shared/themes/createEmotionCache';
import { LOCKER_PAGES as PAGES } from '@ente/shared/constants/pages';
import { User } from '@ente/shared/user/types';
import {
    CLIENT_PACKAGE_NAMES,
    APPS,
    APP_TITLES,
} from '@ente/shared/apps/constants';
import { addLogLine } from '@ente/shared/logging';
import { clearLogsIfLocalStorageLimitExceeded } from '@ente/shared/logging/web';
import { getSentryUserID } from '@ente/shared/sentry/utils';
import { LS_KEYS, getData } from '@ente/shared/storage/localStorage';
import { CssBaseline, useMediaQuery } from '@mui/material';
import { useRouter } from 'next/router';
import { EnteAppProps } from '@ente/shared/apps/types';
import { useLocalState } from '@ente/shared/hooks/useLocalState';
import { CacheProvider } from '@emotion/react';
import { Overlay } from 'components/Container';
import DialogBoxV2 from 'components/DialogBoxV2';
import EnteSpinner from 'components/EnteSpinner';
import { MessageContainer } from '@ente/shared/components/MessageContainer';
import AppNavbar from '@ente/shared/components/Navbar/app';
import LoadingBar from 'react-top-loading-bar';
import HTTPService from '@ente/shared/network/HTTPService';

type AppContextType = {
    showNavBar: (show: boolean) => void;
    startLoading: () => void;
    finishLoading: () => void;
    isMobile: boolean;
    themeColor: THEME_COLOR;
    setThemeColor: SetTheme;
    somethingWentWrong: () => void;
    setDialogBoxAttributesV2: SetDialogBoxAttributesV2;
    shiftKeyHeld: boolean;
    ctrlCmdKeyHeld: boolean;
};

export const AppContext = createContext<AppContextType>(null);

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

const App = (props: EnteAppProps) => {
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
    const isLoadingBarRunning = useRef(false);
    const loadingBar = useRef(null);
    const [dialogBoxAttributeV2, setDialogBoxAttributesV2] =
        useState<DialogBoxAttributesV2>();
    const [dialogBoxV2View, setDialogBoxV2View] = useState(false);
    const isMobile = useMediaQuery('(max-width:428px)');
    const [themeColor, setThemeColor] = useLocalState(
        LS_KEYS.THEME,
        THEME_COLOR.DARK
    );
    const [shiftKeyHeld, setShiftKeyHeld] = useState<boolean>(false);
    const [ctrlCmdKeyHeld, setCtrlCmdKeyHeld] = useState<boolean>(false);

    useEffect(() => {
        //setup i18n
        setupI18n().finally(() => setIsI18nReady(true));
        // set client package name in headers
        HTTPService.setHeaders({
            'X-Client-Package': CLIENT_PACKAGE_NAMES.get(APPS.AUTH),
        });
        // setup logging
        clearLogsIfLocalStorageLimitExceeded();
        const main = async () => {
            addLogLine(`userID: ${(getData(LS_KEYS.USER) as User)?.id}`);
            addLogLine(`sentryID: ${await getSentryUserID()}`);
            addLogLine(`sentry release ID: ${process.env.SENTRY_RELEASE}`);
        };
        main();
    }, []);

    const setUserOnline = () => setOffline(false);
    const setUserOffline = () => setOffline(true);

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
        router.events.on('routeChangeStart', (url: string) => {
            const newPathname = url.split('?')[0] as PAGES;
            if (window.location.pathname !== newPathname) {
                setLoading(true);
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
    }, []);

    useEffect(() => {
        setDialogBoxV2View(true);
    }, [dialogBoxAttributeV2]);

    const keyListener = (e: KeyboardEvent) => {
        setShiftKeyHeld(e.shiftKey);
        setCtrlCmdKeyHeld(e.ctrlKey || e.metaKey);
    };

    useEffect(() => {
        window.addEventListener('keydown', keyListener);
        window.addEventListener('keyup', keyListener);

        return () => {
            window.removeEventListener('keydown', keyListener);
            window.removeEventListener('keyup', keyListener);
        };
    }, []);

    const showNavBar = (show: boolean) => setShowNavBar(show);

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

    const closeDialogBoxV2 = () => setDialogBoxV2View(false);

    const somethingWentWrong = () =>
        setDialogBoxAttributesV2({
            title: t('ERROR'),
            close: { variant: 'critical' },
            content: t('UNKNOWN_ERROR'),
        });

    return (
        <>
            <CacheProvider value={emotionCache}>
                <Head>
                    <title>
                        {isI18nReady
                            ? t('TITLE', { context: APPS.LOCKER })
                            : APP_TITLES.get(APPS.LOCKER)}
                    </title>
                    <meta charSet="utf-8" key="charSet" />
                    <meta
                        httpEquiv="X-UA-Compatible"
                        content="IE=edge"
                        key="httpEquiv"
                    />
                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
                    />
                </Head>

                <ThemeProvider theme={getTheme(themeColor, APPS.AUTH)}>
                    <CssBaseline enableColorScheme />
                    {showNavbar && <AppNavbar isMobile={isMobile} />}
                    <MessageContainer>
                        {offline && t('OFFLINE_MSG')}
                    </MessageContainer>

                    <LoadingBar color="#51cd7c" ref={loadingBar} />

                    <DialogBoxV2
                        sx={{ zIndex: 1600 }}
                        open={dialogBoxV2View}
                        onClose={closeDialogBoxV2}
                        attributes={dialogBoxAttributeV2}
                    />

                    <AppContext.Provider
                        value={{
                            showNavBar,
                            startLoading,
                            finishLoading,
                            isMobile,
                            themeColor,
                            setThemeColor,
                            somethingWentWrong,
                            setDialogBoxAttributesV2,
                            shiftKeyHeld,
                            ctrlCmdKeyHeld,
                        }}>
                        {(loading || !isI18nReady) && (
                            <Overlay
                                sx={(theme) => ({
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    zIndex: 2000,
                                    backgroundColor:
                                        theme.colors.background.base,
                                })}>
                                <EnteSpinner />
                            </Overlay>
                        )}
                        <Component setLoading={setLoading} {...pageProps} />
                    </AppContext.Provider>
                </ThemeProvider>
            </CacheProvider>
        </>
    );
};

export default App;
