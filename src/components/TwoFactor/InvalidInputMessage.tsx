import React from 'react';
import { TypographyProps, Typography } from '@mui/material';
import { FC } from 'react';

const InvalidInputMessage: FC<TypographyProps> = (props) => {
    return (
        <Typography
            variant="caption"
            sx={{
                color: (theme) => theme.colors.warning[700],
            }}
            {...props}>
            {props.children}
        </Typography>
    );
};

export default InvalidInputMessage;
