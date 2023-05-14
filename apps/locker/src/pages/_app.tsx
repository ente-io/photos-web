import './globals.scss';
import { Inter } from 'next/font/google';

import { styled, ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../components/themes';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'ente Locker',
    description: 'The safe space for your documents. Coming soon.',
    image: '/locker.svg',
};

import { AppProps } from 'next/app';
import Head from 'next/head';

const App = ({ Component, pageProps }: AppProps) => {
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
            <div className={inter.className} style={{ display: 'contents' }}>
                <ThemeProvider theme={getTheme('dark', 'ente Locker')}>
                    <Component {...pageProps} />
                </ThemeProvider>
            </div>
        </>
    );
};

export default App;
