import Link from 'next/link';
import styles from './styles.module.scss';
import Image from 'next/image';

const PreviewBanner = () => {
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
            </div>
        </>
    );
};

export default PreviewBanner;
