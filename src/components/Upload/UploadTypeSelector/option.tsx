import React from 'react';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { FluidContainer } from 'components/Container';
import EnteButton, { EnteButtonProps } from 'components/EnteButton';

export function UploadTypeOption({ children, ...props }: EnteButtonProps) {
    return (
        <EnteButton
            size="large"
            variant="secondary"
            endIcon={<ChevronRight />}
            {...props}>
            <FluidContainer>{children}</FluidContainer>
        </EnteButton>
    );
}
