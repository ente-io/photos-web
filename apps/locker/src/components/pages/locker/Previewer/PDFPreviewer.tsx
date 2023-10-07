import { useState, useEffect } from 'react';

const PDFPreviewer = ({ url }: { url: string }) => {
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    const updateWindowDimensions = () => {
        setWidth(window.innerWidth);
        setHeight(window.innerHeight - 200);
    };

    useEffect(() => {
        updateWindowDimensions();
        window.addEventListener('resize', updateWindowDimensions);
        return () => {
            window.removeEventListener('resize', updateWindowDimensions);
        };
    }, []);

    return (
        <object data={url} type="application/pdf" width={width} height={height}>
            <iframe src={url} width={width} height={height}>
                <p>This browser does not support PDF!</p>
            </iframe>
        </object>
    );
};

export default PDFPreviewer;
