import { MappingList } from './mappingList';
import React, { useContext, useEffect, useState } from 'react';
import { Button, Dialog, DialogContent, Stack } from '@mui/material';
import watchFolderService from 'services/watchFolder/watchFolderService';
import { WatchMapping } from 'types/watchFolder';
import { AppContext } from 'pages/_app';
import { t } from 'i18next';

import DialogTitleWithCloseButton from '@ente/shared/components/DialogBox/TitleWithCloseButton';
import UploadStrategyChoiceModal from 'components/Upload/UploadStrategyChoiceModal';
import { UPLOAD_STRATEGY } from 'constants/upload';
import { getImportSuggestion } from 'utils/upload';
import ElectronAPIs from '@ente/shared/electron';
import { PICKED_UPLOAD_TYPE } from 'constants/upload';
import { logError } from '@ente/shared/sentry';

interface Iprops {
    open: boolean;
    onClose: () => void;
}

export default function WatchFolder({ open, onClose }: Iprops) {
    const [mappings, setMappings] = useState<WatchMapping[]>([]);
    const [inputFolderPath, setInputFolderPath] = useState('');
    const [choiceModalOpen, setChoiceModalOpen] = useState(false);
    const appContext = useContext(AppContext);

    useEffect(() => {
        try {
            setMappings(watchFolderService.getWatchMappings());
        } catch (e) {
            logError(e, 'get watch mappings failed');
        }
    }, []);

    useEffect(() => {
        try {
            if (
                appContext.watchFolderFiles &&
                appContext.watchFolderFiles.length > 0
            ) {
                handleFolderDrop(appContext.watchFolderFiles);
                appContext.setWatchFolderFiles(null);
            }
        } catch (e) {
            logError(e, 'handle folder drop failed');
        }
    }, [appContext.watchFolderFiles]);

    const handleFolderDrop = async (folders: FileList) => {
        for (let i = 0; i < folders.length; i++) {
            const folder: any = folders[i];
            const path = (folder.path as string).replace(/\\/g, '/');
            if (await watchFolderService.isFolder(path)) {
                await addFolderForWatching(path);
            }
        }
    };

    const addFolderForWatching = async (path: string) => {
        setInputFolderPath(path);
        const files = await ElectronAPIs.getDirFiles(path);
        const analysisResult = getImportSuggestion(
            PICKED_UPLOAD_TYPE.FOLDERS,
            files
        );
        if (analysisResult.hasNestedFolders) {
            setChoiceModalOpen(true);
        } else {
            handleAddWatchMapping(UPLOAD_STRATEGY.SINGLE_COLLECTION, path);
        }
    };

    const handleAddFolderClick = async () => {
        try {
            await handleFolderSelection();
        } catch (e) {
            logError(e, 'handleAddFolderClick failed');
        }
    };

    const handleFolderSelection = async () => {
        const folderPath = await watchFolderService.selectFolder();
        if (folderPath) {
            await addFolderForWatching(folderPath);
        }
    };

    const handleAddWatchMapping = async (
        uploadStrategy: UPLOAD_STRATEGY,
        folderPath?: string
    ) => {
        folderPath = folderPath || inputFolderPath;
        await watchFolderService.addWatchMapping(
            folderPath.substring(folderPath.lastIndexOf('/') + 1),
            folderPath,
            uploadStrategy
        );
        setInputFolderPath('');
        setMappings(watchFolderService.getWatchMappings());
    };

    const handleRemoveWatchMapping = async (mapping: WatchMapping) => {
        await watchFolderService.removeWatchMapping(mapping.folderPath);
        setMappings(watchFolderService.getWatchMappings());
    };

    const closeChoiceModal = () => setChoiceModalOpen(false);

    const uploadToSingleCollection = () => {
        try {
            closeChoiceModal();
            handleAddWatchMapping(UPLOAD_STRATEGY.SINGLE_COLLECTION);
        } catch (e) {
            logError(e, 'uploadToSingleCollection failed');
        }
    };

    const uploadToMultipleCollection = () => {
        try {
            closeChoiceModal();
            handleAddWatchMapping(UPLOAD_STRATEGY.COLLECTION_PER_FOLDER);
        } catch (e) {
            logError(e, 'uploadToMultipleCollection failed');
        }
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                PaperProps={{ sx: { height: '448px', maxWidth: '414px' } }}>
                <DialogTitleWithCloseButton
                    onClose={onClose}
                    sx={{ '&&&': { padding: '32px 16px 16px 24px' } }}>
                    {t('WATCHED_FOLDERS')}
                </DialogTitleWithCloseButton>
                <DialogContent sx={{ flex: 1 }}>
                    <Stack spacing={1} p={1.5} height={'100%'}>
                        <MappingList
                            mappings={mappings}
                            handleRemoveWatchMapping={handleRemoveWatchMapping}
                        />
                        <Button
                            fullWidth
                            color="accent"
                            onClick={handleAddFolderClick}>
                            <span>+</span>
                            <span
                                style={{
                                    marginLeft: '8px',
                                }}></span>
                            {t('ADD_FOLDER')}
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>
            <UploadStrategyChoiceModal
                open={choiceModalOpen}
                onClose={closeChoiceModal}
                uploadToSingleCollection={uploadToSingleCollection}
                uploadToMultipleCollection={uploadToMultipleCollection}
            />
        </>
    );
}
