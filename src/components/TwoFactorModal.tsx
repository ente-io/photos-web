import { useRouter } from 'next/router';
import { DeadCenter } from 'pages/gallery';
import { AppContext, FLASH_MESSAGE_TYPE } from 'pages/_app';
import React, { useContext, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { disableTwoFactor, getTwoFactorStatus } from 'services/userService';
import { SetLoading } from 'types/gallery';
import { PAGES } from 'constants/pages';
import { getData, LS_KEYS, setData } from 'utils/storage/localStorage';
import constants from 'utils/strings/constants';
import { Label, Value, Row } from './Container';
import MessageDialog, { SetDialogMessage } from './MessageDialog';

interface Props {
    show: boolean;
    onHide: () => void;
    setDialogMessage: SetDialogMessage;
    setLoading: SetLoading;
    closeSidebar: () => void;
}

function TwoFactorModal(props: Props) {
    const router = useRouter();
    const [isTwoFactorEnabled, setTwoFactorStatus] = useState(false);
    const appContext = useContext(AppContext);

    useEffect(() => {
        if (!props.show) {
            return;
        }
        const isTwoFactorEnabled =
            getData(LS_KEYS.USER).isTwoFactorEnabled ?? false;
        setTwoFactorStatus(isTwoFactorEnabled);
        const main = async () => {
            const isTwoFactorEnabled = await getTwoFactorStatus();
            setTwoFactorStatus(isTwoFactorEnabled);
            setData(LS_KEYS.USER, {
                ...getData(LS_KEYS.USER),
                isTwoFactorEnabled: false,
            });
        };
        main();
    }, [props.show]);
    const warnTwoFactorDisable = async () => {
        props.setDialogMessage({
            title: constants.DISABLE_TWO_FACTOR,
            staticBackdrop: true,
            content: constants.DISABLE_TWO_FACTOR_MESSAGE,
            close: { text: constants.CANCEL },
            proceed: {
                variant: 'danger',
                text: constants.DISABLE,
                action: twoFactorDisable,
            },
        });
    };
    const twoFactorDisable = async () => {
        try {
            await disableTwoFactor();
            setData(LS_KEYS.USER, {
                ...getData(LS_KEYS.USER),
                isTwoFactorEnabled: false,
            });
            props.onHide();
            props.closeSidebar();
            appContext.setDisappearingFlashMessage({
                message: constants.TWO_FACTOR_DISABLE_SUCCESS,
                type: FLASH_MESSAGE_TYPE.INFO,
            });
        } catch (e) {
            appContext.setDisappearingFlashMessage({
                message: constants.TWO_FACTOR_DISABLE_FAILED,
                type: FLASH_MESSAGE_TYPE.DANGER,
            });
        }
    };
    const warnTwoFactorReconfigure = async () => {
        props.setDialogMessage({
            title: constants.UPDATE_TWO_FACTOR,
            staticBackdrop: true,
            content: constants.UPDATE_TWO_FACTOR_MESSAGE,
            close: { text: constants.CANCEL },
            proceed: {
                variant: 'success',
                text: constants.UPDATE,
                action: reconfigureTwoFactor,
            },
        });
    };
    const reconfigureTwoFactor = async () => {
        router.push(PAGES.TWO_FACTOR_SETUP);
    };
    return (
        <MessageDialog
            show={props.show}
            onHide={props.onHide}
            attributes={{
                title: constants.TWO_FACTOR_AUTHENTICATION,
                staticBackdrop: true,
            }}>
            <div
                {...(!isTwoFactorEnabled
                    ? { style: { padding: '10px 10px 30px 10px' } }
                    : { style: { padding: '10px' } })}>
                {isTwoFactorEnabled ? (
                    <>
                        <Row>
                            <Label>{constants.UPDATE_TWO_FACTOR_HINT}</Label>
                            <Value>
                                <Button
                                    variant={'outline-success'}
                                    onClick={warnTwoFactorReconfigure}
                                    style={{ width: '100%' }}>
                                    {constants.RECONFIGURE}
                                </Button>
                            </Value>
                        </Row>
                        <Row>
                            <Label>{constants.DISABLE_TWO_FACTOR_HINT} </Label>
                            <Value>
                                <Button
                                    variant={'outline-danger'}
                                    onClick={warnTwoFactorDisable}
                                    style={{ width: '100%' }}>
                                    {constants.DISABLE}
                                </Button>
                            </Value>
                        </Row>
                    </>
                ) : (
                    <DeadCenter>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="36px"
                            viewBox="0 0 24 24"
                            width="36px"
                            fill="#000000">
                            <g fill="none">
                                <path d="M0 0h24v24H0V0z" />
                                <path d="M0 0h24v24H0V0z" opacity=".87" />
                            </g>
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
                        </svg>
                        <p />
                        <p>{constants.TWO_FACTOR_INFO}</p>
                        <div style={{ height: '10px' }} />
                        <Button
                            variant="outline-success"
                            onClick={() => router.push(PAGES.TWO_FACTOR_SETUP)}>
                            {constants.ENABLE_TWO_FACTOR}
                        </Button>
                    </DeadCenter>
                )}
            </div>
        </MessageDialog>
    );
}
export default TwoFactorModal;
