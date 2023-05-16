'use client';
import styles from './styles.module.scss';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PreviewContext } from '../PreviewPage';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ({ pdfData }: { pdfData: Uint8Array }) => {
    const data = useMemo(() => {
        return new File([pdfData], "data");
    }, []);
    const { pageNumber, setPageNumber } = useContext(PreviewContext);
    const { totalPages, setTotalPages } = useContext(PreviewContext);
    const { hasRendered, setHasRendered } = useContext(PreviewContext);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setTotalPages(numPages);
    }

    function onPageRenderSuccess() {
        setHasRendered(true);
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
        <>
            <div
                style={{
                    width: hasRendered ? '100%' : '0%',
                    contain: 'content',
                }}>
                {/* @ts-ignore */}
                <Document
                    file={data}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className={styles.viewerCanvas}>
                    {/* @ts-ignore */}
                    <Page
                        pageNumber={pageNumber}
                        width={width}
                        height={height}
                        onRenderSuccess={onPageRenderSuccess}
                    />
                </Document>
            </div>
        </>
    );
};

export default PDFViewer;
