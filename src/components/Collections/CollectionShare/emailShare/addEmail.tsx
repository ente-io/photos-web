import SingleInputForm, {
    SingleInputFormProps,
} from 'components/SingleInputForm';
import { GalleryContext } from 'pages/gallery';
import React, { useContext } from 'react';
import { t } from 'i18next';
import { shareCollection } from 'services/collectionService';
import { User } from 'types/user';
import { handleSharingErrors } from 'utils/error/ui';
import { getData, LS_KEYS } from 'utils/storage/localStorage';
import { CollectionShareSharees } from './sharees';
import MenuSectionTitle from 'components/Menu/MenuSectionTitle';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import { EnteDrawer } from 'components/EnteDrawer';
import Titlebar from 'components/Titlebar';
import { DialogProps, Stack } from '@mui/material';
import { EmailShareType } from 'constants/collection/collectionShare';

export default function AddEmail({
    collection,
    emailShareType,
    open,
    onClose,
    onRootClose,
}) {
    const galleryContext = useContext(GalleryContext);

    const collectionShare: SingleInputFormProps['callback'] = async (
        email,
        setFieldError,
        resetForm
    ) => {
        try {
            const user: User = getData(LS_KEYS.USER);
            if (email === user.email) {
                setFieldError(t('SHARE_WITH_SELF'));
            } else if (
                collection?.sharees?.find((value) => value.email === email)
            ) {
                setFieldError(t('ALREADY_SHARED', { email }));
            } else {
                await shareCollection(collection, email);
                await galleryContext.syncWithRemote(false, true);
                resetForm();
            }
        } catch (e) {
            const errorMessage = handleSharingErrors(e);
            setFieldError(errorMessage);
        }
    };

    const handleDrawerClose: DialogProps['onClose'] = (_, reason) => {
        if (reason === 'backdropClick') {
            onRootClose();
        } else {
            onClose;
        }
    };
    return (
        <EnteDrawer
            anchor="right"
            open={open}
            onClose={handleDrawerClose}
            BackdropProps={{
                sx: { '&&&': { backgroundColor: 'transparent' } },
            }}>
            <Stack spacing={'4px'} py={'12px'}>
                <Titlebar
                    onClose={onClose}
                    title={
                        emailShareType === EmailShareType.viewer
                            ? t('ADD_VIEWER')
                            : t('ADD_COLLABORATOR')
                    }
                    onRootClose={onRootClose}
                />
                <MenuSectionTitle
                    title={t('ADD_EMAIL_TITLE')}
                    icon={<WorkspacesIcon />}
                />
                <SingleInputForm
                    callback={collectionShare}
                    placeholder={t('ENTER_EMAIL')}
                    fieldType="email"
                    buttonText={t('SHARE')}
                    submitButtonProps={{
                        size: 'medium',
                        sx: { mt: 1, mb: 2 },
                    }}
                    disableAutoFocus
                />
                <CollectionShareSharees collection={collection} />
            </Stack>
        </EnteDrawer>
    );
}
