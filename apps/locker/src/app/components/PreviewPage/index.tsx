'use client';

import PreviewBanner from '@/app/components/PreviewBanner';

import styles from './styles.module.scss';
import PDFViewer from '@/app/components/PreviewBanner/PDFViewer';
import { useEffect, useState } from 'react';

const PreviewPage = () => {
    const [fileUuid, setFileUuid] = useState<string | null>(null);

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

export default PreviewPage;
