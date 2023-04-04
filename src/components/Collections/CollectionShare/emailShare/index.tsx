import React, { useState } from 'react';
import { t } from 'i18next';
import MenuSectionTitle from 'components/Menu/MenuSectionTitle';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import { EnteMenuItem } from 'components/Menu/menuItem';
import AddIcon from '@mui/icons-material/Add';
import { EmailShareType } from 'constants/collection/collectionShare';
import { EnteMenuItemGroup } from 'components/Menu/menuItemGroup';
import EnteMenuItemDivider from 'components/Menu/menuItemDivider';
import AddEmail from './addEmail';
import { Stack } from '@mui/material';
export default function EmailShare({ collection, onRootClose }) {
    const [isAddEmailShareVisible, setIsAddEmailShareVisible] = useState(false);
    const [emailShareType, setEmailShareType] = useState<EmailShareType>(null);

    const openAddViewer = () => {
        setEmailShareType(EmailShareType.viewer);
        setIsAddEmailShareVisible(true);
    };
    const openAddCollaborator = () => {
        setEmailShareType(EmailShareType.collaborator);
        setIsAddEmailShareVisible(true);
    };
    const closeAddEmailShare = () => {
        setIsAddEmailShareVisible(false);
        setEmailShareType(null);
    };

    return (
        <>
            <AddEmail
                collection={collection}
                emailShareType={emailShareType}
                open={isAddEmailShareVisible}
                onClose={closeAddEmailShare}
                onRootClose={onRootClose}
            />
            <Stack>
                <MenuSectionTitle
                    title={t('ADD_EMAIL_TITLE')}
                    icon={<WorkspacesIcon />}
                />
                <EnteMenuItemGroup>
                    <EnteMenuItem
                        startIcon={<AddIcon />}
                        color="primary"
                        onClick={openAddViewer}>
                        {t('ADD_VIEWER')}
                    </EnteMenuItem>
                    <EnteMenuItemDivider hasIcon />
                    <EnteMenuItem
                        startIcon={<AddIcon />}
                        color="primary"
                        onClick={openAddCollaborator}>
                        {t('ADD_COLLABORATOR')}
                    </EnteMenuItem>
                </EnteMenuItemGroup>
            </Stack>
        </>
    );
}
