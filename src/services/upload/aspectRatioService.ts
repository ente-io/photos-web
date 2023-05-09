import { FILE_TYPE } from 'constants/file';
import { CustomError, errorWithContext } from 'utils/error';
import { logError } from 'utils/sentry';
// import { BLACK_THUMBNAIL_BASE64 } from 'constants/upload';
import * as FFmpegService from 'services/ffmpeg/ffmpegService';
import ElectronImageProcessorService from 'services/electron/imageProcessor';
// import { convertBytesToHumanReadable } from 'utils/file/size';
import { isExactTypeHEIC } from 'utils/file';
import { ElectronFile, FileTypeInfo } from 'types/upload';
// import { getUint8ArrayView } from '../readerService';
import { getFileNameSize, addLogLine } from 'utils/logging';
import HeicConversionService from 'services/heicConversionService';
import { Dimensions } from 'types/upload';

const WAIT_TIME_ASPECT_RATIO_EXTRACTION = 30 * 1000;

export async function getDimensions(
    file: File | ElectronFile,
    fileTypeInfo: FileTypeInfo
): Promise<Dimensions> {
    try {
        addLogLine(`extracting dimension for ${getFileNameSize(file)}`);
        let dimension: Dimensions;
        if (fileTypeInfo.fileType === FILE_TYPE.IMAGE) {
            dimension = await getImageDimensions(file, fileTypeInfo);
        } else {
            dimension = await getVideoDimensions(file, fileTypeInfo);
        }
        addLogLine(`dimension successfully extracted ${getFileNameSize(file)}`);
        return dimension;
    } catch (e) {
        logError(e, 'failed to extract dimension');
    }
}

async function getImageDimensions(
    file: File | ElectronFile,
    fileTypeInfo: FileTypeInfo
) {
    if (ElectronImageProcessorService.generateImageThumbnailAPIExists()) {
        try {
            return await ElectronImageProcessorService.extractImageDimensions(
                file
            );
        } catch (e) {
            return await extractImageDimensionUsingCanvas(file, fileTypeInfo);
        }
    } else {
        return await extractImageDimensionUsingCanvas(file, fileTypeInfo);
    }
}

export async function extractImageDimensionUsingCanvas(
    file: File | ElectronFile,
    fileTypeInfo: FileTypeInfo
): Promise<Dimensions> {
    let imageURL = null;
    let timeout = null;
    const isHEIC = isExactTypeHEIC(fileTypeInfo.exactType);
    if (isHEIC) {
        addLogLine(`HEICConverter called for ${getFileNameSize(file)}`);
        const convertedBlob = await HeicConversionService.convert(
            new Blob([await file.arrayBuffer()])
        );
        file = new File([convertedBlob], file.name);
        addLogLine(`${getFileNameSize(file)} successfully converted`);
    }
    const image = new Image();
    imageURL = URL.createObjectURL(new Blob([await file.arrayBuffer()]));
    return await new Promise((resolve, reject) => {
        image.setAttribute('src', imageURL);
        image.onload = () => {
            try {
                clearTimeout(timeout);
                resolve({
                    width: image.width,
                    height: image.height,
                });
            } catch (e) {
                const err = errorWithContext(
                    e,
                    `${CustomError.EXTRACT_DIMENSION_FAILED} err: ${e}`
                );
                reject(err);
            }
        };
        timeout = setTimeout(
            () => reject(Error(CustomError.WAIT_TIME_EXCEEDED)),
            WAIT_TIME_ASPECT_RATIO_EXTRACTION
        );
    });
}

async function getVideoDimensions(
    file: File | ElectronFile,
    fileTypeInfo: FileTypeInfo
) {
    try {
        addLogLine(`extracting video dimension for ${getFileNameSize(file)}`);

        const dimension = await FFmpegService.extractVideoDimension(file);
        addLogLine(
            `video dimension successfully extracted ${getFileNameSize(file)}`
        );
        return dimension;
    } catch (e) {
        addLogLine(
            `ffmpeg dimension extraction failed  ${getFileNameSize(
                file
            )} error: ${e.message}`
        );
        logError(e, 'failed to extract dimension using ffmpeg', {
            fileFormat: fileTypeInfo.exactType,
        });
        return await extractVideoDimensionUsingCanvas(file);
    }
}

export async function extractVideoDimensionUsingCanvas(
    file: File | ElectronFile
): Promise<Dimensions> {
    let timeout = null;
    let videoURL = null;

    const video = document.createElement('video');
    videoURL = URL.createObjectURL(new Blob([await file.arrayBuffer()]));
    return await new Promise((resolve, reject) => {
        video.preload = 'metadata';
        video.src = videoURL;
        video.addEventListener('loadeddata', function () {
            try {
                URL.revokeObjectURL(videoURL);
                if (!video) {
                    throw Error('video load failed');
                }
                clearTimeout(timeout);
                resolve({
                    width: video.videoWidth,
                    height: video.videoHeight,
                });
            } catch (e) {
                const err = Error(
                    `${CustomError.EXTRACT_DIMENSION_FAILED} err: ${e}`
                );
                logError(e, CustomError.THUMBNAIL_GENERATION_FAILED);
                reject(err);
            }
        });
        timeout = setTimeout(
            () => reject(Error(CustomError.WAIT_TIME_EXCEEDED)),
            WAIT_TIME_ASPECT_RATIO_EXTRACTION
        );
    });
}
