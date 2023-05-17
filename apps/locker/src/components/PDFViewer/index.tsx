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
        return new File([pdfData], 'data');
    }, []);
    const { pageNumber, setPageNumber } = useContext(PreviewContext);
    const { totalPages, setTotalPages } = useContext(PreviewContext);
    const { hasRendered, setHasRendered } = useContext(PreviewContext);

    const [originalWidth, setOriginalWidth] = useState(0);
    const [originalHeight, setOriginalHeight] = useState(0);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setTotalPages(numPages);
    }

    function onPageRenderSuccess({
        originalWidth,
        originalHeight,
    }: {
        originalWidth: number;
        originalHeight: number;
    }) {
        setOriginalWidth(originalWidth);
        setOriginalHeight(originalHeight);
        setHasRendered(true);
    }

    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        const updateWindowDimensions = () => {
            if (!originalWidth || !originalHeight) {
                return;
            }

            // if the width of the window is greater than the width of the PDF, set the width of the PDF to the width of the window
            if (window.innerWidth > originalWidth) {
                setWidth(originalWidth);
            } else {
                setWidth(window.innerWidth);
            }

            // if the height of the window is greater than the height of the PDF, set the height of the PDF to the height of the window
            if (window.innerHeight > originalHeight) {
                setHeight(originalHeight);
            } else {
                setHeight(window.innerHeight);
            }
        };

        // call the function to update window dimensions
        updateWindowDimensions();

        // add event listener to window to call updateWindowDimensions when window is resized
        window.addEventListener('resize', updateWindowDimensions);

        // remove event listener when component is unmounted
        return () =>
            window.removeEventListener('resize', updateWindowDimensions);
    }, []);

    return (
        <>
            <div
                style={{
                    width: hasRendered ? '100%' : '0%',
                    height: hasRendered ? '100%' : '0%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
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
