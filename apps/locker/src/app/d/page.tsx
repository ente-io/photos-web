'use client';

import PreviewBanner from '@/app/components/PreviewBanner';

import styles from './styles.module.scss';
import PDFViewer from '@/app/components/PreviewBanner/PDFViewer';
import { useEffect, useState } from 'react';

const Page = () => {
    const [fileUuid, setFileUuid] = useState<string | null>(null);

    const extractFileUuid = () => {
        // get it from the query params
        const urlParams = new URLSearchParams(window.location.search);
        const fileUuid = urlParams.get('file');

        if (fileUuid) {
            setFileUuid(fileUuid);
        }
    };

    useEffect(() => {
        extractFileUuid();
    }, []);

    return (
        <>
            <div className={styles.wrapper}>
                <PreviewBanner />
                {fileUuid && (
                    <PDFViewer
                        pdfUrl={`${process.env.NEXT_PUBLIC_BUCKET_URL}/${fileUuid}`}
                    />
                )}
            </div>
        </>
    );
};

export default Page;
