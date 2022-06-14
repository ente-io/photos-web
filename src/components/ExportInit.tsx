import { Button } from '@mui/material';
import { DeadCenter } from 'pages/gallery';
import React from 'react';
import constants from 'utils/strings/constants';

interface Props {
    show: boolean;
    onHide: () => void;
    updateExportFolder: (newFolder: string) => void;
    exportFolder: string;
    startExport: () => void;
    exportSize: string;
    selectExportDirectory: () => void;
}
export default function ExportInit(props: Props) {
    return (
        <>
            <DeadCenter>
                <Button
                    color="accent"
                    size="large"
                    style={{
                        padding: '6px 3em',
                        margin: '0 20px',
                        marginBottom: '20px',
                        flex: 1,
                        whiteSpace: 'nowrap',
                    }}
                    onClick={props.startExport}>
                    {constants.START}
                </Button>
            </DeadCenter>
        </>
    );
}
