import { Alert, AlertProps } from '@mui/material';
import React from 'react';

export interface FlashMessage {
    message: string;
    type: AlertProps['color'];
}

export default function FlashMessageBar({
    flashMessage,
    onClose,
}: {
    flashMessage: FlashMessage;
    onClose: () => void;
}) {
    return (
        <Alert
            className="flash-message text-center"
            color={flashMessage.type}
            onClose={onClose}>
            <div style={{ maxWidth: '1024px', width: '80%', margin: 'auto' }}>
                {flashMessage.message}
            </div>
        </Alert>
    );
}
