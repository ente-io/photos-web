import isElectron from 'is-electron';
import React, { useEffect, useState, useContext } from 'react';
import exportService from 'services/exportService';
import {
    ExportProgress,
    ExportRecord,
    ExportSettings,
    FileExportStats,
} from 'types/export';
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    Divider,
    styled,
    Switch,
    Tooltip,
    Typography,
} from '@mui/material';
import { logError } from 'utils/sentry';
import { getData, LS_KEYS, setData } from 'utils/storage/localStorage';
import { SpaceBetweenFlex, VerticallyCenteredFlex } from './Container';
import ExportFinished from './ExportFinished';
import ExportInit from './ExportInit';
import ExportInProgress from './ExportInProgress';
import FolderIcon from '@mui/icons-material/Folder';
import { ExportStage } from 'constants/export';
import DialogTitleWithCloseButton from './DialogBox/TitleWithCloseButton';
import MoreHoriz from '@mui/icons-material/MoreHoriz';
import OverflowMenu from './OverflowMenu/menu';
import { OverflowMenuOption } from './OverflowMenu/option';
import { AppContext } from 'pages/_app';
import { getExportDirectoryDoesNotExistMessage } from 'utils/ui';
import { t } from 'i18next';
import LinkButton from './pages/gallery/LinkButton';
import { CustomError } from 'utils/error';

const ExportFolderPathContainer = styled(LinkButton)`
    width: 262px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    /* Beginning of string */
    direction: rtl;
    text-align: left;
`;

interface Props {
    show: boolean;
    onHide: () => void;
}
export default function ExportModal(props: Props) {
    const appContext = useContext(AppContext);
    const [exportStage, setExportStage] = useState(ExportStage.INIT);
    const [exportFolder, setExportFolder] = useState('');
    const [continuousExport, setContinuousExport] = useState(false);
    const [exportProgress, setExportProgress] = useState<ExportProgress>({
        success: 0,
        failed: 0,
        total: 0,
    });
    const [fileExportStats, setFileExportStats] = useState<FileExportStats>({
        totalCount: 0,
        pendingCount: 0,
    });
    const [lastExportTime, setLastExportTime] = useState(0);

    // ====================
    // SIDE EFFECTS
    // ====================
    useEffect(() => {
        if (!isElectron()) {
            return;
        }
        const main = async () => {
            try {
                exportService.setUIUpdaters({
                    updateExportStage: updateExportStage,
                    updateExportProgress: setExportProgress,
                    updateFileExportStats: setFileExportStats,
                    updateLastExportTime: updateExportTime,
                });
                const exportSettings: ExportSettings = getData(LS_KEYS.EXPORT);
                setExportFolder(exportSettings?.folder);
                setContinuousExport(exportSettings?.continuousExport);
                const exportRecord = await syncExportRecord(exportFolder);
                if (exportRecord?.stage === ExportStage.INPROGRESS) {
                    startExport();
                }
                if (exportSettings?.continuousExport) {
                    exportService.enableContinuousExport();
                }
            } catch (e) {
                logError(e, 'export on mount useEffect failed');
            }
        };
        void main();
    }, []);

    useEffect(() => {
        if (!props.show) {
            return;
        }
        void syncFileCounts();
    }, [props.show]);

    // =============
    // STATE UPDATERS
    // ==============
    const updateExportFolder = (newFolder: string) => {
        const exportSettings: ExportSettings = getData(LS_KEYS.EXPORT);
        const updatedExportSettings: ExportSettings = {
            ...exportSettings,
            folder: newFolder,
        };
        setData(LS_KEYS.EXPORT, updatedExportSettings);
        setExportFolder(newFolder);
    };

    const updateContinuousExport = (updatedContinuousExport: boolean) => {
        const exportSettings: ExportSettings = getData(LS_KEYS.EXPORT);
        const updatedExportSettings: ExportSettings = {
            ...exportSettings,
            continuousExport: updatedContinuousExport,
        };
        setData(LS_KEYS.EXPORT, updatedExportSettings);
        setContinuousExport(updatedContinuousExport);
    };

    const updateExportStage = async (newStage: ExportStage) => {
        setExportStage(newStage);
        await exportService.updateExportRecord({ stage: newStage });
    };

    const updateExportTime = async (newTime: number) => {
        setLastExportTime(newTime);
        await exportService.updateExportRecord({
            lastAttemptTimestamp: newTime,
        });
    };

    // ======================
    // HELPER FUNCTIONS
    // =======================

    const onExportFolderChange = async (newFolder: string) => {
        try {
            updateExportFolder(newFolder);
            syncExportRecord(newFolder);
        } catch (e) {
            logError(e, 'onExportChange failed');
            throw e;
        }
    };

    const verifyExportFolderExists = () => {
        const exportFolder = getData(LS_KEYS.EXPORT)?.folder;
        const exportFolderExists = exportService.exists(exportFolder);
        if (!exportFolderExists) {
            appContext.setDialogMessage(
                getExportDirectoryDoesNotExistMessage()
            );
            throw Error(CustomError.EXPORT_FOLDER_DOES_NOT_EXIST);
        }
    };

    const syncExportRecord = async (
        exportFolder: string
    ): Promise<ExportRecord> => {
        try {
            const exportRecord = await exportService.getExportRecord(
                exportFolder
            );
            if (!exportRecord) {
                setExportStage(ExportStage.INIT);
                return null;
            }
            setExportStage(exportRecord.stage);
            setLastExportTime(exportRecord.lastAttemptTimestamp);
            void syncFileCounts();
            return exportRecord;
        } catch (e) {
            logError(e, 'syncExportRecord failed');
            throw e;
        }
    };

    const syncFileCounts = async () => {
        try {
            const fileExportStats = await exportService.getFileExportStats();
            setFileExportStats(fileExportStats);
        } catch (e) {
            logError(e, 'error updating file counts');
        }
    };

    // =============
    // UI functions
    // =============

    const handleChangeExportDirectoryClick = () => {
        void exportService.changeExportDirectory(onExportFolderChange);
    };

    const handleOpenExportDirectoryClick = () => {
        void exportService.openExportDirectory(exportFolder);
    };

    const toggleContinuousExport = () => {
        try {
            const newContinuousExport = !continuousExport;
            if (newContinuousExport) {
                exportService.enableContinuousExport();
            } else {
                exportService.disableContinuousExport();
            }
            updateContinuousExport(newContinuousExport);
        } catch (e) {
            logError(e, 'onContinuousExportChange failed');
        }
    };

    const startExport = () => {
        try {
            verifyExportFolderExists();
            exportService.runExport();
        } catch (e) {
            if (e.message !== CustomError.EXPORT_FOLDER_DOES_NOT_EXIST) {
                logError(e, 'startExport failed');
            }
        }
    };

    const stopExport = () => {
        void exportService.stopRunningExport();
    };

    return (
        <Dialog open={props.show} onClose={props.onHide} maxWidth="xs">
            <DialogTitleWithCloseButton onClose={props.onHide}>
                {t('EXPORT_DATA')}
            </DialogTitleWithCloseButton>
            <DialogContent>
                <ExportDirectory
                    exportFolder={exportFolder}
                    changeExportDirectory={handleChangeExportDirectoryClick}
                    exportStage={exportStage}
                    openExportDirectory={handleOpenExportDirectoryClick}
                />
                <ContinuousExport
                    continuousExport={continuousExport}
                    toggleContinuousExport={toggleContinuousExport}
                />
                <SpaceBetweenFlex minHeight={'48px'} pr={'16px'}>
                    <Typography color="text.secondary">
                        {t('TOTAL_ITEMS')}
                    </Typography>
                    <Typography color="text.secondary">
                        {fileExportStats.totalCount}
                    </Typography>
                </SpaceBetweenFlex>
            </DialogContent>
            <Divider />
            <ExportDynamicContent
                exportStage={exportStage}
                startExport={startExport}
                stopExport={stopExport}
                onHide={props.onHide}
                lastExportTime={lastExportTime}
                pendingFileCount={fileExportStats.pendingCount}
                exportProgress={exportProgress}
            />
        </Dialog>
    );
}

