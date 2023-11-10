'use client';

import PreviewBanner from 'components/PreviewBanner';

import styles from './styles.module.scss';
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('components/PDFViewer'), {
    ssr: false,
});

import { useEffect, useState } from 'react';

import { SetStateAction, createContext, Dispatch } from 'react';
import CircularProgress from '@mui/material/CircularProgress';

export const PreviewContext = createContext<{
    pageNumber: number;
    setPageNumber: Dispatch<SetStateAction<number>>;
    pdfData: Uint8Array;
    setPdfData: Dispatch<SetStateAction<Uint8Array>>;
    totalPages: number;
    setTotalPages: Dispatch<SetStateAction<number>>;
    hasRendered: boolean;
    setHasRendered: Dispatch<SetStateAction<boolean>>;
}>({
    pageNumber: 1,
    setPageNumber: (value: SetStateAction<number>) => {},
    pdfData: new Uint8Array(),
    setPdfData: (value: SetStateAction<Uint8Array>) => {},
    totalPages: 0,
    setTotalPages: (value: SetStateAction<number>) => {},
    hasRendered: false,
    setHasRendered: (value: SetStateAction<boolean>) => {},
});

const PreviewPage = () => {
    const [fileUuid, setFileUuid] = useState<string | null>(null);

    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [hasRendered, setHasRendered] = useState(false);
    const [pdfData, setPdfData] = useState<Uint8Array>(new Uint8Array());

    const handleKeyPress = (event: any) => {
        if (event.code == 'ArrowLeft' && pageNumber > 1) {
            setPageNumber(pageNumber - 1);
        } else if (event.code === 'ArrowRight' && pageNumber < totalPages) {
            setPageNumber(pageNumber + 1);
        }
    };

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
            const fetchedData = await fetch(
                `${process.env.NEXT_PUBLIC_BUCKET_URL}/${data}`
            );
            setPdfData(new Uint8Array(await fetchedData.arrayBuffer()));
        }
    };

    useEffect(() => {
        extractFileUuid();
    }, []);

    return (
        <>
            <div
                className={styles.wrapper}
                onKeyDown={handleKeyPress}
                tabIndex={0}>
                <PreviewContext.Provider
                    value={{
                        pageNumber,
                        setPageNumber,
                        pdfData,
                        setPdfData,
                        totalPages,
                        setTotalPages,
                        hasRendered,
                        setHasRendered,
                    }}>
                    <PreviewBanner />

                    {hasRendered ? (
                        <div></div>
                    ) : (
                        <>
                            <div
                                style={{
                                    padding: '10rem',
                                    textAlign: 'center',
                                }}>
                                <CircularProgress />
                            </div>
                        </>
                    )}
                    {fileUuid && pdfData.length > 0 && (
                        <PDFViewer pdfData={pdfData} />
                    )}
                </PreviewContext.Provider>
            </div>
        </>
    );
};

export default PreviewPage;
