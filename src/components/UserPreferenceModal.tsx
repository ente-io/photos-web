import {
    Button,
    DialogActions,
    DialogContent,
    Stack,
    Switch,
} from '@mui/material';
import { AppContext } from 'pages/_app';
import React, { useState, useEffect, useContext } from 'react';
import { updateUserPreferences } from 'services/userService';
import { UserPreferences } from 'types/user';
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
    const [userPreferences, setUserPreferences] =
        useState<UserPreferences['data']>(null);
    const appContext = useContext(AppContext);

    useEffect(() => {
        const main = async () => {
            const userPreferences = getLocalUserPreferences();
            if (userPreferences) {
                setUserPreferences(userPreferences.data);
            }
        };
        main();
    }, []);

    const handleImgTranscodingChange = (e) => {
        setUserPreferences({
            ...userPreferences,
            isImgTranscodingEnabled: e.target.checked,
        });
    };

    const handleVidTranscodingChange = (e) => {
        setUserPreferences({
            ...userPreferences,
            isVidTranscodingEnabled: e.target.checked,
        });
    };

    const onSaveClick = async () => {
        try {
            await updateUserPreferences({
                ...getLocalUserPreferences(),
                data: userPreferences,
            });
            onClose();
        } catch (e) {
            logError(e, 'saving user preferences failed');
            appContext.setDialogMessage({
                title: "Couldn't save user preferences",
                content:
                    "Couldn't save user preferences, please try again later.",
                close: { variant: 'primary' },
            });
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
                        mt: 1,
                    }}>
                    <SpaceBetweenFlex>
                        <div>{constants.ENABLE_IMAGE_TRANSCODING}</div>
                        <Switch
                            checked={userPreferences?.isImgTranscodingEnabled}
                            onChange={handleImgTranscodingChange}
                            color="success"
                        />
                    </SpaceBetweenFlex>
                    <SpaceBetweenFlex>
                        <div>{constants.ENABLE_VIDEO_TRANSCODING}</div>
                        <Switch
                            checked={userPreferences?.isVidTranscodingEnabled}
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
