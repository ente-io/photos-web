import PDFViewer from './PDFViewer';
import styles from './styles.module.scss';
import Image from 'next/image';

const PreviewBanner = () => {
    return (
        <>
            <div className={styles.banner}>
                <div className={styles.left}>
                    <div className={styles.logo}>
                        <Image
                            src="/ente.svg"
                            alt="Ente"
                            width={50}
                            height={50}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default PreviewBanner;
