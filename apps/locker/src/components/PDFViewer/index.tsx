'use client';
import styles from './styles.module.scss';
import React, { useContext, useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PreviewContext } from '../PreviewPage';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ({ pdfUrl }: { pdfUrl: string }) => {
    const { pageNumber, setTotalPages } = useContext(PreviewContext);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setTotalPages(numPages);
    }

    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        const updateWindowDimensions = () => {
            setWidth(window.innerWidth);
            setHeight(window.innerHeight);
        };

        updateWindowDimensions();

        window.addEventListener('resize', updateWindowDimensions);

        return () =>
            window.removeEventListener('resize', updateWindowDimensions);
    }, []);

    return (
        <div
            style={{
                width: '100%',
                contain: 'content',
            }}>
            {/* @ts-ignore */}
            <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                className={styles.viewerCanvas}>
                {/* @ts-ignore */}
                <Page pageNumber={pageNumber} width={width} height={height} />
            </Document>
        </div>
    );
};

export default PDFViewer;
