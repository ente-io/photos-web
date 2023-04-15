import React, { useState } from 'react';
import {
    Box,
    Breakpoint,
    Button,
    Dialog,
    DialogProps,
    Stack,
    Typography,
} from '@mui/material';
import { t } from 'i18next';
import { dialogCloseHandler } from 'components/DialogBox/TitleWithCloseButton';
import { DialogBoxAttributesV2 } from 'types/dialogBox';
import {EnteButton} from 'ente-ui';

type IProps = React.PropsWithChildren<
    Omit<DialogProps, 'onClose' | 'maxSize'> & {
        onClose: () => void;
        attributes: DialogBoxAttributesV2;
        size?: Breakpoint;
        titleCloseButton?: boolean;
    }
>;

export default function DialogBoxV2({
    attributes,
    children,
    open,
    onClose,
    ...props
}: IProps) {
    const [loading, setLoading] = useState(false);
    if (!attributes) {
        return <></>;
    }

    const handleClose = dialogCloseHandler({
        staticBackdrop: attributes.staticBackdrop,
        nonClosable: attributes.nonClosable,
        onClose: onClose,
    });

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            PaperProps={{
                sx: {
                    padding: '8px 12px',
                    maxWidth: '360px',
                },
            }}
            {...props}>
            <Stack spacing={'36px'} p={'16px'}>
                <Stack spacing={'19px'}>
                    {attributes.icon && (
                        <Box
                            sx={{
                                '& > svg': {
                                    fontSize: '32px',
                                },
                            }}>
                            {attributes.icon}
                        </Box>
                    )}
                    {attributes.title && (
                        <Typography variant="h4" fontWeight={'bold'}>
                            {attributes.title}
                        </Typography>
                    )}
                    {children ||
                        (attributes?.content && (
                            <Typography color="text.secondary">
                                {attributes.content}
                            </Typography>
                        ))}
                </Stack>
                {(attributes.proceed ||
                    attributes.close ||
                    attributes.buttons?.length) && (
                    <Stack
                        spacing={'8px'}
                        direction={
                            attributes.buttonDirection === 'row'
                                ? 'row-reverse'
                                : 'column'
                        }
                        flex={1}>
                        {attributes.proceed && (
                            <EnteButton
                                loading={loading}
                                size="large"
                                color={attributes.proceed?.variant}
                                onClick={async () => {
                                    await attributes.proceed.action(setLoading);

                                    onClose();
                                }}
                                disabled={attributes.proceed.disabled}>
                                {attributes.proceed.text}
                            </EnteButton>
                        )}
                        {attributes.close && (
                            <Button
                                size="large"
                                color={attributes.close?.variant ?? 'secondary'}
                                onClick={() => {
                                    attributes.close.action &&
                                        attributes.close?.action();
                                    onClose();
                                }}>
                                {attributes.close?.text ?? t('OK')}
                            </Button>
                        )}
                        {attributes.buttons &&
                            attributes.buttons.map((b) => (
                                <Button
                                    size="large"
                                    key={b.text}
                                    color={b.variant}
                                    onClick={() => {
                                        b.action();
                                        onClose();
                                    }}
                                    disabled={b.disabled}>
                                    {b.text}
                                </Button>
                            ))}
                    </Stack>
                )}
            </Stack>
        </Dialog>
    );
}
