import isElectron from 'is-electron';
import React, { useEffect, useState, useContext } from 'react';
import exportService from 'services/export';
import { ExportProgress, ExportSettings } from 'types/export';
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
import { addLogLine } from 'utils/logging';
import { EnteFile } from 'types/file';

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
    collectionNameMap: Map<number, string>;
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
    const [pendingExports, setPendingExports] = useState<EnteFile[]>([]);
    const [lastExportTime, setLastExportTime] = useState(0);

    // ====================
    // SIDE EFFECTS
    // ====================
    useEffect(() => {
        if (!isElectron()) {
            return;
        }
        try {
            exportService.setUIUpdaters({
                setExportStage,
                setExportProgress,
                setLastExportTime,
                setPendingExports,
            });
            const exportSettings: ExportSettings =
                exportService.getExportSettings();
            setExportFolder(exportSettings?.folder ?? null);
            setContinuousExport(exportSettings?.continuousExport ?? false);
            void syncExportRecord(exportSettings?.folder);
        } catch (e) {
            logError(e, 'export on mount useEffect failed');
        }
    }, []);

    useEffect(() => {
        if (!props.show) {
            return;
        }
        void syncExportRecord(exportFolder);
    }, [props.show]);

    // =============
    // STATE UPDATERS
    // ==============
    const updateExportFolder = (newFolder: string) => {
        exportService.updateExportSettings({ folder: newFolder });
        setExportFolder(newFolder);
    };

    const updateContinuousExport = (updatedContinuousExport: boolean) => {
        exportService.updateExportSettings({
            continuousExport: updatedContinuousExport,
        });
        setContinuousExport(updatedContinuousExport);
    };

    // ======================
    // HELPER FUNCTIONS
    // =======================

    const verifyExportFolderExists = () => {
        if (!exportService.exportFolderExists(exportFolder)) {
            appContext.setDialogMessage(
                getExportDirectoryDoesNotExistMessage()
            );
            throw Error(CustomError.EXPORT_FOLDER_DOES_NOT_EXIST);
        }
    };

    const syncExportRecord = async (exportFolder: string): Promise<void> => {
        try {
            if (!exportService.exportFolderExists(exportFolder)) {
                const pendingExports = await exportService.getPendingExports(
                    null
                );
                setPendingExports(pendingExports);
            }
            const exportRecord = await exportService.getExportRecord(
                exportFolder
            );
            setExportStage(exportRecord.stage);
            setLastExportTime(exportRecord.lastAttemptTimestamp);
            const pendingExports = await exportService.getPendingExports(
                exportRecord
            );
            setPendingExports(pendingExports);
        } catch (e) {
            if (e.message !== CustomError.EXPORT_FOLDER_DOES_NOT_EXIST) {
                logError(e, 'syncExportRecord failed');
            }
        }
    };

    // =============
    // UI functions
    // =============

    const handleChangeExportDirectoryClick = async () => {
        try {
            const newFolder = await exportService.changeExportDirectory();
            addLogLine(`Export folder changed to ${newFolder}`);
            updateExportFolder(newFolder);
            void syncExportRecord(newFolder);
        } catch (e) {
            if (e.message !== CustomError.SELECT_FOLDER_ABORTED) {
                logError(e, 'handleChangeExportDirectoryClick failed');
            }
        }
    };

    const handleOpenExportDirectoryClick = () => {
        void exportService.openExportDirectory(exportFolder);
    };

    const toggleContinuousExport = () => {
        try {
            verifyExportFolderExists();
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

    const startExport = async () => {
        try {
            verifyExportFolderExists();
            await exportService.scheduleExport();
        } catch (e) {
            if (e.message !== CustomError.EXPORT_FOLDER_DOES_NOT_EXIST) {
                logError(e, 'scheduleExport failed');
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
            </DialogContent>
            <Divider />
            <ExportDynamicContent
                exportStage={exportStage}
                startExport={startExport}
                stopExport={stopExport}
                onHide={props.onHide}
                lastExportTime={lastExportTime}
                exportProgress={exportProgress}
                pendingExports={pendingExports}
                collectionNameMap={props.collectionNameMap}
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
            <Typography color="text.muted" mr={'16px'}>
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
            <Typography color="text.muted">{t('CONTINUOUS_EXPORT')}</Typography>
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
    exportProgress,
    pendingExports,
    collectionNameMap,
}: {
    exportStage: ExportStage;
    startExport: () => void;
    stopExport: () => void;
    onHide: () => void;
    lastExportTime: number;
    exportProgress: ExportProgress;
    pendingExports: EnteFile[];
    collectionNameMap: Map<number, string>;
}) => {
    switch (exportStage) {
        case ExportStage.INIT:
            return <ExportInit startExport={startExport} />;

        case ExportStage.MIGRATION:
        case ExportStage.STARTING:
        case ExportStage.EXPORTING_FILES:
        case ExportStage.RENAMING_COLLECTION_FOLDERS:
        case ExportStage.TRASHING_DELETED_FILES:
        case ExportStage.TRASHING_DELETED_COLLECTIONS:
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
                    pendingExports={pendingExports}
                    collectionNameMap={collectionNameMap}
                    startExport={startExport}
                />
            );

        default:
            return <></>;
    }
};
