import { useContext } from 'react';
import { t } from 'i18next';

import exportService from 'services/export';
import isElectron from 'is-electron';
import { AppContext } from 'pages/_app';
import EnteSpinner from 'components/EnteSpinner';
import { getDownloadAppMessage } from 'utils/ui';
import { NoStyleAnchor } from 'components/pages/sharedAlbum/GoToEnte';
import { openLink } from 'utils/common';
import { EnteMenuItem } from 'components/Menu/EnteMenuItem';
import { Typography } from '@mui/material';
import { GalleryContext } from 'pages/gallery';
import { DESKTOP_ROADMAP_URL, WEB_ROADMAP_URL } from 'constants/urls';

export default function HelpSection() {
    const { setDialogMessage } = useContext(AppContext);
    const { openExportModal } = useContext(GalleryContext);

    async function openRoadmap() {
        let roadmapURL: string;
        if (isElectron()) {
            roadmapURL = DESKTOP_ROADMAP_URL;
        } else {
            roadmapURL = WEB_ROADMAP_URL;
        }
        openLink(roadmapURL, true);
    }

    function handleExportOpen() {
        if (isElectron()) {
            openExportModal();
        } else {
            setDialogMessage(getDownloadAppMessage());
        }
    }

    return (
        <>
            <EnteMenuItem
                onClick={openRoadmap}
                label={t('REQUEST_FEATURE')}
                variant="secondary"
            />
            <EnteMenuItem
                onClick={() => openLink('mailto:contact@ente.io', true)}
                labelComponent={
                    <NoStyleAnchor href="mailto:contact@ente.io">
                        <Typography fontWeight={'bold'}>
                            {t('SUPPORT')}
                        </Typography>
                    </NoStyleAnchor>
                }
                variant="secondary"
            />
            <EnteMenuItem
                onClick={handleExportOpen}
                label={t('EXPORT')}
                endIcon={
                    exportService.isExportInProgress() && (
                        <EnteSpinner size="20px" />
                    )
                }
                variant="secondary"
            />
        </>
    );
}
