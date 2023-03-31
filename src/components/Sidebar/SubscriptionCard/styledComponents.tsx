import { LinearProgress, Theme, styled } from '@mui/material';
import { DotSeparator } from '../styledComponents';

export const Progressbar = styled(LinearProgress)(
    ({ theme }: { theme: Theme }) => ({
        '.MuiLinearProgress-bar': {
            borderRadius: '2px',
        },
        borderRadius: '2px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        '.MuiLinearProgress-bar ': {
            backgroundColor: theme.colors.white.base,
        },
    })
);

Progressbar.defaultProps = {
    variant: 'determinate',
};

export const LegendIndicator = styled(DotSeparator)`
    font-size: 8.71px;
    margin: 0;
    margin-right: 4px;
    color: inherit;
`;
