import React, { forwardRef, Ref } from 'react';
import constants from 'utils/strings/constants';
import SingleInputForm, {
    SingleInputFormProps,
} from 'components/SingleInputForm';
import DialogBoxBase from 'components/DialogBox/base';
import { DialogContent, DialogTitle } from '@mui/material';
import {
    ImperativeDialog,
    useImperativeDialog,
} from 'hooks/useImperativeDialog';

export interface CollectionNamerAttributes {
    title: string;
    autoFilledName: string;
    buttonText: string;
}

export type SetCollectionNamerAttributes = React.Dispatch<
    React.SetStateAction<CollectionNamerAttributes>
>;

export type ICollectionNamer = ImperativeDialog<
    CollectionNamerAttributes,
    string
>;

function CollectionNamer(props: {}, ref: Ref<ICollectionNamer>) {
    const { isOpen, onClose, onClickHandler, attributes } =
        useImperativeDialog(ref);

    const onSubmit: SingleInputFormProps['callback'] = async (
        albumName,
        setFieldError
    ) => {
        try {
            onClickHandler(albumName)();
        } catch (e) {
            setFieldError(constants.UNKNOWN_ERROR);
        }
    };

    return (
        <DialogBoxBase open={isOpen} onClose={onClose}>
            <DialogTitle>{attributes.title}</DialogTitle>
            <DialogContent>
                <SingleInputForm
                    callback={onSubmit}
                    fieldType="text"
                    buttonText={attributes.buttonText}
                    placeholder={constants.ENTER_ALBUM_NAME}
                    initialValue={attributes.autoFilledName}
                    submitButtonProps={{ sx: { mt: 1, mb: 2 } }}
                    secondaryButtonAction={onClose}
                />
            </DialogContent>
        </DialogBoxBase>
    );
}

export default forwardRef(CollectionNamer);
