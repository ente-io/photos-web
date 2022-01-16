import isElectron from 'is-electron';
import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import exportService from 'services/exportService';
import { ExportProgress, ExportStats } from 'types/export';
import { getLocalFiles } from 'services/fileService';
import { User } from 'types/user';
import styled from 'styled-components';
import { sleep } from 'utils/common';
import { getExportRecordFileUID } from 'utils/export';
import { logError } from 'utils/sentry';
import { getData, LS_KEYS, setData } from 'utils/storage/localStorage';
import constants from 'utils/strings/constants';
import { Label, Row, Value } from './Container';
import ExportFinished from './ExportFinished';
import ExportInit from './ExportInit';
import ExportInProgress from './ExportInProgress';
import FolderIcon from './icons/FolderIcon';
import InProgressIcon from './icons/InProgressIcon';
import MessageDialog from './MessageDialog';
import { IconWithMessage } from './pages/gallery/SelectedFileOptions';
import { ExportStage, ExportType } from 'constants/export';

const FolderIconWrapper = styled.div`
    width: 15%;
    margin-left: 10px;
    cursor: pointer;
    padding: 3px;
    border: 1px solid #444;
    border-radius: 15%;
    &:hover {
        background-color: #444;
    }
`;

const ExportFolderPathContainer = styled.span`
    cursor: pointer;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 200px;
    &:hover {
        color: #51cd7c;
        text-decoration: underline;
    }

    /* Beginning of string */
    direction: rtl;
    text-align: left;
`;

