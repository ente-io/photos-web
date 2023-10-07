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
import { useEffect, useMemo, useState } from 'react';
import ImagePreviewer from './ImagePreviewer';
import { t } from 'i18next';
import CloseIcon from '@mui/icons-material/Close';
import { resolveFileType } from 'friendly-mimes';
import AudioPreviewer from './AudioPreviewer';
import VideoPreviewer from './VideoPreviewer';
import PDFPreviewer from './PDFPreviewer';

interface IProps {
    file: EnteFile | null;
    show: boolean;
    onHide: () => void;
}

const Previewer = (props: IProps) => {
    const [renderableFileURL, setRenderableFileURL] = useState<string | null>(
        null
    );

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!props.show) return setLoading(false);
        if (!props.file) return setLoading(false);

        downloadFileAsBlob(props.file).then((blob) => {
            try {
                const url = URL.createObjectURL(blob);
                setRenderableFileURL(url);
            } catch (e) {
                console.error(e);
            }

            setLoading(false);
        });
    }, [props.file]);

    const previewElement: JSX.Element | null = useMemo(() => {
        if (!renderableFileURL) return null;
        if (!props.file) return null;

        const name = props.file.metadata.title;

        const extension = '.' + name.split('.').pop();

        if (!extension) return null;

        let fileTypeObj: any = {};

        try {
            fileTypeObj = resolveFileType(extension);
        } catch (e) {
            console.log(e);
            setRenderableFileURL(null);
            return null;
        }

        const mime = fileTypeObj.mime;

        if (mime.startsWith('image')) {
            return <ImagePreviewer url={renderableFileURL} />;
        }

        if (mime.startsWith('audio')) {
            return <AudioPreviewer url={renderableFileURL} />;
        }

        if (mime.startsWith('video')) {
            return <VideoPreviewer url={renderableFileURL} />;
        }

        if (mime === 'application/pdf') {
            return <PDFPreviewer url={renderableFileURL} />;
        }

        return null;
    }, [renderableFileURL, props.file]);

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
                        {loading ? (
                            <CircularProgress />
                        ) : (
                            <>
                                {renderableFileURL ? (
                                    <Box
                                        sx={{
                                            maxHeight: '90%',
                                            maxWidth: '90%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                        {previewElement}
                                    </Box>
                                ) : (
                                    <Box textAlign="center">
                                        <Typography>
                                            {props.file?.info?.fileSize >
                                            20000000
                                                ? t('FILE_TOO_LARGE_TO_PREVIEW')
                                                : t('UNABLE_TO_PREVIEW')}
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
                            </>
                        )}
                    </Box>
                </Box>
            </Backdrop>
        </>
    );
};

export default Previewer;
