import OverflowMenu from '@ente/shared/components/OverflowMenu/menu';
import { OverflowMenuOption } from '@ente/shared/components/OverflowMenu/option';
import MoreHoriz from '@mui/icons-material/MoreHoriz';
import { t } from 'i18next';
import FolderIcon from '@mui/icons-material/Folder';

export default function ChangeDirectoryOption({
    changeExportDirectory: changeDirectory,
}) {
    return (
        <OverflowMenu
            triggerButtonProps={{
                sx: {
                    ml: 1,
                },
            }}
            ariaControls={'export-option'}
            triggerButtonIcon={<MoreHoriz />}>
            <OverflowMenuOption
                onClick={changeDirectory}
                startIcon={<FolderIcon />}>
                {t('CHANGE_FOLDER')}
            </OverflowMenuOption>
        </OverflowMenu>
    );
}
