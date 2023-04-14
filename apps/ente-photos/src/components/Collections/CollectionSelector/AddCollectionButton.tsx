import CollectionCard from 'components/Collections/CollectionCard';
import {
    AllCollectionTile,
    AllCollectionTileText,
} from 'components/Collections/styledComponents';
import React from 'react';
import { styled } from '@mui/material';
import { CenteredFlex, Overlay } from 'components/Container';
import { t } from 'i18next';

const ImageContainer = styled(Overlay)`
    display: flex;
    font-size: 42px;
`;

interface Iprops {
    showNextModal: () => void;
}

export default function AddCollectionButton({ showNextModal }: Iprops) {
    return (
        <CollectionCard
            collectionTile={AllCollectionTile}
            onClick={() => showNextModal()}
            latestFile={null}>
            <AllCollectionTileText>
                {t('CREATE_COLLECTION')}
            </AllCollectionTileText>
            <ImageContainer>
                <CenteredFlex>+</CenteredFlex>
            </ImageContainer>
        </CollectionCard>
    );
}
