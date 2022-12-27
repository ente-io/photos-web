import { ENTE_WEBSITE_LINK } from 'constants/urls';
import React, { useEffect, useState } from 'react';
import { Button, styled } from '@mui/material';
import { getDeviceOS, OS } from 'utils/common/deviceDetection';
import constants from 'utils/strings/constants';

export const NoStyleAnchor = styled('a')`
    color: inherit;
    text-decoration: none !important;
    &:hover {
        color: #fff !important;
    }
`;

function GoToEnte() {
    const [os, setOS] = useState<OS>(OS.UNKNOWN);

    useEffect(() => {
        const os = getDeviceOS();
        setOS(os);
    }, []);

    const getButtonText = (os: OS) => {
        if (os === OS.ANDROID || os === OS.IOS) {
            return constants.INSTALL;
        } else {
            return constants.SIGN_UP;
        }
    };

    return (
        <Button
            color="accent"
            LinkComponent={NoStyleAnchor}
            href={ENTE_WEBSITE_LINK}>
            {getButtonText(os)}
        </Button>
    );
}

export default GoToEnte;
