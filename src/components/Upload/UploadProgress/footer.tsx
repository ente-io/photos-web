import { DialogActions } from '@mui/material';
import { UPLOAD_STAGES, UPLOAD_RESULT } from 'constants/upload';
import React, { useContext } from 'react';
import constants from 'utils/strings/constants';
import UploadProgressContext from 'contexts/uploadProgress';
import EnteButton from 'components/EnteButton';

export function UploadProgressFooter() {
    const { uploadStage, finishedUploads, retryFailed, onClose } = useContext(
        UploadProgressContext
    );

    return (
        <DialogActions>
            {uploadStage === UPLOAD_STAGES.FINISH &&
                (finishedUploads?.get(UPLOAD_RESULT.FAILED)?.length > 0 ||
                finishedUploads?.get(UPLOAD_RESULT.BLOCKED)?.length > 0 ? (
                    <EnteButton size="large" onClick={retryFailed}>
                        {constants.RETRY_FAILED}
                    </EnteButton>
                ) : (
                    <EnteButton size="large" onClick={onClose}>
                        {constants.CLOSE}
                    </EnteButton>
                ))}
        </DialogActions>
    );
}
