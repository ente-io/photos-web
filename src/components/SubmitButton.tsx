import Done from '@mui/icons-material/Done';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import React, { FC } from 'react';

export interface SubmitButtonProps {
    loading: boolean;
    buttonText: string;

    disabled?: boolean;
    success?: boolean;
}
const SubmitButton: FC<ButtonProps<'button', SubmitButtonProps>> = ({
    loading,
    buttonText,
    disabled,
    success,
    sx,
    ...props
}) => {
    return (
        <Button
            size="large"
            variant="contained"
            color="accent"
            type="submit"
            disabled={disabled || loading || success}
            sx={{
                my: 4,
                '&.Mui-disabled': {
                    backgroundColor: (theme) => theme.palette.accent.main,
                    color: (theme) => theme.palette.text.primary,
                },
                ...sx,
            }}
            {...props}>
            {loading ? (
                <CircularProgress size={20} />
            ) : success ? (
                <Done sx={{ fontSize: 20 }} />
            ) : (
                buttonText
            )}
        </Button>
    );
};

export default SubmitButton;
