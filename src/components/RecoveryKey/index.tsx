import React, { useContext, useEffect, useState } from 'react';
import { downloadAsFile } from 'utils/file';
import { getRecoveryKey } from 'utils/crypto';
import constants from 'utils/strings/constants';
import CodeBlock from '../CodeBlock';
import {
    Dialog,
    DialogActions,
    DialogContent,
    Typography,
} from '@mui/material';
import * as bip39 from 'bip39';
import { DashedBorderWrapper } from './styledComponents';
import { AppContext } from 'pages/_app';
import DialogTitleWithCloseButton from 'components/DialogBox/TitleWithCloseButton';
import EnteButton from 'components/EnteButton';

// mobile client library only supports english.
bip39.setDefaultWordlist('english');

const RECOVERY_KEY_FILE_NAME = 'ente-recovery-key.txt';

interface Props {
    show: boolean;
    onHide: () => void;
    somethingWentWrong: any;
}

function RecoveryKey({ somethingWentWrong, ...props }: Props) {
    const appContext = useContext(AppContext);
    const [recoveryKey, setRecoveryKey] = useState(null);

    useEffect(() => {
        if (!props.show) {
            return;
        }
        const main = async () => {
            try {
                const recoveryKey = await getRecoveryKey();
                setRecoveryKey(bip39.entropyToMnemonic(recoveryKey));
            } catch (e) {
                somethingWentWrong();
                props.onHide();
            }
        };
        main();
    }, [props.show]);

    function onSaveClick() {
        downloadAsFile(RECOVERY_KEY_FILE_NAME, recoveryKey);
        props.onHide();
    }

    return (
        <Dialog
            fullScreen={appContext.isMobile}
            open={props.show}
            onClose={props.onHide}
            maxWidth="xs">
            <DialogTitleWithCloseButton onClose={props.onHide}>
                {constants.RECOVERY_KEY}
            </DialogTitleWithCloseButton>
            <DialogContent>
                <Typography mb={3}>
                    {constants.RECOVERY_KEY_DESCRIPTION}
                </Typography>
                <DashedBorderWrapper>
                    <CodeBlock code={recoveryKey} />
                    <Typography m={2}>
                        {constants.KEY_NOT_STORED_DISCLAIMER}
                    </Typography>
                </DashedBorderWrapper>
            </DialogContent>
            <DialogActions>
                <EnteButton
                    variant="secondary"
                    size="large"
                    onClick={props.onHide}>
                    {constants.SAVE_LATER}
                </EnteButton>
                <EnteButton
                    variant="neutral"
                    size="large"
                    onClick={onSaveClick}>
                    {constants.SAVE}
                </EnteButton>
            </DialogActions>
        </Dialog>
    );
}
export default RecoveryKey;
