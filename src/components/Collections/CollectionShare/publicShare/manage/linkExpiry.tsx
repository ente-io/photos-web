import { Box, Typography } from '@mui/material';
import React from 'react';
import Select from 'react-select';
import { linkExpiryStyle } from 'styles/linkExpiry';
import { shareExpiryOptions } from 'utils/collection';
import constants from 'utils/strings/constants';
import { dateStringWithMMH } from 'utils/time';
import { OptionWithDivider } from './selectComponents/OptionWithDivider';

export function ManageLinkExpiry({
    publicShareProp,
    collection,
    updatePublicShareURLHelper,
}) {
    const updateDeviceExpiry = async (optionFn) => {
        return updatePublicShareURLHelper({
            collectionID: collection.id,
            validTill: optionFn(),
        });
    };
    return (
        <Box>
            <Typography mb={0.5}>{constants.LINK_EXPIRY}</Typography>
            <Select
                menuPosition="fixed"
                options={shareExpiryOptions}
                isSearchable={false}
                value={null}
                components={{
                    Option: OptionWithDivider,
                }}
                placeholder={
                    publicShareProp?.validTill
                        ? dateStringWithMMH(publicShareProp?.validTill)
                        : 'never'
                }
                onChange={(e) => {
                    updateDeviceExpiry(e.value);
                }}
                styles={linkExpiryStyle}
            />
        </Box>
    );
}
