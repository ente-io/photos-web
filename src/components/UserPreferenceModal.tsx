import {
    Button,
    DialogActions,
    DialogContent,
    Stack,
    Switch,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { updateUserPreferences } from 'services/userService';
import { logError } from 'utils/sentry';
import constants from 'utils/strings/constants';
import { getLocalUserPreferences } from 'utils/user';
import { SpaceBetweenFlex } from './Container';
import DialogBoxBase from './DialogBox/base';
import DialogTitleWithCloseButton from './DialogBox/TitleWithCloseButton';

interface Iprops {
    open: boolean;
    onClose: () => void;
}

function UserPreferenceModal({ open, onClose }: Iprops) {
    const [isImgTranscodingEnabled, setIsImgTranscodingEnabled] =
        useState(false);
    const [isVidTranscodingEnabled, setIsVidTranscodingEnabled] =
        useState(false);

    useEffect(() => {
        const main = async () => {
            const userPreferences = getLocalUserPreferences();
            if (userPreferences) {
                setIsImgTranscodingEnabled(
                    userPreferences.data.isImgTranscodingEnabled
                );
                setIsVidTranscodingEnabled(
                    userPreferences.data.isVidTranscodingEnabled
                );
            }
        };
        main();
    }, []);

    const handleImgTranscodingChange = (e) => {
        setIsImgTranscodingEnabled(e.target.checked);
    };

    const handleVidTranscodingChange = (e) => {
        setIsVidTranscodingEnabled(e.target.checked);
    };

    const onSaveClick = async () => {
        try {
            await updateUserPreferences({
                ...getLocalUserPreferences(),
                data: { isImgTranscodingEnabled, isVidTranscodingEnabled },
            });
            onClose();
        } catch (e) {
            logError(e, 'saving user preferences failed');
        }
    };

    return (
        <DialogBoxBase maxWidth="xs" open={open} onClose={onClose}>
            <DialogTitleWithCloseButton onClose={onClose}>
                {constants.PREFERENCES}
            </DialogTitleWithCloseButton>
            <DialogContent>
                <Stack
                    spacing={0.5}
                    sx={{
                        marginTop: '16px',
                    }}>
                    <SpaceBetweenFlex>
                        <div>{constants.ENABLE_IMAGE_TRANSCODING}</div>
                        <Switch
                            checked={isImgTranscodingEnabled}
                            onChange={handleImgTranscodingChange}
                            color="success"
                        />
                    </SpaceBetweenFlex>
                    <SpaceBetweenFlex>
                        <div>{constants.ENABLE_VIDEO_TRANSCODING}</div>
                        <Switch
                            checked={isVidTranscodingEnabled}
                            onChange={handleVidTranscodingChange}
                            color="success"
                        />
                    </SpaceBetweenFlex>
                </Stack>
            </DialogContent>
            <DialogActions>
                <SpaceBetweenFlex>
                    <Button onClick={onClose} color="secondary">
                        {constants.CANCEL}
                    </Button>
                    <Button onClick={onSaveClick} color="accent">
                        {constants.SAVE}
                    </Button>
                </SpaceBetweenFlex>
            </DialogActions>
        </DialogBoxBase>
    );
}

export default UserPreferenceModal;
