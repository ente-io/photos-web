'use client';
import Link from 'next/link';
import styles from './styles.module.scss';
import Image from 'next/image';
import { useContext } from 'react';
import { IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DownloadIcon from '@mui/icons-material/Download';
import { PreviewContext } from '../PreviewPage';
const PreviewBanner = () => {
    const { pageNumber, setPageNumber, totalPages, hasRendered, pdfData } =
        useContext(PreviewContext);

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
                    {hasRendered ? (
                        <div>
                            <IconButton
                                onClick={() => {
                                    setPageNumber(pageNumber - 1);
                                }}
                                color="primary">
                                <ChevronLeftIcon />
                            </IconButton>
                            <span
                                style={{
                                    color: 'white',
                                }}>
                                <b>{pageNumber}</b> of <b>{totalPages}</b>
                            </span>

                            <IconButton
                                onClick={() => {
                                    setPageNumber(pageNumber + 1);
                                }}
                                color="primary">
                                <ChevronRightIcon />
                            </IconButton>

                            <IconButton
                                onClick={() => {
                                    // TODO
                                    // window.open(url);
                                }}
                                color="primary">
                                <DownloadIcon />
                            </IconButton>
                        </div>
                    ) : (
                        <></>
                    )}
                </div>
            </div>
        </>
    );
};

export default PreviewBanner;
