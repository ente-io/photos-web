import { CollectionActions } from '..';
import React from 'react';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { IconButton, Tooltip } from '@mui/material';
import { CollectionSummaryType } from 'constants/collection';
import { t } from 'i18next';
interface Iprops {
    handleCollectionAction: (
        action: CollectionActions,
        loader?: boolean
    ) => (...args: any[]) => Promise<void>;
    collectionSummaryType: CollectionSummaryType;
}

export function DownloadQuickOption({
    handleCollectionAction,
    collectionSummaryType,
}: Iprops) {
    return (
        <Tooltip
            title={
                collectionSummaryType === CollectionSummaryType.favorites
                    ? t('DOWNLOAD_FAVORITES')
                    : collectionSummaryType ===
                      CollectionSummaryType.uncategorized
                    ? t('DOWNLOAD_UNCATEGORIZED')
                    : collectionSummaryType === CollectionSummaryType.hidden
                    ? t('DOWNLOAD_HIDDEN')
                    : t('DOWNLOAD_COLLECTION')
            }>
            <IconButton
                onClick={handleCollectionAction(
                    CollectionActions.CONFIRM_DOWNLOAD,
                    false
                )}>
                <FileDownloadOutlinedIcon />
            </IconButton>
        </Tooltip>
    );
}
