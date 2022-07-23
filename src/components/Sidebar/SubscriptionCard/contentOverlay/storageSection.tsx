import { Box, styled, Typography } from '@mui/material';
import React from 'react';
import { convertBytesToGBs, makeHumanReadableStorage } from 'utils/billing';
import constants from 'utils/strings/constants';

const MobileSmallBox = styled(Box)`
    display: none;
    @media (max-width: 359px) {
        display: block;
    }
`;

const DefaultBox = styled(Box)`
    display: none;
    @media (min-width: 360px) {
        display: block;
    }
`;
interface Iprops {
    usage: number;
    storage: number;
}
export default function StorageSection({ usage, storage }: Iprops) {
    return (
        <Box width="100%">
            <Typography variant="body2" color={'text.secondary'}>
                {constants.STORAGE}
            </Typography>

            <Typography
                fontWeight={'bold'}
                sx={{ fontSize: '24px', lineHeight: '30px' }}>
                <DefaultBox>
                    {`${makeHumanReadableStorage(usage, 'round-up')} ${
                        constants.OF
                    } ${makeHumanReadableStorage(storage)} ${constants.USED}`}
                </DefaultBox>
                <MobileSmallBox>
                    {`${convertBytesToGBs(usage)} /  ${convertBytesToGBs(
                        storage
                    )} ${constants.GB} ${constants.USED}`}
                </MobileSmallBox>
            </Typography>
        </Box>
    );
}
