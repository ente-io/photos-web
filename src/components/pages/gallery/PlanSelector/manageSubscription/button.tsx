import ChevronRight from '@mui/icons-material/ChevronRight';
import { FluidContainer } from 'components/Container';
import EnteButton, { EnteButtonProps } from 'components/EnteButton';
import React from 'react';

const ManageSubscriptionButton = ({ children, ...props }: EnteButtonProps) => (
    <EnteButton size="large" endIcon={<ChevronRight />} {...props}>
        <FluidContainer>{children}</FluidContainer>
    </EnteButton>
);

export default ManageSubscriptionButton;
