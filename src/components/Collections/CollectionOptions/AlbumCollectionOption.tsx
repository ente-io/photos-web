import { OverflowMenuOption } from 'components/OverflowMenu/option';
import React from 'react';

import EditIcon from '@mui/icons-material/Edit';
import IosShareIcon from '@mui/icons-material/IosShare';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOnOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import constants from 'utils/strings/constants';
import { CollectionActions } from '.';

interface Iprops {
    IsArchived: boolean;
    handleCollectionAction: (
        action: CollectionActions,
        loader?: boolean
    ) => (...args: any[]) => Promise<void>;
}

export function AlbumCollectionOption({
    IsArchived,
    handleCollectionAction,
}: Iprops) {
    return (
        <>
            <OverflowMenuOption
                onClick={handleCollectionAction(
                    CollectionActions.SHOW_SHARE_DIALOG,
                    false
                )}
                startIcon={<IosShareIcon />}>
                {constants.SHARE}
            </OverflowMenuOption>
            <OverflowMenuOption
                onClick={handleCollectionAction(
                    CollectionActions.CONFIRM_DOWNLOAD,
                    false
                )}
                startIcon={<FileDownloadOutlinedIcon />}>
                {constants.DOWNLOAD}
            </OverflowMenuOption>
            <OverflowMenuOption
                onClick={handleCollectionAction(
                    CollectionActions.SHOW_RENAME_DIALOG,
                    false
                )}
                startIcon={<EditIcon />}>
                {constants.RENAME}
            </OverflowMenuOption>
            {IsArchived ? (
                <OverflowMenuOption
                    onClick={handleCollectionAction(
                        CollectionActions.UNARCHIVE
                    )}
                    startIcon={<VisibilityOnOutlinedIcon />}>
                    {constants.UNARCHIVE}
                </OverflowMenuOption>
            ) : (
                <OverflowMenuOption
                    onClick={handleCollectionAction(CollectionActions.ARCHIVE)}
                    startIcon={<VisibilityOffOutlinedIcon />}>
                    {constants.ARCHIVE}
                </OverflowMenuOption>
            )}
            <OverflowMenuOption
                startIcon={<DeleteOutlinedIcon />}
                onClick={handleCollectionAction(
                    CollectionActions.CONFIRM_DELETE,
                    false
                )}>
                {constants.DELETE}
            </OverflowMenuOption>
        </>
    );
}
