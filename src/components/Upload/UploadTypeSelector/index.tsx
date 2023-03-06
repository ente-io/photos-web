import React from 'react';
import constants from 'utils/strings/constants';
import { default as FileUploadIcon } from '@mui/icons-material/ImageOutlined';
import { default as FolderUploadIcon } from '@mui/icons-material/PermMediaOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import { UploadTypeOption } from './option';
import DialogTitleWithCloseButton, {
    dialogCloseHandler,
} from 'components/DialogBox/TitleWithCloseButton';
import { Box, Dialog, Stack, Typography } from '@mui/material';
import { UploadTypeSelectorIntent } from 'types/gallery';
import {
    ImperativeDialog,
    useImperativeDialog,
} from 'hooks/useImperativeDialog';
import { PICKED_UPLOAD_TYPE } from 'constants/upload';

export type IUploadTypeSelector = ImperativeDialog<
    { intent: UploadTypeSelectorIntent },
    PICKED_UPLOAD_TYPE
>;

function UploadTypeSelector(props: {}, ref: React.Ref<IUploadTypeSelector>) {
    const { isOpen, onClickHandler, attributes, onClose } =
        useImperativeDialog(ref);

    return (
        <Dialog
            open={isOpen}
            PaperProps={{
                sx: (theme) => ({
                    maxWidth: '375px',
                    p: 1,
                    [theme.breakpoints.down(360)]: { p: 0 },
                }),
            }}
            onClose={dialogCloseHandler({ onClose })}>
            <DialogTitleWithCloseButton onClose={onClose}>
                {attributes.intent === UploadTypeSelectorIntent.collectPhotos
                    ? constants.SELECT_PHOTOS
                    : attributes.intent === UploadTypeSelectorIntent.import
                    ? constants.IMPORT
                    : constants.UPLOAD}
            </DialogTitleWithCloseButton>
            <Box p={1.5} pt={0.5}>
                <Stack spacing={0.5}>
                    {attributes.intent !== UploadTypeSelectorIntent.import && (
                        <UploadTypeOption
                            onClick={onClickHandler(PICKED_UPLOAD_TYPE.FILES)}
                            startIcon={<FileUploadIcon />}>
                            {constants.UPLOAD_FILES}
                        </UploadTypeOption>
                    )}
                    <UploadTypeOption
                        onClick={onClickHandler(PICKED_UPLOAD_TYPE.FOLDERS)}
                        startIcon={<FolderUploadIcon />}>
                        {constants.UPLOAD_DIRS}
                    </UploadTypeOption>
                    {attributes.intent !==
                        UploadTypeSelectorIntent.collectPhotos && (
                        <UploadTypeOption
                            onClick={onClickHandler(PICKED_UPLOAD_TYPE.ZIPS)}
                            startIcon={<GoogleIcon />}>
                            {constants.UPLOAD_GOOGLE_TAKEOUT}
                        </UploadTypeOption>
                    )}
                </Stack>
                <Typography p={1.5} pt={4} color="text.secondary">
                    {constants.DRAG_AND_DROP_HINT}
                </Typography>
            </Box>
        </Dialog>
    );
}

export default React.forwardRef(UploadTypeSelector);
