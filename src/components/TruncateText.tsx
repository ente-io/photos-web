import Tooltip from '@mui/material/Tooltip';
import React from 'react';
import { Box, styled, Theme, Typography } from '@mui/material';
const Ellipse = styled(Typography)(
    ({ theme }: { theme: Theme }) => `
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; //number of lines to show
    line-clamp: 2;
    -webkit-box-orient: vertical;
    color: ${theme.colors.white.base};
`
);

export default function TruncateText({ text }) {
    return (
        <Tooltip title={text}>
            <Box height={'2.1em'} overflow="hidden">
                <Ellipse variant="small" sx={{ wordBreak: 'break-word' }}>
                    {text}
                </Ellipse>
            </Box>
        </Tooltip>
    );
}
