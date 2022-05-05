import React from 'react';
import { COMPRESSION_STATE } from '.';
import constants from 'utils/strings/constants';

export function CompressThumbnailsMessage(props: {
    compressionState: COMPRESSION_STATE;
}) {
    switch (props.compressionState) {
        case COMPRESSION_STATE.NOT_STARTED:
        case COMPRESSION_STATE.COMPRESS_LATER:
            return constants.COMPRESS_THUMBNAIL_NOT_STARTED();

        case COMPRESSION_STATE.COMPLETED:
            return constants.COMPRESS_THUMBNAIL_COMPLETED();
        case COMPRESSION_STATE.NOOP:
            return constants.COMPRESS_THUMBNAIL_NOOP();
        case COMPRESSION_STATE.COMPLETED_WITH_ERRORS:
            return constants.COMPRESS_THUMBNAIL_COMPLETED_WITH_ERROR();
        default:
            return <></>;
    }
}
