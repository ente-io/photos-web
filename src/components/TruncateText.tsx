import React from 'react';
import { Box, styled, Typography } from '@mui/material';

const Ellipse = styled(Typography)`
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; //number of lines to show
    line-clamp: 2;
    -webkit-box-orient: vertical;
`;

export default function TruncateText({ text }) {
    return (
        <Box height={'2.1em'} overflow="hidden">
            <Ellipse variant="small" sx={{ wordBreak: 'break-word' }}>
                {text}
            </Ellipse>
        </Box>
    );
}
