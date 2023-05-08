import React, { useEffect, useMemo, useState } from 'react';
import { updateFilePublicMagicMetadata } from 'services/fileService';
import { EnteFile } from 'types/file';
import {
    changeFileName,
    splitFilenameAndExtension,
    updateExistingFilePubMetadata,
} from 'utils/file';
import { FlexWrapper } from 'components/Container';
import { logError } from 'utils/sentry';
import { FILE_TYPE } from 'constants/file';
import InfoItem from './InfoItem';
import { makeHumanReadableStorage } from 'utils/billing';
import Box from '@mui/material/Box';
import { FileNameEditDialog } from './FileNameEditDialog';
import VideocamOutlined from '@mui/icons-material/VideocamOutlined';
import PhotoOutlined from '@mui/icons-material/PhotoOutlined';
import { ParsedEXIFData } from 'services/upload/exifService';
import { Dimensions } from 'types/upload';

const getFileTitle = (filename, extension) => {
    if (extension) {
        return filename + '.' + extension;
    } else {
        return filename;
    }
};

export const getMegaPixels = (dimensions: Dimensions) =>
    `${Math.round((dimensions.width * dimensions.height) / 1000000)}MP`;

export const getResolution = (dimensions: Dimensions) =>
    `${dimensions.width} x ${dimensions.height}`;

const getCaption = (file: EnteFile, parsedExifData: ParsedEXIFData) => {
    const captionParts = useMemo(() => {
        let megaPixels: string;
        let resolution: string;
        if (file && file.metadata && file.metadata.w && file.metadata.h) {
            const dimensions = {
                width: file.metadata.w,
                height: file.metadata.h,
            };
            megaPixels = getMegaPixels(dimensions);
            resolution = getResolution(dimensions);
        } else if (
            parsedExifData &&
            parsedExifData.imageHeight &&
            parsedExifData.imageWidth
        ) {
            const dimensions = {
                width: parsedExifData.imageWidth,
                height: parsedExifData.imageHeight,
            };
            megaPixels = getMegaPixels(dimensions);
            resolution = getResolution(dimensions);
        }
        const fileSize = file?.info?.fileSize;

        const captionParts = [];
        if (megaPixels) {
            captionParts.push(megaPixels);
        }
        if (resolution) {
            captionParts.push(resolution);
        }
        if (fileSize) {
            captionParts.push(makeHumanReadableStorage(fileSize));
        }
        return captionParts;
    }, [parsedExifData, file]);

    return (
        <FlexWrapper gap={1}>
            {captionParts.map((caption) => (
                <Box key={caption}> {caption}</Box>
            ))}
        </FlexWrapper>
    );
};

export function RenderFileName({
    parsedExifData,
    shouldDisableEdits,
    file,
    scheduleUpdate,
}: {
    parsedExifData: Record<string, any>;
    shouldDisableEdits: boolean;
    file: EnteFile;
    scheduleUpdate: () => void;
}) {
    const [isInEditMode, setIsInEditMode] = useState(false);
    const openEditMode = () => setIsInEditMode(true);
    const closeEditMode = () => setIsInEditMode(false);
    const [filename, setFilename] = useState<string>();
    const [extension, setExtension] = useState<string>();

    useEffect(() => {
        const [filename, extension] = splitFilenameAndExtension(
            file.metadata.title
        );
        setFilename(filename);
        setExtension(extension);
    }, []);

    const saveEdits = async (newFilename: string) => {
        try {
            if (file) {
                if (filename === newFilename) {
                    closeEditMode();
                    return;
                }
                setFilename(newFilename);
                const newTitle = getFileTitle(newFilename, extension);
                let updatedFile = await changeFileName(file, newTitle);
                updatedFile = (
                    await updateFilePublicMagicMetadata([updatedFile])
                )[0];
                updateExistingFilePubMetadata(file, updatedFile);
                scheduleUpdate();
            }
        } catch (e) {
            logError(e, 'failed to update file name');
            throw e;
        }
    };

    return (
        <>
            <InfoItem
                icon={
                    file.metadata.fileType === FILE_TYPE.VIDEO ? (
                        <VideocamOutlined />
                    ) : (
                        <PhotoOutlined />
                    )
                }
                title={getFileTitle(filename, extension)}
                caption={getCaption(file, parsedExifData)}
                openEditor={openEditMode}
                hideEditOption={shouldDisableEdits || isInEditMode}
            />
            <FileNameEditDialog
                isInEditMode={isInEditMode}
                closeEditMode={closeEditMode}
                filename={filename}
                extension={extension}
                saveEdits={saveEdits}
            />
        </>
    );
}
