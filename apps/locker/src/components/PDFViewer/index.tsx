'use client';

import React, { useContext, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import EnteButton from '../ui/EnteButton';
import { PreviewContext } from '../PreviewPage';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ({ pdfUrl }: { pdfUrl: string }) => {
    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        // setNumPages(numPages);
    }

    const { pageNumber } = useContext(PreviewContext);

    return (
        <div>
            {/* @ts-ignore */}
            <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
                {/* @ts-ignore */}
                <Page pageNumber={pageNumber} />
            </Document>
        </div>
    );
};

export default PDFViewer;
