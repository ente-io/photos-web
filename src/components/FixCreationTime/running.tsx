import constants from 'utils/strings/constants';
import { ComfySpan } from 'components/ExportInProgress';
import React from 'react';
import { LinearProgress } from '@mui/material';

export default function FixCreationTimeRunning({ progressTracker }) {
    return (
        <>
            <div style={{ marginBottom: '10px' }}>
                <ComfySpan>
                    {' '}
                    {progressTracker.current} / {progressTracker.total}{' '}
                </ComfySpan>{' '}
                <span style={{ marginLeft: '10px' }}>
                    {' '}
                    {constants.CREATION_TIME_UPDATED}
                </span>
            </div>
            <div
                style={{
                    width: '100%',
                    marginTop: '10px',
                    marginBottom: '20px',
                }}>
                <LinearProgress
                    value={Math.round(
                        (progressTracker.current * 100) / progressTracker.total
                    )}
                />
            </div>
        </>
    );
}
