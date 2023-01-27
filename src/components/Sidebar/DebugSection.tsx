import { AppContext } from 'pages/_app';
import React, { useContext, useEffect, useState } from 'react';
import { downloadAsFile } from 'utils/file';
import constants from 'utils/strings/constants';
import { addLogLine, getDebugLogs } from 'utils/logging';
import SidebarButton from './Button';
import isElectron from 'is-electron';
import ElectronService from 'services/electron/common';
import Typography from '@mui/material/Typography';
import { isInternalUser } from 'utils/user';
import { testUpload } from '../../../tests/upload.test';
import {
    testZipFileReading,
    testZipWithRootFileReadingTest,
} from '../../../tests/zip-file-reading.test';
import { useLocalState } from 'hooks/useLocalState';
import { LS_KEYS } from 'utils/storage/localStorage';
import Switch from '@mui/material/Switch';
import { SpaceBetweenFlex } from 'components/Container';

export default function DebugSection() {
    const appContext = useContext(AppContext);
    const [appVersion, setAppVersion] = useState<string>(null);
    const [disableUIUpdatesDuringUpload, setDisableUIUpdatesDuringUpload] =
        useLocalState<boolean>(LS_KEYS.DISABLE_UI_UPDATES_DURING_UPLOAD, false);

    const switchDisableUIUpdatesDuringUpload = () => {
        setDisableUIUpdatesDuringUpload(!disableUIUpdatesDuringUpload);
    };

    useEffect(() => {
        const main = async () => {
            if (isElectron()) {
                const appVersion = await ElectronService.getAppVersion();
                setAppVersion(appVersion);
            }
        };
        main();
    });

    const confirmLogDownload = () =>
        appContext.setDialogMessage({
            title: constants.DOWNLOAD_LOGS,
            content: constants.DOWNLOAD_LOGS_MESSAGE(),
            proceed: {
                text: constants.DOWNLOAD,
                variant: 'accent',
                action: downloadDebugLogs,
            },
            close: {
                text: constants.CANCEL,
            },
        });

    const downloadDebugLogs = () => {
        addLogLine('exporting logs');
        if (isElectron()) {
            ElectronService.openLogDirectory();
        } else {
            const logs = getDebugLogs();

            downloadAsFile(`debug_logs_${Date.now()}.txt`, logs);
        }
    };

    return (
        <>
            <SidebarButton
                onClick={confirmLogDownload}
                typographyVariant="caption"
                sx={{ fontWeight: 'normal', color: 'text.secondary' }}>
                {constants.DOWNLOAD_UPLOAD_LOGS}
            </SidebarButton>
            {appVersion && (
                <Typography p={1.5} color="text.secondary" variant="caption">
                    {appVersion}
                </Typography>
            )}
            {isInternalUser() && (
                <>
                    <SidebarButton onClick={testUpload}>
                        Test Upload
                    </SidebarButton>
                    <SidebarButton onClick={testZipFileReading}>
                        Test Zip file reading
                    </SidebarButton>
                    <SidebarButton onClick={testZipWithRootFileReadingTest}>
                        Zip with Root file Test
                    </SidebarButton>
                </>
            )}
            <SpaceBetweenFlex sx={{ px: 1.5 }}>
                {constants.UI_UPDATES_DURING_UPLOAD}
                <Switch
                    color="accent"
                    {...{ inputProps: { 'aria-label': 'Switch demo' } }}
                    checked={disableUIUpdatesDuringUpload}
                    onChange={switchDisableUIUpdatesDuringUpload}
                />
            </SpaceBetweenFlex>
        </>
    );
}