interface Props {
    show: boolean;
    onHide: () => void;
    usage: string;
}
export default function ExportModal(props: Props) {
    const [exportStage, setExportStage] = useState(ExportStage.INIT);
    const [exportFolder, setExportFolder] = useState('');
    const [exportSize, setExportSize] = useState('');
    const [exportProgress, setExportProgress] = useState<ExportProgress>({
        current: 0,
        total: 0,
    });
    const [exportStats, setExportStats] = useState<ExportStats>({
        failed: 0,
        success: 0,
    });
    const [lastExportTime, setLastExportTime] = useState(0);

    // ====================
    // SIDE EFFECTS
    // ====================
    useEffect(() => {
        if (!isElectron()) {
            return;
        }
        setExportFolder(getData(LS_KEYS.EXPORT)?.folder);

        exportService.ElectronAPIs.registerStopExportListener(stopExport);
        exportService.ElectronAPIs.registerPauseExportListener(pauseExport);
        exportService.ElectronAPIs.registerResumeExportListener(resumeExport);
        exportService.ElectronAPIs.registerRetryFailedExportListener(
            retryFailedExport
        );
    }, []);

    useEffect(() => {
        if (!exportFolder) {
            return;
        }
        const main = async () => {
            const exportInfo = await exportService.getExportRecord();
            setExportStage(exportInfo?.stage ?? ExportStage.INIT);
            setLastExportTime(exportInfo?.lastAttemptTimestamp);
            setExportProgress(exportInfo?.progress ?? { current: 0, total: 0 });
            setExportStats({
                success: exportInfo?.exportedFiles?.length ?? 0,
                failed: exportInfo?.failedFiles?.length ?? 0,
            });
            if (exportInfo?.stage === ExportStage.INPROGRESS) {
                resumeExport();
            }
        };
        main();
    }, [exportFolder]);

    useEffect(() => {
        if (!props.show) {
            return;
        }
        const main = async () => {
            const user: User = getData(LS_KEYS.USER);
            if (exportStage === ExportStage.FINISHED) {
                try {
                    const localFiles = await getLocalFiles();
                    const userPersonalFiles = localFiles.filter(
                        (file) => file.ownerID === user?.id
                    );
                    const exportRecord = await exportService.getExportRecord();
                    const exportedFileCnt = exportRecord.exportedFiles?.length;
                    const failedFilesCnt = exportRecord.failedFiles?.length;
                    const syncedFilesCnt = userPersonalFiles.length;
                    if (syncedFilesCnt > exportedFileCnt + failedFilesCnt) {
                        updateExportProgress({
                            current: exportedFileCnt + failedFilesCnt,
                            total: syncedFilesCnt,
                        });
                        const exportFileUIDs = new Set([
                            ...exportRecord.exportedFiles,
                            ...exportRecord.failedFiles,
                        ]);
                        const unExportedFiles = userPersonalFiles.filter(
                            (file) =>
                                !exportFileUIDs.has(
                                    getExportRecordFileUID(file)
                                )
                        );
                        exportService.addFilesQueuedRecord(
                            exportFolder,
                            unExportedFiles
                        );
                        updateExportStage(ExportStage.PAUSED);
                    }
                } catch (e) {
                    setExportStage(ExportStage.INIT);
                    logError(e, 'error while updating exportModal on reopen');
                }
            }
        };
        main();
    }, [props.show]);

    useEffect(() => {
        setExportSize(props.usage);
    }, [props.usage]);

    // =============
    // STATE UPDATERS
    // ==============
    const updateExportFolder = (newFolder: string) => {
        setExportFolder(newFolder);
        setData(LS_KEYS.EXPORT, { folder: newFolder });
    };

    const updateExportStage = (newStage: ExportStage) => {
        setExportStage(newStage);
        exportService.updateExportRecord({ stage: newStage });
    };

    const updateExportTime = (newTime: number) => {
        setLastExportTime(newTime);
        exportService.updateExportRecord({ lastAttemptTimestamp: newTime });
    };

    const updateExportProgress = (newProgress: ExportProgress) => {
        setExportProgress(newProgress);
        exportService.updateExportRecord({ progress: newProgress });
    };

    // ======================
    // HELPER FUNCTIONS
    // =========================

    const preExportRun = async () => {
        const exportFolder = getData(LS_KEYS.EXPORT)?.folder;
        if (!exportFolder) {
            const folderSelected = await selectExportDirectory();
            if (!folderSelected) {
                // no-op as select folder aborted
                return;
            }
        }
        updateExportStage(ExportStage.INPROGRESS);
        await sleep(100);
    };
    const postExportRun = async (exportResult?: { paused?: boolean }) => {
        if (!exportResult?.paused) {
            updateExportStage(ExportStage.FINISHED);
            await sleep(100);
            updateExportTime(Date.now());
            syncExportStatsWithReport();
        }
    };
    const startExport = async () => {
        await preExportRun();
        updateExportProgress({ current: 0, total: 0 });
        const exportResult = await exportService.exportFiles(
            updateExportProgress,
            ExportType.NEW
        );
        await postExportRun(exportResult);
    };

    const stopExport = async () => {
        exportService.stopRunningExport();
        postExportRun();
    };

    const pauseExport = () => {
        updateExportStage(ExportStage.PAUSED);
        exportService.pauseRunningExport();
        postExportRun({ paused: true });
    };

    const resumeExport = async () => {
        const exportRecord = await exportService.getExportRecord();
        await preExportRun();

        const pausedStageProgress = exportRecord.progress;
        setExportProgress(pausedStageProgress);

        const updateExportStatsWithOffset = (progress: ExportProgress) =>
            updateExportProgress({
                current: pausedStageProgress.current + progress.current,
                total: pausedStageProgress.current + progress.total,
            });
        const exportResult = await exportService.exportFiles(
            updateExportStatsWithOffset,
            ExportType.PENDING
        );

        await postExportRun(exportResult);
    };

    const retryFailedExport = async () => {
        await preExportRun();
        updateExportProgress({ current: 0, total: exportStats.failed });

        const exportResult = await exportService.exportFiles(
            updateExportProgress,
            ExportType.RETRY_FAILED
        );
        await postExportRun(exportResult);
    };

    const syncExportStatsWithReport = async () => {
        const exportRecord = await exportService.getExportRecord();
        const failed = exportRecord?.failedFiles?.length ?? 0;
        const success = exportRecord?.exportedFiles?.length ?? 0;
        setExportStats({ failed, success });
    };

    const selectExportDirectory = async () => {
        const newFolder = await exportService.selectExportDirectory();
        if (newFolder) {
            updateExportFolder(newFolder);
            return true;
        } else {
            return false;
        }
    };

    const ExportDynamicState = () => {
        switch (exportStage) {
            case ExportStage.INIT:
                return (
                    <ExportInit
                        {...props}
                        exportFolder={exportFolder}
                        exportSize={exportSize}
                        updateExportFolder={updateExportFolder}
                        startExport={startExport}
                        selectExportDirectory={selectExportDirectory}
                    />
                );
            case ExportStage.INPROGRESS:
            case ExportStage.PAUSED:
                return (
                    <ExportInProgress
                        {...props}
                        exportFolder={exportFolder}
                        exportSize={exportSize}
                        exportStage={exportStage}
                        exportProgress={exportProgress}
                        resumeExport={resumeExport}
                        cancelExport={stopExport}
                        pauseExport={pauseExport}
                    />
                );
            case ExportStage.FINISHED:
                return (
                    <ExportFinished
                        {...props}
                        exportFolder={exportFolder}
                        exportSize={exportSize}
                        updateExportFolder={updateExportFolder}
                        lastExportTime={lastExportTime}
                        exportStats={exportStats}
                        exportFiles={startExport}
                        retryFailed={retryFailedExport}
                    />
                );

            default:
                return <></>;
        }
    };

    return (
        <MessageDialog
            show={props.show}
            onHide={props.onHide}
            attributes={{
                title: constants.EXPORT_DATA,
            }}>
            <div
                style={{
                    borderBottom: '1px solid #444',
                    marginBottom: '20px',
                    padding: '0 5%',
                    width: '450px',
                }}>
                <Row>
                    <Label width="40%">{constants.DESTINATION}</Label>
                    <Value width="60%">
                        {!exportFolder ? (
                            <Button
                                variant={'outline-success'}
                                size={'sm'}
                                onClick={selectExportDirectory}>
                                {constants.SELECT_FOLDER}
                            </Button>
                        ) : (
                            <>
                                <IconWithMessage message={exportFolder}>
                                    <ExportFolderPathContainer>
                                        {exportFolder}
                                    </ExportFolderPathContainer>
                                </IconWithMessage>
                                {(exportStage === ExportStage.FINISHED ||
                                    exportStage === ExportStage.INIT) && (
                                    <FolderIconWrapper
                                        onClick={selectExportDirectory}>
                                        <FolderIcon />
                                    </FolderIconWrapper>
                                )}
                            </>
                        )}
                    </Value>
                </Row>
                <Row>
                    <Label width="40%">{constants.TOTAL_EXPORT_SIZE} </Label>
                    <Value width="60%">
                        {exportSize ? `${exportSize}` : <InProgressIcon />}
                    </Value>
                </Row>
            </div>
            <ExportDynamicState />
        </MessageDialog>
    );
}
