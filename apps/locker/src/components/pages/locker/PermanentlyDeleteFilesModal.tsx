import DialogBoxV2 from '@/components/DialogBoxV2';
import EnteButton from '@/components/EnteButton';
import { deleteFromTrash, trashFiles } from '@/services/fileService';
import { Stack, Button } from '@mui/material';
import { t } from 'i18next';
import { LockerDashboardContext } from '@/pages/locker';
import { useContext } from 'react';

interface IProps {
    show: boolean;
    onHide: () => void;
}

const PermanentlyDeleteFilesModal = (props: IProps) => {
    const { selectedExplorerItems } = useContext(LockerDashboardContext);

    return (
        <DialogBoxV2
            open={props.show}
            onClose={props.onHide}
            sx={{ zIndex: 1600 }}
            attributes={{
                title: `${t('PERMANENTLY_DELETE')} ${
                    selectedExplorerItems.length
                } ${t('FILES')}?`,
            }}>
            <Stack spacing={'8px'}>
                <EnteButton
                    type="submit"
                    size="large"
                    color="critical"
                    onClick={async () => {
                        await deleteFromTrash(
                            selectedExplorerItems.map(
                                (selectedFile) => selectedFile.id
                            )
                        );
                        props.onHide();
                    }}>
                    {t('DELETE')}
                </EnteButton>
                <Button size="large" color={'secondary'} onClick={props.onHide}>
                    {t('CANCEL')}
                </Button>
            </Stack>
        </DialogBoxV2>
    );
};

export default PermanentlyDeleteFilesModal;
