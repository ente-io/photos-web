import React, { FC } from 'react';
import { ButtonProps, Typography } from '@mui/material';
import SidebarButton from './Button';
import { DotSeparator } from './styledComponents';

type Iprops = ButtonProps<
    'button',
    { label: JSX.Element | string; count: number }
>;

const ShortcutButton: FC<ButtonProps<'button', Iprops>> = ({
    label,
    count,
    ...props
}) => {
    return (
        <SidebarButton
            variant="contained"
            color="secondary"
            sx={{ fontWeight: 'normal' }}
            {...props}>
            {label}

            <Typography sx={{ color: 'text.faint' }} variant="small">
                <DotSeparator />
                {count}
            </Typography>
        </SidebarButton>
    );
};

export default ShortcutButton;
