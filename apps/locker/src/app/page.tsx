import Image from 'next/image';
import styles from './styles.module.scss';
const Page = () => {
    return (
        <>
            <div className={styles.wrapper}>
                <div className={styles.container}>
                    <a href="https://ente.io" target="_blank" rel="noreferrer">
                        <Image
                            alt="ente Locker logo"
                            src="/locker.svg"
                            width={200}
                            height={100}
                        />
                    </a>
                    <p>Coming soon.</p>
                </div>
            </div>
        </>
    );
};

export default Page;
