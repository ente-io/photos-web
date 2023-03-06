import { Button, Dialog, DialogContent, Typography } from '@mui/material';
import { CenteredFlex, SpaceBetweenFlex } from 'components/Container';
import DialogTitleWithCloseButton, {
    dialogCloseHandler,
} from 'components/DialogBox/TitleWithCloseButton';
import { UPLOAD_STRATEGY } from 'constants/upload';
import {
    ImperativeDialog,
    useImperativeDialog,
} from 'hooks/useImperativeDialog';
import React, { forwardRef, Ref } from 'react';
import constants from 'utils/strings/constants';

export type IUploadStrategyChoiceModal = ImperativeDialog<
    undefined,
    UPLOAD_STRATEGY
>;

function UploadStrategyChoiceModal(
    props: {},
    ref: Ref<IUploadStrategyChoiceModal>
) {
    const { isOpen, onClose, onClickHandler } = useImperativeDialog(ref);

    const handleClose = dialogCloseHandler({
        onClose: onClose,
    });

    return (
        <Dialog open={isOpen} onClose={handleClose}>
            <DialogTitleWithCloseButton onClose={handleClose}>
                {constants.MULTI_FOLDER_UPLOAD}
            </DialogTitleWithCloseButton>
            <DialogContent>
                <CenteredFlex mb={1}>
                    <Typography color="text.secondary">
                        {constants.UPLOAD_STRATEGY_CHOICE}
                    </Typography>
                </CenteredFlex>
                <SpaceBetweenFlex px={2}>
                    <Button
                        size="medium"
                        color="accent"
                        onClick={onClickHandler(
                            UPLOAD_STRATEGY.SINGLE_COLLECTION
                        )}>
                        {constants.UPLOAD_STRATEGY_SINGLE_COLLECTION}
                    </Button>

                    <strong>{constants.OR}</strong>

                    <Button
                        size="medium"
                        color="accent"
                        onClick={onClickHandler(
                            UPLOAD_STRATEGY.COLLECTION_PER_FOLDER
                        )}>
                        {constants.UPLOAD_STRATEGY_COLLECTION_PER_FOLDER}
                    </Button>
                </SpaceBetweenFlex>
            </DialogContent>
        </Dialog>
    );
}
export default forwardRef(UploadStrategyChoiceModal);
