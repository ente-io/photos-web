import {
    Button,
    DialogActions,
    DialogContent,
    Stack,
    Switch,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import {
    getUserPreferences,
    updateUserPreferences,
} from 'services/userService';
import { logError } from 'utils/sentry';
import { setData, LS_KEYS } from 'utils/storage/localStorage';
import { SpaceBetweenFlex } from './Container';
import DialogBoxBase from './DialogBox/base';
import DialogTitleWithCloseButton from './DialogBox/TitleWithCloseButton';

interface Iprops {
    open: boolean;
    onClose: () => void;
}

function UserPrefModal({ open, onClose }: Iprops) {
    const [isImgTranscodingEnabled, setIsImgTranscodingEnabled] =
        useState(false);
    const [isVidTranscodingEnabled, setIsVidTranscodingEnabled] =
        useState(false);

    useEffect(() => {
        const main = async () => {
            const userPreferences = await getUserPreferences();
            if (userPreferences) {
                setIsImgTranscodingEnabled(
                    userPreferences.isImgTranscodingEnabled
                );
                setIsVidTranscodingEnabled(
                    userPreferences.isVidTranscodingEnabled
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
                isImgTranscodingEnabled,
                isVidTranscodingEnabled,
            });
            setData(LS_KEYS.USER_PREFERENCES, {
                isImgTranscodingEnabled,
                isVidTranscodingEnabled,
            });
            onClose();
        } catch (e) {
            logError(e, 'saving user preferences failed');
        }
    };

    return (
        <DialogBoxBase
            maxWidth="md"
            open={open}
            onClose={onClose}
            sx={{
                '& .MuiDialog-paper': {
                    maxWidth: '400px',
                },
            }}>
            <DialogTitleWithCloseButton onClose={onClose}>
                Preferences
            </DialogTitleWithCloseButton>
            <DialogContent>
                <Stack
                    spacing={0.5}
                    sx={{
                        marginTop: '16px',
                    }}>
                    <SpaceBetweenFlex>
                        <div>Enable Image Transcoding</div>
                        <Switch
                            checked={isImgTranscodingEnabled}
                            onChange={handleImgTranscodingChange}
                            color="success"
                        />
                    </SpaceBetweenFlex>
                    <SpaceBetweenFlex>
                        <div>Enable Video Transcoding</div>
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
                    <Button
                        onClick={onClose}
                        sx={{
                            width: '80px',
                        }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onSaveClick}
                        color="success"
                        sx={{
                            width: '80px',
                        }}>
                        Save
                    </Button>
                </SpaceBetweenFlex>
            </DialogActions>
        </DialogBoxBase>
    );
}

export default UserPrefModal;
