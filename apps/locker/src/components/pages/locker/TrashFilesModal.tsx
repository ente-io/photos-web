import DialogBoxV2 from '@/components/DialogBoxV2';
import EnteButton from '@/components/EnteButton';
import { EnteFile } from '@/interfaces/file';
import { LockerDashboardContext } from '@/pages/locker';
import { trashFiles } from '@/services/fileService';
import { Button, Stack } from '@mui/material';
import { t } from 'i18next';
import { useContext } from 'react';

interface IProps {
    show: boolean;
    onHide: () => void;
}

const TrashFilesModal = (props: IProps) => {
    const { selectedExplorerItems } = useContext(LockerDashboardContext);

    return (
        <DialogBoxV2
            open={props.show}
            onClose={props.onHide}
            sx={{ zIndex: 1600 }}
            attributes={{
                title: `${t('TRASH')} ${selectedExplorerItems.length} ${t(
                    'FILES'
                )}?`,
            }}>
            <Stack spacing={'8px'}>
                <EnteButton
                    type="submit"
                    size="large"
                    color="critical"
                    onClick={async () => {
                        await trashFiles(
                            selectedExplorerItems.map((selectedFile) => {
                                return selectedFile.originalItem as EnteFile;
                            })
                        );
                        props.onHide();
                    }}>
                    {t('TRASH')}
                </EnteButton>
                <Button size="large" color={'secondary'} onClick={props.onHide}>
                    {t('CANCEL')}
                </Button>
            </Stack>
        </DialogBoxV2>
    );
};

export default TrashFilesModal;
