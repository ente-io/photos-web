import React from 'react';
import { styled } from '@mui/material';
import EnteButton from 'components/EnteButton';
const Container = styled('div')`
    position: fixed;
    bottom: 7%;
    right: 2%;
    align-self: flex-end;
`;

interface Iprops {
    onClick: () => void;
}

export default function ReportAbuse(props: Iprops) {
    return (
        <Container>
            <EnteButton onClick={props.onClick}>report abuse?</EnteButton>
        </Container>
    );
}
