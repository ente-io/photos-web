import React, { useContext } from 'react';
import constants from 'utils/strings/constants';
import { formatDateTime } from 'utils/file';
import { RenderFileName } from './RenderFileName';
import { ExifData } from './ExifData';
import { RenderCreationTime } from './RenderCreationTime';
import { RenderInfoItem } from './RenderInfoItem';
import DialogTitleWithCloseButton from 'components/DialogBox/TitleWithCloseButton';
import { Dialog, DialogContent, Link, styled, Typography } from '@mui/material';
import { AppContext } from 'pages/_app';

const FileInfoDialog = styled(Dialog)(({ theme }) => ({
    zIndex: 1501,
    '& .MuiDialog-container': {
        alignItems: 'flex-start',
    },
    '& .MuiDialog-paper': {
        padding: theme.spacing(2),
    },
}));

export function FileInfo({
    shouldDisableEdits,
    showInfo,
    handleCloseInfo,
    items,
    photoSwipe,
    metadata,
    exif,
    scheduleUpdate,
}) {
    const appContext = useContext(AppContext);
    return (
        <FileInfoDialog
            open={showInfo}
            onClose={handleCloseInfo}
            fullScreen={appContext.isMobile}>
            <DialogTitleWithCloseButton onClose={handleCloseInfo}>
                {constants.INFO}
            </DialogTitleWithCloseButton>
            <DialogContent>
                <Typography variant="subtitle" mb={1}>
                    {constants.METADATA}
                </Typography>

                {RenderInfoItem(
                    constants.FILE_ID,
                    items[photoSwipe?.getCurrentIndex()]?.id
                )}
                {metadata?.title && (
                    <RenderFileName
                        shouldDisableEdits={shouldDisableEdits}
                        file={items[photoSwipe?.getCurrentIndex()]}
                        scheduleUpdate={scheduleUpdate}
                    />
                )}
                {metadata?.creationTime && (
                    <RenderCreationTime
                        shouldDisableEdits={shouldDisableEdits}
                        file={items[photoSwipe?.getCurrentIndex()]}
                        scheduleUpdate={scheduleUpdate}
                    />
                )}
                {metadata?.modificationTime &&
                    RenderInfoItem(
                        constants.UPDATED_ON,
                        formatDateTime(metadata.modificationTime / 1000)
                    )}
                {metadata?.longitude > 0 &&
                    metadata?.longitude > 0 &&
                    RenderInfoItem(
                        constants.LOCATION,
                        <Link
                            href={`https://www.openstreetmap.org/?mlat=${metadata.latitude}&mlon=${metadata.longitude}#map=15/${metadata.latitude}/${metadata.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer">
                            {constants.SHOW_MAP}
                        </Link>
                    )}
                {exif && (
                    <>
                        <ExifData exif={exif} />
                    </>
                )}
            </DialogContent>
        </FileInfoDialog>
    );
}
