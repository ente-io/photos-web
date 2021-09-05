import React from 'react';
import { Card } from 'react-bootstrap';
import styled from 'styled-components';
import constants from 'utils/strings/constants';
import { CollectionIcon } from './CollectionSelector';

const ImageContainer = styled.div`
    min-height: 192px;
    max-width: 192px;
    border: 1px solid #555;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 42px;
    cursor: pointer;
`;

export default function AddCollectionButton({
    showNextModal,
}: {
    showNextModal: () => void;
}) {
    return (
        <CollectionIcon
            style={{ margin: '10px' }}
            onClick={() => showNextModal()}>
            <Card>
                <ImageContainer>+</ImageContainer>
                <Card.Text style={{ textAlign: 'center' }}>
                    {constants.CREATE_COLLECTION}
                </Card.Text>
            </Card>
        </CollectionIcon>
    );
}
