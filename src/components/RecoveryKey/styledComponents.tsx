import { Box, styled } from '@mui/material';

export const DashedBorderWrapper = styled(Box)(({ theme }) => ({
    border: `1px dashed 6B6B6B`,
    borderRadius: theme.spacing(1),
}));
