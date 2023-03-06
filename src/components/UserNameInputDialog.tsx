import React, { forwardRef, Ref } from 'react';
import constants from 'utils/strings/constants';
import DialogBox from './DialogBox';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { Typography } from '@mui/material';
import SingleInputForm from './SingleInputForm';
import {
    ImperativeDialog,
    useImperativeDialog,
} from 'hooks/useImperativeDialog';

export type IUserNameInputDialog = ImperativeDialog<
    { uploaderName: string; toUploadFilesCount: number },
    string
>;

function UserNameInputDialog(props: {}, ref: Ref<IUserNameInputDialog>) {
    const { onClickHandler, onClose, isOpen, attributes } =
        useImperativeDialog(ref);

    const handleSubmit = async (inputValue: string) => {
        onClose();
        onClickHandler(inputValue)();
    };

    return (
        <DialogBox
            size="xs"
            open={isOpen}
            onClose={onClose}
            attributes={{
                title: constants.ENTER_NAME,
                icon: <AutoAwesomeOutlinedIcon />,
            }}>
            <Typography color={'text.secondary'} pb={1}>
                {constants.PUBLIC_UPLOADER_NAME_MESSAGE}
            </Typography>
            <SingleInputForm
                hiddenLabel
                initialValue={attributes.uploaderName}
                callback={handleSubmit}
                placeholder={constants.NAME_PLACEHOLDER}
                buttonText={constants.ADD_X_PHOTOS(
                    attributes.toUploadFilesCount
                )}
                fieldType="text"
                blockButton
                secondaryButtonAction={onClose}
            />
        </DialogBox>
    );
}

export default forwardRef(UserNameInputDialog);
