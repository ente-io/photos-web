import { EnteFile } from '@/interfaces/file';
import { downloadAsFile, downloadFile, downloadFileAsBlob } from '@/utils/file';
import {
    Backdrop,
    Box,
    Button,
    CircularProgress,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import ImagePreviewer from './ImagePreviewer';
import { t } from 'i18next';
import CloseIcon from '@mui/icons-material/Close';

interface IProps {
    file: EnteFile | null;
    show: boolean;
    onHide: () => void;
}

const Previewer = (props: IProps) => {
    const [renderableFileURL, setRenderableFileURL] = useState<string | null>(
        null
    );

    useEffect(() => {
        if (!props.show) return;
        if (!props.file) return;

        downloadFileAsBlob(props.file).then((blob) => {
            try {
                const url = URL.createObjectURL(blob);
                setRenderableFileURL(url);
            } catch (e) {
                console.error(e);
            }
        });
    }, [props.file]);

    return (
        <>
            <Backdrop
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
                open={props.show}>
                <Box
                    sx={{
                        display: 'inline-block',
                        padding: '2rem',
                        boxSizing: 'border-box',
                        width: '100%',
                        height: '100%',
                    }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                        }}>
                        <Typography fontWeight={'bold'}>
                            {props.file?.metadata.title}
                        </Typography>
                        <Box>
                            <Tooltip title={t('CLOSE')}>
                                <IconButton onClick={props.onHide}>
                                    <CloseIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        height="100%"
                        width="100%">
                        {renderableFileURL ? (
                            <>
                                <ImagePreviewer url={renderableFileURL} />
                            </>
                        ) : (
                            <Box textAlign="center">
                                <Typography>
                                    {t('UNABLE_TO_PREVIEW')}
                                </Typography>
                                <Button
                                    onClick={() => {
                                        downloadFile(props.file);
                                    }}
                                    sx={{
                                        marginTop: '1rem',
                                    }}>
                                    {t('DOWNLOAD')}
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Backdrop>
        </>
    );
};

export default Previewer;
