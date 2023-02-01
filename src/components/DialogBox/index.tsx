import React from 'react';
import constants from 'utils/strings/constants';
import {
    Breakpoint,
    DialogActions,
    DialogContent,
    DialogProps,
    Typography,
} from '@mui/material';
import DialogTitleWithCloseButton, {
    dialogCloseHandler,
} from './TitleWithCloseButton';
import DialogBoxBase from './base';
import { DialogBoxAttributes } from 'types/dialogBox';
import DialogIcon from './DialogIcon';
import EnteButton from 'components/EnteButton';

type IProps = React.PropsWithChildren<
    Omit<DialogProps, 'onClose' | 'maxSize'> & {
        onClose: () => void;
        attributes: DialogBoxAttributes;
        size?: Breakpoint;
        titleCloseButton?: boolean;
    }
>;

export default function DialogBox({
    attributes,
    children,
    open,
    size,
    onClose,
    titleCloseButton,
    ...props
}: IProps) {
    if (!attributes) {
        return <></>;
    }

    const handleClose = dialogCloseHandler({
        staticBackdrop: attributes.staticBackdrop,
        nonClosable: attributes.nonClosable,
        onClose: onClose,
    });

    return (
        <DialogBoxBase
            open={open}
            maxWidth={size}
            onClose={handleClose}
            {...props}>
            {attributes.icon && <DialogIcon icon={attributes.icon} />}
            {attributes.title && (
                <DialogTitleWithCloseButton
                    onClose={
                        titleCloseButton &&
                        !attributes.nonClosable &&
                        handleClose
                    }>
                    {attributes.title}
                </DialogTitleWithCloseButton>
            )}
            {(children || attributes?.content) && (
                <DialogContent>
                    {children || (
                        <Typography color="text.secondary">
                            {attributes.content}
                        </Typography>
                    )}
                </DialogContent>
            )}
            {(attributes.close || attributes.proceed) && (
                <DialogActions>
                    <>
                        {attributes.close && (
                            <EnteButton
                                size="large"
                                variant={
                                    attributes.close?.variant ?? 'secondary'
                                }
                                onClick={() => {
                                    attributes.close.action &&
                                        attributes.close?.action();
                                    onClose();
                                }}>
                                {attributes.close?.text ?? constants.OK}
                            </EnteButton>
                        )}
                        {attributes.proceed && (
                            <EnteButton
                                size="large"
                                variant={attributes.proceed?.variant}
                                onClick={() => {
                                    attributes.proceed.action();
                                    onClose();
                                }}
                                disabled={attributes.proceed.disabled}>
                                {attributes.proceed.text}
                            </EnteButton>
                        )}
                    </>
                </DialogActions>
            )}
        </DialogBoxBase>
    );
}
