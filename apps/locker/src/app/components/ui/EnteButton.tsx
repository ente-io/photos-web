import Done from '@mui/icons-material/Done';
import {
    Button,
    ButtonProps,
    CircularProgress,
    PaletteColor,
} from '@mui/material';

interface Iprops extends ButtonProps {
    loading?: boolean;
    success?: boolean;
}

export default function EnteButton({
    children,
    loading,
    success,
    disabled,
    sx,
    ...props
}: Iprops) {
    return (
        <Button
            disabled={disabled}
            sx={{
                ...sx,
                ...((loading || success) && {
                    '&.Mui-disabled': (theme) => ({
                        // @ts-ignore
                        backgroundColor: (
                            theme.palette[props.color] as PaletteColor
                        ).main,
                        // @ts-ignore
                        color: (theme.palette[props.color] as PaletteColor)
                            .contrastText,
                    }),
                }),
            }}
            {...props}>
            {loading ? (
                <CircularProgress size={20} sx={{ color: 'inherit' }} />
            ) : success ? (
                <Done sx={{ fontSize: 20 }} />
            ) : (
                children
            )}
        </Button>
    );
}
