'use client';

import Image from 'next/image';
import styles from './styles.module.scss';
import { Button, Typography } from '@mui/material';
import BetaWarningDialog from './BetaWarningDialog';
import { useEffect, useState } from 'react';
import { LS_KEYS, getData, setData } from '@/utils/storage/localStorage';
import { useRouter } from 'next/router';

const LandingPage = () => {
    const [showBetaWarningDialog, setShowBetaWarningDialog] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (getData(LS_KEYS.BETA_WARNING)?.viewed) {
            router.push('/locker');
        }
    }, []);

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
                    <Typography marginBottom="1rem">
                        Your truly personal space for important documents.
                    </Typography>
                    <Button
                        variant="contained"
                        color="accent"
                        onClick={() => {
                            setShowBetaWarningDialog(true);
                        }}>
                        Try it out
                    </Button>
                </div>
            </div>
            <BetaWarningDialog
                show={showBetaWarningDialog}
                onHide={() => {
                    setShowBetaWarningDialog(false);
                    setData(LS_KEYS.BETA_WARNING, {
                        viewed: true,
                    });
                }}
            />
        </>
    );
};

export default LandingPage;
