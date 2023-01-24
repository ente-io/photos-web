import { Paper, styled } from '@mui/material';
import { CSSProperties } from '@mui/styled-engine';

export const Badge = styled(Paper)(({ theme }) => ({
    padding: '2px 4px',
    backgroundColor: theme.colors.backdrop.main,
    backdropFilter: `blur(${theme.colors.blur.muted})`,
    color: theme.colors.primary.contrastText,
    textTransform: 'uppercase',
    ...(theme.typography.mini as CSSProperties),
}));
