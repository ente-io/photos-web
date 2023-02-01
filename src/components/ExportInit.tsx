import { DialogActions, DialogContent } from '@mui/material';
import React from 'react';
import constants from 'utils/strings/constants';
import EnteButton from './EnteButton';

interface Props {
    startExport: () => void;
}
export default function ExportInit({ startExport }: Props) {
    return (
        <DialogContent>
            <DialogActions>
                <EnteButton
                    size="large"
                    variant="primary"
                    onClick={startExport}>
                    {constants.START}
                </EnteButton>
            </DialogActions>
        </DialogContent>
    );
}
