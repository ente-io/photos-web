import { Box, Typography } from '@mui/material';
import { FlexWrapper } from 'components/Container';
import React from 'react';
import { t } from 'i18next';
interface Iprops {
    name: string;
    fileCount: number;
    endIcon?: React.ReactNode;
}

export function CollectionInfo({ name, fileCount, endIcon }: Iprops) {
    return (
        <div>
            <Typography variant="h3" color="text.base">
                {name}
            </Typography>

            <FlexWrapper>
                <Typography variant="small" color="text.muted">
                    {t('photos_count', { count: fileCount })}
                </Typography>
                {endIcon && (
                    <Box
                        sx={(theme) => ({
                            svg: {
                                fontSize: '17px',
                                color: theme.colors.stroke.faint,
                            },
                        })}
                        ml={'3px'}>
                        {endIcon}
                    </Box>
                )}
            </FlexWrapper>
        </div>
    );
}
