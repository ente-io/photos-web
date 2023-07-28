import { Stack, Button, Typography } from '@mui/material';
import { t } from 'i18next';
import DialogBoxV2 from './DialogBoxV2';
import EnteButton from './EnteButton';

interface IProps {
    show: boolean;
    onHide: () => void;
}

const NoRegistrationDialog = (props: IProps) => {
    return (
        <DialogBoxV2
            open={props.show}
            onClose={props.onHide}
            sx={{ zIndex: 1600 }}
            attributes={{
                title: `${t('LOCKER')} ${t('NO_REGISTRATION')}`,
            }}>
            <Stack spacing={'8px'}>
                <Typography>{t('NO_REGISTRATION_MESSAGE')}</Typography>
                <EnteButton
                    type="submit"
                    size="large"
                    color="accent"
                    onClick={() => {
                        window.open('https://web.ente.io');
                    }}>
                    {t('CONTINUE')}
                </EnteButton>
                <Button size="large" color={'secondary'} onClick={props.onHide}>
                    {t('CANCEL')}
                </Button>
            </Stack>
        </DialogBoxV2>
    );
};

export default NoRegistrationDialog;
