import { Box, styled } from '@mui/material';

export const DashedBorderWrapper = styled(Box)(({ theme }) => ({
    border: `1px dashed ${theme.colors.grey.A400}`,
    borderRadius: theme.spacing(1),
}));
