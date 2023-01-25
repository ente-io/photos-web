import { MenuItem, Typography, Box } from '@mui/material';
import { FluidContainer } from 'components/Container';
import { OverflowMenuContext } from 'contexts/overflowMenu';
import React, { useContext } from 'react';
import {
    getOverflowMenuOptionSxProps,
    OverflowMenuOptionProps,
} from './constants';

interface Iprops {
    onClick: () => void;
    type?: OverflowMenuOptionProps['type'];
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    keepOpenAfterClick?: boolean;
    children?: any;
}
export function OverflowMenuOption({
    onClick,
    type = 'primary',
    startIcon,
    endIcon,
    keepOpenAfterClick,
    children,
}: Iprops) {
    const menuContext = useContext(OverflowMenuContext);

    const handleClick = () => {
        onClick();
        if (!keepOpenAfterClick) {
            menuContext.close();
        }
    };

    const sxProps = getOverflowMenuOptionSxProps({ type });

    return (
        <MenuItem onClick={handleClick} sx={sxProps}>
            <FluidContainer>
                {startIcon && (
                    <Box
                        sx={{
                            padding: 0,
                            marginRight: 1.5,
                        }}>
                        {startIcon}
                    </Box>
                )}
                <Typography variant="button">{children}</Typography>
            </FluidContainer>
            {endIcon && (
                <Box
                    sx={{
                        padding: 0,
                        marginLeft: 1,
                    }}>
                    {endIcon}
                </Box>
            )}
        </MenuItem>
    );
}
