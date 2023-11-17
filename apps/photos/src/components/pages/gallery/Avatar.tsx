import React, { useState, useContext, useLayoutEffect } from 'react';
import { EnteFile } from 'types/file';
import { GalleryContext } from 'pages/gallery';
import { styled } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { logError } from 'utils/sentry';

interface AvatarProps {
    file?: EnteFile;
    email?: string;
    opacity?: number;
}

const PUBLIC_COLLECTED_FILES_AVATAR_COLOR_CODE = '#000000';

const AvatarBase = styled('div')<{
    colorCode: string;
    size: number;
    opacity: number;
}>`
    width: ${({ size }) => `${size}px`};
    height: ${({ size }) => `${size}px`};
    background-color: ${({ colorCode, opacity }) =>
        `${colorCode}${opacity === 100 ? '' : opacity ?? 95}`};
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    font-weight: bold;
    font-size: ${({ size }) => `${Math.floor(size / 2)}px`};
`;

const Avatar: React.FC<AvatarProps> = ({ file, email, opacity }) => {
    const { userIDToEmailMap, user } = useContext(GalleryContext);
    const theme = useTheme();

    const [colorCode, setColorCode] = useState('');
    const [userLetter, setUserLetter] = useState('');

    useLayoutEffect(() => {
        try {
            if (!file) {
                return;
            }
            if (file.ownerID !== user.id) {
                // getting email from in-memory id-email map
                const email = userIDToEmailMap.get(file.ownerID);
                if (!email) {
                    logError(Error(), 'email not found in userIDToEmailMap');
                    return;
                }
                const colorIndex =
                    file.ownerID % theme.colors.avatarColors.length;
                const colorCode = theme.colors.avatarColors[colorIndex];
                setUserLetter(email[0].toUpperCase());
                setColorCode(colorCode);
            } else if (file.ownerID === user.id) {
                const uploaderName = file.pubMagicMetadata.data.uploaderName;
                if (!uploaderName) {
                    logError(
                        Error(),
                        'uploaderName not found in file.pubMagicMetadata.data'
                    );
                    return;
                }
                setUserLetter(uploaderName[0].toUpperCase());
                setColorCode(PUBLIC_COLLECTED_FILES_AVATAR_COLOR_CODE);
            }
        } catch (err) {
            logError(err, 'AvatarIcon.tsx - useLayoutEffect file failed');
        }
    }, [file]);

    useLayoutEffect(() => {
        try {
            if (!email) {
                return;
            }
            if (user.email === email) {
                setUserLetter(email[0].toUpperCase());
                setColorCode(PUBLIC_COLLECTED_FILES_AVATAR_COLOR_CODE);
                return;
            }

            const id = Array.from(userIDToEmailMap.keys()).find(
                (key) => userIDToEmailMap.get(key) === email
            );
            if (!id) {
                logError(Error(), `ID not found for email: ${email}`);
                return;
            }
            const colorIndex = id % theme.colors.avatarColors.length;
            const colorCode = theme.colors.avatarColors[colorIndex];
            setUserLetter(email[0].toUpperCase());
            setColorCode(colorCode);
        } catch (err) {
            logError(err, 'AvatarIcon.tsx - useLayoutEffect email failed');
        }
    }, [email]);

    if (!colorCode || !userLetter) {
        return <></>;
    }

    return (
        <AvatarBase size={18} colorCode={colorCode} opacity={opacity}>
            {userLetter}
        </AvatarBase>
    );
};

export default Avatar;
