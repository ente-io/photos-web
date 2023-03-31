import { SvgIconProps, Typography } from '@mui/material';
import { FlexWrapper } from 'components/Container';
import React from 'react';
import { LegendIndicator } from '../../../styledComponents';

interface Iprops extends SvgIconProps {
    label: string;
}
export function Legend({ label, ...props }: Iprops) {
    return (
        <FlexWrapper>
            <LegendIndicator {...props} />
            <Typography variant="mini" fontWeight={'bold'}>
                {label}
            </Typography>
        </FlexWrapper>
    );
}
