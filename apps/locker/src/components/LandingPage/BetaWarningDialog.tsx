import { Stack, Button, Typography } from '@mui/material';
import DialogBoxV2 from '../DialogBoxV2';
import EnteButton from '../EnteButton';

interface IProps {
    show: boolean;
    onHide: () => void;
}

const BetaWarningDialog = (props: IProps) => {
    return (
        <DialogBoxV2
            open={props.show}
            onClose={props.onHide}
            sx={{ zIndex: 1600 }}
            attributes={{
                title: '🚧 Locker is in Beta 🚧',
            }}>
            <Stack spacing={'8px'}>
                <Typography>
                    ente Locker is still in development and is therefore subject
                    to change without notice. You will encounter bugs during the
                    beta phase, so you should not use Locker for critical files
                    you need guaranteed access to.
                </Typography>
                <Typography></Typography>
                <EnteButton
                    type="submit"
                    size="large"
                    color="accent"
                    href="/locker"
                    onClick={async () => {
                        props.onHide();
                    }}>
                    I understand
                </EnteButton>
                <Button size="large" color={'secondary'} onClick={props.onHide}>
                    Go back
                </Button>
            </Stack>
        </DialogBoxV2>
    );
};

export default BetaWarningDialog;
