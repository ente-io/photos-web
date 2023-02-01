import Done from '@mui/icons-material/Done';
import { CircularProgress } from '@mui/material';
import React, { FC } from 'react';
import EnteButton, { EnteButtonProps } from './EnteButton';

export interface SubmitButtonProps extends EnteButtonProps {
    loading: boolean;
    buttonText: string;

    disabled?: boolean;
    success?: boolean;
}
const SubmitButton: FC<SubmitButtonProps> = ({
    loading,
    buttonText,
    disabled,
    success,
    sx,
    ...props
}) => {
    return (
        <EnteButton
            size="large"
            variant="neutral"
            type="submit"
            disabled={disabled || loading || success}
            sx={{
                my: 4,
                ...(loading
                    ? {
                          '&.Mui-disabled': {
                              backgroundColor: (theme) =>
                                  theme.colors.primary[500],
                              color: (theme) => theme.colors.white.base,
                          },
                      }
                    : {}),
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
        </EnteButton>
    );
};

export default SubmitButton;
