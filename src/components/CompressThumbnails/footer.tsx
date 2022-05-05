import React from 'react';
import constants from 'utils/strings/constants';
import { COMPRESSION_STATE } from '.';
import { Button, DialogActions } from '@mui/material';

export default function CompressThumbnailsFooter({
    compressionState,
    startCompression,
    compressLater,
    ...props
}) {
    return (
        <DialogActions>
            {compressionState === COMPRESSION_STATE.NOT_STARTED ||
            compressionState === COMPRESSION_STATE.COMPRESS_LATER ? (
                <Button
                    variant="contained"
                    color={'secondary'}
                    onClick={compressLater}>
                    {constants.COMPRESS_THUMBNAIL_LATER}
                </Button>
            ) : (
                <Button
                    variant="contained"
                    color={'secondary'}
                    onClick={props.hide}>
                    {constants.CLOSE}
                </Button>
            )}
            {(compressionState === COMPRESSION_STATE.NOT_STARTED ||
                compressionState === COMPRESSION_STATE.COMPRESS_LATER ||
                compressionState ===
                    COMPRESSION_STATE.COMPLETED_WITH_ERRORS) && (
                <Button
                    variant="contained"
                    color={'success'}
                    onClick={startCompression}>
                    {constants.COMPRESS_THUMBNAIL}
                </Button>
            )}
        </DialogActions>
    );
}
