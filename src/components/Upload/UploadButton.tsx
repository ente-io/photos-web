import React from 'react';
import { IconButton, styled } from '@mui/material';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import constants from 'utils/strings/constants';
import uploadManager from 'services/upload/uploadManager';
import EnteButton, { EnteButtonProps } from 'components/EnteButton';

const Wrapper = styled('div')<{ $disableShrink: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 1s ease;
    cursor: pointer;
    & .mobile-button {
        display: none;
    }
    ${({ $disableShrink }) =>
        !$disableShrink &&
        `@media (max-width: 624px) {
        & .mobile-button {
            display: block;
        }
        & .desktop-button {
            display: none;
        }
    }`}
`;

interface Iprops {
    openUploader: () => void;
    text?: string;
    variant?: EnteButtonProps['variant'];
    disableShrink?: boolean;
    icon?: JSX.Element;
}
function UploadButton({
    openUploader,
    text,
    variant,
    disableShrink,
    icon,
}: Iprops) {
    return (
        <Wrapper
            $disableShrink={disableShrink}
            style={{
                cursor: !uploadManager.shouldAllowNewUpload() && 'not-allowed',
            }}>
            <EnteButton
                onClick={openUploader}
                disabled={!uploadManager.shouldAllowNewUpload()}
                className="desktop-button"
                variant={variant ?? 'secondary'}
                startIcon={icon ?? <FileUploadOutlinedIcon />}>
                {text ?? constants.UPLOAD}
            </EnteButton>

            <IconButton
                onClick={openUploader}
                disabled={!uploadManager.shouldAllowNewUpload()}
                className="mobile-button">
                <FileUploadOutlinedIcon />
            </IconButton>
        </Wrapper>
    );
}

export default UploadButton;
