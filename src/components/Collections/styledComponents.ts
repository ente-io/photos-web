import { Box } from '@mui/material';
import { styled } from '@mui/material';
import { Overlay } from 'components/Container';
import { SpecialPadding } from 'styles/SpecialPadding';
export const CollectionListWrapper = styled(Box)`
    position: relative;
    overflow: hidden;
    height: 86px;
    width: 100%;
`;

export const CollectionListBarWrapper = styled(Box)`
    ${SpecialPadding}
    margin-bottom: 16px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.divider};
`;

export const CollectionInfoBarWrapper = styled(Box)`
    width: 100%;
    margin-bottom: 12px;
`;

export const ScrollContainer = styled('div')`
    width: 100%;
    height: 120px;
    overflow: auto;
    scroll-behavior: smooth;
    display: flex;
    gap: 4px;
`;

export const CollectionTile = styled('div')`
    display: flex;
    position: relative;
    border-radius: 4px;
    overflow: hidden;
    user-select: none;
    cursor: pointer;
    & > img {
        object-fit: cover;
        width: 100%;
        height: 100%;
        pointer-events: none;
    }
`;

export const ActiveIndicator = styled('div')`
    height: 3px;
    background-color: ${({ theme }) => theme.colors.primary.main};
    margin-top: 18px;
    border-radius: 2px;
`;

export const CollectionBarTile = styled(CollectionTile)`
    width: 90px;
    height: 64px;
`;

export const AllCollectionTile = styled(CollectionTile)`
    width: 150px;
    height: 150px;
`;

export const ResultPreviewTile = styled(CollectionTile)`
    width: 48px;
    height: 48px;
`;

export const CollectionBarTileText = styled(Overlay)`
    padding: 4px;
    background: linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.1) 0%,
        rgba(0, 0, 0, 0.5) 86.46%
    );
`;

export const CollectionBarTileIcon = styled(Overlay)`
    padding: 4px;
    display: flex;
    justify-content: flex-start;
    align-items: flex-end;
    & > .MuiSvgIcon-root {
        font-size: 20px;
    }
`;

export const AllCollectionTileText = styled(Overlay)`
    padding: 8px;
    background: linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.1) 0%,
        rgba(0, 0, 0, 0.5) 86.46%
    );
`;
