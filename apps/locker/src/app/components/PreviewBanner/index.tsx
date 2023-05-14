import Link from 'next/link';
import styles from './styles.module.scss';
import Image from 'next/image';
import { useContext } from 'react';
import { PreviewContext } from '../PreviewContext';

const PreviewBanner = () => {
    const { pageNumber, setPageNumber, url } = useContext(PreviewContext);

    return (
        <>
            <div className={styles.banner}>
                <div className={styles.left}>
                    <div className={styles.logo}>
                        <Link href="/">
                            <Image
                                src="/locker.svg"
                                alt="ente Locker logo"
                                width={200}
                                height={50}
                            />
                        </Link>
                    </div>
                </div>
                <div className={styles.right}>
                    <button
                        onClick={() => {
                            setPageNumber(pageNumber + 1);
                        }}>
                        {'<'}
                    </button>
                    <button
                        onClick={() => {
                            setPageNumber(pageNumber + 1);
                        }}>
                        {'>'}
                    </button>
                    <button
                        onClick={() => {
                            window.open(url, '_blank');
                        }}>
                        Download
                    </button>
                </div>
            </div>
        </>
    );
};

export default PreviewBanner;
