import React, { useContext } from 'react';
import { Button, Stack, styled, Typography } from '@mui/material';
import { DeduplicateContext } from 'pages/deduplicate';
import VerticallyCentered, { FlexWrapper } from './Container';
import { Box } from '@mui/material';
import uploadManager from 'services/upload/uploadManager';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import { UploadTypeSelectorIntent } from 'types/gallery';
import { Trans } from 'react-i18next';
import { t } from 'i18next';
import { EnteLogo } from './EnteLogo';

const Wrapper = styled(Box)`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
`;
const NonDraggableImage = styled('img')`
    pointer-events: none;
`;

export default function EmptyScreen({ openUploader }) {
    const deduplicateContext = useContext(DeduplicateContext);
    return deduplicateContext.isOnDeduplicatePage ? (
        <VerticallyCentered>
            <div
                style={{
                    color: '#a6a6a6',
                    fontSize: '18px',
                }}>
                {t('NO_DUPLICATES_FOUND')}
            </div>
        </VerticallyCentered>
    ) : (
        <Wrapper>
            <Stack
                sx={{
                    flex: 'none',
                    pt: 1.5,
                    pb: 1.5,
                }}>
                <VerticallyCentered sx={{ flex: 'none' }}>
                    <Typography variant="h3" color="text.secondary" mb={1}>
                        <Trans
                            i18nKey="WELCOME_TO_ENTE_HEADING"
                            components={{ a: <EnteLogo /> }}
                        />
                    </Typography>
                    <Typography variant="title">
                        {t('WELCOME_TO_ENTE_SUBHEADING')}
                    </Typography>
                </VerticallyCentered>
                <Typography variant="body1" mt={3.5} color="text.secondary">
                    {t('WHERE_YOUR_BEST_PHOTOS_LIVE')}
                </Typography>
            </Stack>
            <NonDraggableImage
                height={287.57}
                src="/images/empty-state/ente_duck.png"
                srcSet="/images/empty-state/ente_duck@2x.png,
                                /images/empty-state/ente_duck@3x.png"
            />

            <VerticallyCentered paddingTop={1.5} paddingBottom={1.5}>
                <Button
                    style={{
                        cursor:
                            !uploadManager.shouldAllowNewUpload() &&
                            'not-allowed',
                    }}
                    color="accent"
                    onClick={() =>
                        openUploader(UploadTypeSelectorIntent.normalUpload)
                    }
                    disabled={!uploadManager.shouldAllowNewUpload()}
                    sx={{
                        mt: 1.5,
                        p: 1,
                        width: 320,
                        borderRadius: 0.5,
                    }}>
                    <FlexWrapper sx={{ gap: 1 }} justifyContent="center">
                        <AddPhotoAlternateIcon />
                        {t('UPLOAD_FIRST_PHOTO')}
                    </FlexWrapper>
                </Button>
                <Button
                    style={{
                        cursor:
                            !uploadManager.shouldAllowNewUpload() &&
                            'not-allowed',
                    }}
                    onClick={() =>
                        openUploader(UploadTypeSelectorIntent.import)
                    }
                    disabled={!uploadManager.shouldAllowNewUpload()}
                    sx={{
                        mt: 1.5,
                        p: 1,
                        width: 320,
                        borderRadius: 0.5,
                    }}>
                    <FlexWrapper sx={{ gap: 1 }} justifyContent="center">
                        <FolderIcon />
                        {t('IMPORT_YOUR_FOLDERS')}
                    </FlexWrapper>
                </Button>
            </VerticallyCentered>
        </Wrapper>
    );
}
