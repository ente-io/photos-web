'use client';

import { useEffect, useState } from 'react';
import LandingPage from './components/LandingPage';
import PreviewPage from './components/PreviewPage';

const Page = () => {
    const [pageState, setPageState] = useState<string | null>('landing');

    const checkPageState = () => {
        // check if there's ?id present in the url
        const urlParams = new URLSearchParams(window.location.search);
        const kvUuid = urlParams.get('id');

        if (kvUuid) {
            setPageState('preview');
        }
    };

    useEffect(() => {
        checkPageState();
    }, []);

    return (
        <>
            {pageState === 'landing' && <LandingPage />}
            {pageState === 'preview' && <PreviewPage />}
        </>
    );
};

export default Page;
