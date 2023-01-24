import { IconButton } from '@mui/material';
import { CenteredFlex } from 'components/Container';
import { styled } from '@mui/material';
export const Wrapper = styled(CenteredFlex)`
    position: relative;
    background: ${({ theme }) => theme.colors.accent.dark};
    border-radius: ${({ theme }) => theme.shape.borderRadius}px;
    min-height: 80px;
`;
export const CopyButtonWrapper = styled(IconButton)`
    position: absolute;
    top: 0px;
    right: 0px;
    margin-top: ${({ theme }) => theme.spacing(1)};
`;

export const CodeWrapper = styled('div')`
    padding: 16px 36px 16px 16px;
    border-radius: ${({ theme }) => theme.shape.borderRadius}px;
`;
