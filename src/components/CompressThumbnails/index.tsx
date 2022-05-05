import constants from 'utils/strings/constants';
import React, { useEffect, useState } from 'react';
import {
    getLargeThumbnailFiles,
    replaceThumbnail,
} from 'services/migrateThumbnailService';
import { getData, LS_KEYS } from 'utils/storage/localStorage';
import { logError } from 'utils/sentry';
import { useLocalState } from 'hooks/useLocalState';
import CompressionRunning from './running';
import CompressThumbnailsFooter from './footer';
import { CompressThumbnailsMessage } from './message';
import MessageDialogBase from 'components/MessageDialog/MessageDialogBase';
import { DialogContent, DialogContentText, DialogTitle } from '@mui/material';

export type SetProgressTracker = React.Dispatch<
    React.SetStateAction<{
        current: number;
        total: number;
    }>
>;
interface Props {
    isOpen: boolean;
    show: () => void;
    hide: () => void;
}
export enum COMPRESSION_STATE {
    NOT_STARTED,
    COMPRESS_LATER,
    NOOP,
    RUNNING,
    COMPLETED,
    COMPLETED_WITH_ERRORS,
}

export default function CompressThumbnails(props: Props) {
    const [compressionState, setCompressionState] = useLocalState(
        LS_KEYS.THUMBNAIL_COMPRESS_STATE,
        COMPRESSION_STATE.NOT_STARTED
    );
    const [progressTracker, setProgressTracker] = useState({
        current: 0,
        total: 0,
    });
    const [largeThumbnailFiles, setLargeThumbnailFiles] = useState<number[]>(
        []
    );

    useEffect(() => {
        const state = init();

        if (state === COMPRESSION_STATE.NOT_STARTED) {
            main();
        }
    }, []);

    useEffect(() => {
        if (props.isOpen && compressionState !== COMPRESSION_STATE.RUNNING) {
            main();
        }
    }, [props.isOpen]);

    const init = (): COMPRESSION_STATE => {
        let compressionState = getData(LS_KEYS.THUMBNAIL_COMPRESS_STATE)?.value;
        if (
            !compressionState ||
            compressionState === COMPRESSION_STATE.RUNNING
        ) {
            compressionState = COMPRESSION_STATE.NOT_STARTED;
        }
        if (compressionState === COMPRESSION_STATE.COMPLETED) {
            compressionState = COMPRESSION_STATE.NOOP;
        }
        setCompressionState(compressionState);
        return compressionState;
    };

    const main = async () => {
        const largeThumbnailFiles = await fetchLargeThumbnail();
        if (largeThumbnailFiles.length) {
            if (compressionState === COMPRESSION_STATE.NOT_STARTED) {
                props.show();
            }
            if (
                compressionState === COMPRESSION_STATE.COMPLETED ||
                compressionState === COMPRESSION_STATE.NOOP
            ) {
                setCompressionState(COMPRESSION_STATE.NOT_STARTED);
                logError(Error(), 'large thumbnail files left after migration');
            }
        } else if (compressionState !== COMPRESSION_STATE.NOOP) {
            setCompressionState(COMPRESSION_STATE.NOOP);
        }
    };

    const fetchLargeThumbnail = async () => {
        const largeThumbnailFiles = (await getLargeThumbnailFiles()) ?? [];
        setLargeThumbnailFiles(largeThumbnailFiles);
        return largeThumbnailFiles;
    };

    const startCompression = async () => {
        setCompressionState(COMPRESSION_STATE.RUNNING);
        const completedWithError = await replaceThumbnail(
            setProgressTracker,
            new Set(largeThumbnailFiles ?? [])
        );
        if (typeof completedWithError !== 'undefined') {
            setCompressionState(
                completedWithError
                    ? COMPRESSION_STATE.COMPLETED_WITH_ERRORS
                    : COMPRESSION_STATE.COMPLETED
            );
        }
        await fetchLargeThumbnail();
    };

    const compressLater = () => {
        setCompressionState(COMPRESSION_STATE.COMPRESS_LATER);
        props.hide();
    };

    return (
        <MessageDialogBase
            open={props.isOpen}
            onClose={props.hide}
            maxWidth="sm"
            fullWidth
            staticBackDrop>
            <DialogTitle>{constants.COMPRESS_THUMBNAILS}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    <CompressThumbnailsMessage
                        compressionState={compressionState}
                    />
                </DialogContentText>

                {compressionState === COMPRESSION_STATE.RUNNING && (
                    <CompressionRunning progressTracker={progressTracker} />
                )}
            </DialogContent>
            <CompressThumbnailsFooter
                compressionState={compressionState}
                startCompression={startCompression}
                compressLater={compressLater}
                hide={props.hide}
            />
        </MessageDialogBase>
    );
}
