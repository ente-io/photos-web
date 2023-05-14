'use client';

import PreviewBanner from '@/components/PreviewBanner';

import styles from './styles.module.scss';
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
    ssr: false,
});

import { useEffect, useState } from 'react';

import { SetStateAction, createContext, Dispatch } from 'react';

export const PreviewContext = createContext<{
    pageNumber: number;
    setPageNumber: Dispatch<SetStateAction<number>>;
    url: string;
    setUrl: Dispatch<SetStateAction<string>>;
}>({
    pageNumber: 1,
    setPageNumber: (value: SetStateAction<number>) => {},
    url: '',
    setUrl: (value: SetStateAction<string>) => {},
});

const PreviewPage = () => {
    const [fileUuid, setFileUuid] = useState<string | null>(null);

    const [pageNumber, setPageNumber] = useState(1);
    const [url, setUrl] = useState<string>('');

    const extractFileUuid = async () => {
        // get it from the query params
        const urlParams = new URLSearchParams(window.location.search);
        const kvUuid = urlParams.get('id');

        // get actual s3 id from worker
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_WORKER_URL}/mapping/${kvUuid}`
        );

        const data = await res.text();

        if (res.ok) {
            setFileUuid(data);
            setUrl(`${process.env.NEXT_PUBLIC_BUCKET_URL}/${data}`);
        }
    };

    useEffect(() => {
        extractFileUuid();
    }, []);

    return (
        <>
            <div className={styles.wrapper}>
                <PreviewContext.Provider
                    value={{
                        pageNumber,
                        setPageNumber,
                        url,
                        setUrl,
                    }}>
                    <PreviewBanner />
                    {fileUuid && <PDFViewer pdfUrl={url} />}
                </PreviewContext.Provider>
            </div>
        </>
    );
};

export default PreviewPage;
