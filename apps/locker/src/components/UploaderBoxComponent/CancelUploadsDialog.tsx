import { Stack, Button } from '@mui/material';
import { t } from 'i18next';
import DialogBoxV2 from '../DialogBoxV2';
import EnteButton from '../EnteButton';

interface IProps {
    show: boolean;
    onHide: () => void;
    clearUploads: () => Promise<void>;
}

const CancelUploadsDialog = (props: IProps) => {
    return (
        <DialogBoxV2
            open={props.show}
            onClose={props.onHide}
            sx={{ zIndex: 1600 }}
            attributes={{
                title: t('CLEAR_IN_PROGRESS_UPLOADS'),
            }}>
            <Stack spacing={'8px'}>
                <EnteButton
                    type="submit"
                    size="large"
                    color="critical"
                    onClick={async () => {
                        await props.clearUploads();
                        props.onHide();
                    }}>
                    {t('YES_STOP_UPLOADS')}
                </EnteButton>
                <Button size="large" color={'secondary'} onClick={props.onHide}>
                    {t('CANCEL')}
                </Button>
            </Stack>
        </DialogBoxV2>
    );
};

export default CancelUploadsDialog;
