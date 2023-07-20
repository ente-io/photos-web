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
import { useEffect, useState } from 'react';
import { setupI18n } from '@/i18n';
import FullScreenLoader from '@/components/FullScreenLoader';

const App = ({ Component, pageProps }: AppProps) => {
    const [isI18nReady, setIsI18nReady] = useState<boolean>(false);

    useEffect(() => {
        setupI18n().finally(() => setIsI18nReady(true));
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
                    {isI18nReady ? (
                        <Component {...pageProps} />
                    ) : (
                        <FullScreenLoader />
                    )}
                </ThemeProvider>
            </main>
        </>
    );
};

export default App;
