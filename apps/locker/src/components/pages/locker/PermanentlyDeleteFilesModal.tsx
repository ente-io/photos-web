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
    const { selectedFiles } = useContext(LockerDashboardContext);

    return (
        <DialogBoxV2
            open={props.show}
            onClose={props.onHide}
            sx={{ zIndex: 1600 }}
            attributes={{
                title: `Permanently Delete ${selectedFiles.length} Files?`,
            }}>
            <Stack spacing={'8px'}>
                <EnteButton
                    type="submit"
                    size="large"
                    color="critical"
                    onClick={async () => {
                        await deleteFromTrash(
                            selectedFiles.map((selectedFile) => selectedFile.id)
                        );
                        props.onHide();
                    }}>
                    Delete
                </EnteButton>
                <Button size="large" color={'secondary'} onClick={props.onHide}>
                    {t('CANCEL')}
                </Button>
            </Stack>
        </DialogBoxV2>
    );
};

export default PermanentlyDeleteFilesModal;
