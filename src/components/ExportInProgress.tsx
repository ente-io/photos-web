import React from 'react';
import { ExportProgress } from 'types/export';
import { Box, DialogActions, DialogContent, styled } from '@mui/material';
import constants from 'utils/strings/constants';
import { ExportStage } from 'constants/export';
import VerticallyCentered, { FlexWrapper } from './Container';
import { ProgressBar } from 'react-bootstrap';
import EnteButton from './EnteButton';

export const ComfySpan = styled('span')`
    word-spacing: 1rem;
    color: #ddd;
`;

interface Props {
    exportStage: ExportStage;
    exportProgress: ExportProgress;
    resumeExport: () => void;
    cancelExport: () => void;
    pauseExport: () => void;
}

export default function ExportInProgress(props: Props) {
    return (
        <>
            <DialogContent>
                <VerticallyCentered>
                    <Box mb={1.5}>
                        <ComfySpan>
                            {' '}
                            {props.exportProgress.current} /{' '}
                            {props.exportProgress.total}{' '}
                        </ComfySpan>{' '}
                        <span>
                            {' '}
                            files exported{' '}
                            {props.exportStage === ExportStage.PAUSED &&
                                `(paused)`}
                        </span>
                    </Box>
                    <FlexWrapper px={1}>
                        <ProgressBar
                            style={{ width: '100%' }}
                            now={Math.round(
                                (props.exportProgress.current * 100) /
                                    props.exportProgress.total
                            )}
                            animated={
                                !(props.exportStage === ExportStage.PAUSED)
                            }
                            variant="upload-progress-bar"
                        />
                    </FlexWrapper>
                </VerticallyCentered>
            </DialogContent>
            <DialogActions>
                {props.exportStage === ExportStage.PAUSED ? (
                    <EnteButton
                        size="large"
                        onClick={props.resumeExport}
                        variant="neutral">
                        {constants.RESUME}
                    </EnteButton>
                ) : (
                    <EnteButton
                        size="large"
                        onClick={props.pauseExport}
                        variant="neutral">
                        {constants.PAUSE}
                    </EnteButton>
                )}
                <EnteButton
                    size="large"
                    onClick={props.cancelExport}
                    variant="secondary">
                    {constants.CANCEL}
                </EnteButton>
            </DialogActions>
        </>
    );
}
