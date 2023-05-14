import PreviewBanner from '@/app/components/PreviewBanner';

import styles from './styles.module.scss';
import PDFViewer from '@/app/components/PreviewBanner/PDFViewer';

const Page = ({
    params,
}: {
    params: {
        uuid: string;
    };
}) => {
    return (
        <>
            <div className={styles.wrapper}>
                <PreviewBanner />
                <PDFViewer
                    pdfUrl={`${process.env.NEXT_PUBLIC_BUCKET_URL}/${params.uuid}`}
                />
            </div>
        </>
    );
};

export default Page;
