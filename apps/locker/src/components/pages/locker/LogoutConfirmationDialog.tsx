import DialogBoxV2 from '@/components/DialogBoxV2';
import { Collection } from '@/interfaces/collection';
import { Button } from '@mui/material';
import EnteButton from '@/components/EnteButton';
import { t } from 'i18next';
import { logoutUser } from '@/services/userService';

interface IProps {
    show: boolean;
    onHide: () => void;
}
const LogoutConfirmationDialog = (props: IProps) => {
    return (
        <>
            <DialogBoxV2
                sx={{ zIndex: 1600 }}
                open={props.show}
                onClose={props.onHide}
                attributes={{
                    title: t('LOGOUT_MESSAGE'),
                }}>
                <EnteButton
                    type="submit"
                    size="large"
                    color={'error'}
                    onClick={logoutUser}>
                    {t('LOGOUT')}
                </EnteButton>
                <Button size="large" color="secondary" onClick={props.onHide}>
                    {t('CANCEL')}
                </Button>
            </DialogBoxV2>
        </>
    );
};

export default LogoutConfirmationDialog;
