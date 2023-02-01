import React, { FC } from 'react';
import { Theme, TypographyVariant } from '@mui/material';
import { FluidContainer } from 'components/Container';
import { SystemStyleObject } from '@mui/system';
import EnteButton, { EnteButtonProps } from 'components/EnteButton';

interface Iprops extends EnteButtonProps {
    typographyVariant?: TypographyVariant;
}

const SidebarButton: FC<Iprops> = ({
    children,
    sx,
    typographyVariant = 'body1',
    ...props
}) => {
    return (
        <>
            <EnteButton
                variant="tertiary"
                size="large"
                sx={(theme) =>
                    ({
                        ...theme.typography[typographyVariant],
                        fontWeight: 'bold',
                        px: 1.5,
                        ...sx,
                    } as SystemStyleObject<Theme>)
                }
                {...props}>
                <FluidContainer>{children}</FluidContainer>
            </EnteButton>
        </>
    );
};

export default SidebarButton;
