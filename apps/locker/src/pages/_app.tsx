import './globals.scss';
import { Inter } from 'next/font/google';

import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../components/themes';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'ente Locker',
    description: 'The safe space for your documents.',
    image: '/locker.svg',
};

import { AppProps } from 'next/app';
import Head from 'next/head';
import { createContext, useEffect, useState } from 'react';
import { setupI18n } from '@/i18n';
import FullScreenLoader from '@/components/FullScreenLoader';

export const AppContext = createContext(
    {} as {
        shiftKeyHeld: boolean;
        ctrlCmdKeyHeld: boolean;
    }
);

const App = ({ Component, pageProps }: AppProps) => {
    const [isI18nReady, setIsI18nReady] = useState<boolean>(false);

    const [shiftKeyHeld, setShiftKeyHeld] = useState<boolean>(false);
    const [ctrlCmdKeyHeld, setCtrlCmdKeyHeld] = useState<boolean>(false);

    useEffect(() => {
        setupI18n().finally(() => setIsI18nReady(true));
    }, []);

    const keyDownListener = (e: KeyboardEvent) => {
        setShiftKeyHeld(e.shiftKey);
        setCtrlCmdKeyHeld(e.ctrlKey);
    };

    useEffect(() => {
        window.addEventListener('keydown', keyDownListener);

        return () => {
            window.removeEventListener('keydown', keyDownListener);
        };
    }, []);

    return (
        <>
            <Head>
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
            <main className={inter.className} style={{ display: 'contents' }}>
                <ThemeProvider theme={getTheme('dark')}>
                    <AppContext.Provider
                        value={{
                            shiftKeyHeld,
                            ctrlCmdKeyHeld,
                        }}>
                        {isI18nReady ? (
                            <Component {...pageProps} />
                        ) : (
                            <FullScreenLoader />
                        )}
                    </AppContext.Provider>
                </ThemeProvider>
            </main>
        </>
    );
};

export default App;