function ExportDirectory({
    exportFolder,
    changeExportDirectory,
    exportStage,
    openExportDirectory,
}) {
    return (
        <SpaceBetweenFlex minHeight={'48px'}>
            <Typography color="text.secondary" mr={'16px'}>
                {t('DESTINATION')}
            </Typography>
            <>
                {!exportFolder ? (
                    <Button color={'accent'} onClick={changeExportDirectory}>
                        {t('SELECT_FOLDER')}
                    </Button>
                ) : (
                    <VerticallyCenteredFlex>
                        <ExportFolderPathContainer
                            onClick={openExportDirectory}>
                            <Tooltip title={exportFolder}>
                                <span>{exportFolder}</span>
                            </Tooltip>
                        </ExportFolderPathContainer>

                        {exportStage === ExportStage.FINISHED ||
                        exportStage === ExportStage.INIT ? (
                            <ExportDirectoryOption
                                changeExportDirectory={changeExportDirectory}
                            />
                        ) : (
                            <Box sx={{ width: '16px' }} />
                        )}
                    </VerticallyCenteredFlex>
                )}
            </>
        </SpaceBetweenFlex>
    );
}

function ExportDirectoryOption({ changeExportDirectory }) {
    return (
        <OverflowMenu
            triggerButtonProps={{
                sx: {
                    ml: 1,
                },
            }}
            ariaControls={'export-option'}
            triggerButtonIcon={<MoreHoriz />}>
            <OverflowMenuOption
                onClick={changeExportDirectory}
                startIcon={<FolderIcon />}>
                {t('CHANGE_FOLDER')}
            </OverflowMenuOption>
        </OverflowMenu>
    );
}

function ContinuousExport({ continuousExport, toggleContinuousExport }) {
    return (
        <SpaceBetweenFlex minHeight={'48px'}>
            <Typography color="text.secondary">
                {t('CONTINUOUS_EXPORT')}
            </Typography>
            <Box>
                <Switch
                    color="accent"
                    checked={continuousExport}
                    onChange={toggleContinuousExport}
                />
            </Box>
        </SpaceBetweenFlex>
    );
}

const ExportDynamicContent = ({
    exportStage,
    startExport,
    stopExport,
    onHide,
    lastExportTime,
    pendingFileCount,
    exportProgress,
}: {
    exportStage: ExportStage;
    startExport: () => void;
    stopExport: () => void;
    onHide: () => void;
    lastExportTime: number;
    pendingFileCount: number;
    exportProgress: ExportProgress;
}) => {
    switch (exportStage) {
        case ExportStage.INIT:
            return <ExportInit startExport={startExport} />;

        case ExportStage.INPROGRESS:
            return (
                <ExportInProgress
                    exportStage={exportStage}
                    exportProgress={exportProgress}
                    stopExport={stopExport}
                    closeExportDialog={onHide}
                />
            );
        case ExportStage.FINISHED:
            return (
                <ExportFinished
                    onHide={onHide}
                    lastExportTime={lastExportTime}
                    pendingFileCount={pendingFileCount}
                    startExport={startExport}
                />
            );

        default:
            return <></>;
    }
};
