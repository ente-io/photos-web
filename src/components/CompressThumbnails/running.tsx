import React from 'react';
import constants from 'utils/strings/constants';
import { ComfySpan } from 'components/ExportInProgress';
import { ProgressBar } from 'react-bootstrap';

export default function CompressionRunning({ progressTracker }) {
    return (
        <>
            <div style={{ marginBottom: '10px' }}>
                <ComfySpan>/ {progressTracker.total} </ComfySpan>
                <span style={{ marginLeft: '10px' }}>
                    {constants.THUMBNAIL_REPLACED}
                </span>
            </div>
            <div
                style={{
                    width: '100%',
                    marginTop: '10px',
                    marginBottom: '20px',
                }}>
                <ProgressBar
                    now={Math.round(
                        (progressTracker.current * 100) / progressTracker.total
                    )}
                    animated={true}
                    variant="upload-progress-bar"
                />
            </div>
        </>
    );
}
