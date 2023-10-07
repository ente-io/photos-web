import DialogBoxV2 from '@/components/DialogBoxV2';
import EnteButton from '@/components/EnteButton';
import { LockerDashboardContext } from '@/pages/locker';
import { deleteCollection } from '@/services/collectionService';
import { Stack, Button } from '@mui/material';
import { t } from 'i18next';
import { useContext } from 'react';

interface IProps {
    show: boolean;
    onHide: () => void;
}

const DeleteCollectionsModal = (props: IProps) => {
    const { selectedExplorerItems, setSelectedExplorerItems } = useContext(
        LockerDashboardContext
    );

    return (
        <DialogBoxV2
            open={props.show}
            onClose={props.onHide}
            sx={{ zIndex: 1600 }}
            attributes={{
                title: `${t('DELETE')} ${selectedExplorerItems.length} ${
                    selectedExplorerItems.length > 1
                        ? t('COLLECTIONS')
                        : t('COLLECTION')
                }?`,
            }}>
            <Stack spacing={'8px'}>
                <EnteButton
                    type="submit"
                    size="large"
                    color="warning"
                    onClick={async () => {
                        for await (const collection of selectedExplorerItems) {
                            await deleteCollection(collection.id, true);
                        }
                        setSelectedExplorerItems([]);
                        props.onHide();
                    }}>
                    {t('KEEP_FILES')}
                </EnteButton>
                <EnteButton
                    type="submit"
                    size="large"
                    color="critical"
                    onClick={async () => {
                        for await (const collection of selectedExplorerItems) {
                            await deleteCollection(collection.id, false);
                        }
                        setSelectedExplorerItems([]);
                        props.onHide();
                    }}>
                    {t('DELETE_FILES')}
                </EnteButton>
                <Button size="large" color={'secondary'} onClick={props.onHide}>
                    {t('CANCEL')}
                </Button>
            </Stack>
        </DialogBoxV2>
    );
};

export default DeleteCollectionsModal;
