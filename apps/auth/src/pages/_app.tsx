import React, { createContext, useEffect, useState } from 'react';
import { ThemeProvider, styled } from '@mui/material';
import createEmotionCache from '@ente/shared/theme/createEmotionCache';
import AppNavbar from '@ente/shared/components/Navbar/app';
import { useRouter } from 'next/router';
import { CacheProvider } from '@emotion/react';
import Head from 'next/head';
import { EnteAppProps } from '@ente/shared/apps/types';
import { getTheme } from '@ente/shared/theme';
import { CssBaseline, useMediaQuery } from '@mui/material';
import DialogBoxV2 from '@ente/shared/components/DialogBoxV2';
import { THEME_COLOR } from '@ente/shared/theme/constants';
import { SetTheme } from '@ente/shared/theme/types';
import {
    DialogBoxAttributesV2,
    SetDialogBoxAttributesV2,
} from '@ente/shared/components/DialogBoxV2/types';
import { LS_KEYS, getData } from '@ente/shared/storage/localStorage';
import { useLocalState } from '@ente/shared/hooks/useLocalState';
import { setupI18n } from '@ente/shared/i18n';
import { APPS, CLIENT_PACKAGE_NAMES } from '@ente/shared/apps/constants';
import HTTPService from '@ente/shared/network/HTTPService';
import { clearLogsIfLocalStorageLimitExceeded } from '@ente/shared/logging/web';
import { addLogLine } from '@ente/shared/logging';
import { User } from '@ente/shared/user/types';
import { getSentryUserID } from '@ente/shared/sentry/utils';
import { t } from 'i18next';
import { PAGES } from '@ente/accounts/constants/pages';
import { Overlay } from '@ente/shared/components/Container';
import EnteSpinner from '@ente/shared/components/EnteSpinner';

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
    isMobile: boolean;
    themeColor: THEME_COLOR;
    setThemeColor: SetTheme;
    somethingWentWrong: () => void;
    setDialogBoxAttributesV2: SetDialogBoxAttributesV2;
};

export const AppContext = createContext<AppContextType>(null);

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export default function App(props: EnteAppProps) {
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
    const [dialogBoxAttributeV2, setDialogBoxAttributesV2] =
        useState<DialogBoxAttributesV2>();
    const [dialogBoxV2View, setDialogBoxV2View] = useState(false);
    const isMobile = useMediaQuery('(max-width:428px)');
    const [themeColor, setThemeColor] = useLocalState(
        LS_KEYS.THEME,
        THEME_COLOR.DARK
    );

    useEffect(() => {
        setupI18n().finally(() => setIsI18nReady(true));
    }, []);

    useEffect(() => {
        HTTPService.setHeaders({
            'X-Client-Package': CLIENT_PACKAGE_NAMES.get(APPS.AUTH),
        });
    }, []);

    useEffect(() => {
        const main = async () => {
            clearLogsIfLocalStorageLimitExceeded();
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

    const showNavBar = (show: boolean) => setShowNavBar(show);

    const closeDialogBoxV2 = () => setDialogBoxV2View(false);

    const somethingWentWrong = () =>
        setDialogBoxAttributesV2({
            title: t('ERROR'),
            close: { variant: 'critical' },
            content: t('UNKNOWN_ERROR'),
        });

    return (
        <CacheProvider value={emotionCache}>
            <Head>
                <title>Ente Auth</title>
                <meta
                    name="viewport"
                    content="initial-scale=1, width=device-width"
                />
            </Head>

            <ThemeProvider theme={getTheme(themeColor, APPS.AUTH)}>
                <CssBaseline enableColorScheme />
                {showNavbar && <AppNavbar isMobile={isMobile} />}
                <MessageContainer>
                    {offline && t('OFFLINE_MSG')}
                </MessageContainer>

                <DialogBoxV2
                    sx={{ zIndex: 1600 }}
                    open={dialogBoxV2View}
                    onClose={closeDialogBoxV2}
                    attributes={dialogBoxAttributeV2}
                />

                <AppContext.Provider
                    value={{
                        showNavBar,
                        isMobile,
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
                            <EnteSpinner />
                        </Overlay>
                    )}
                    <Component setLoading={setLoading} {...pageProps} />
                </AppContext.Provider>
            </ThemeProvider>
        </CacheProvider>
    );
}
