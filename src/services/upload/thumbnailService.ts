import { FILE_TYPE } from 'constants/file';
import { CustomError, errorWithContext } from 'utils/error';
import { logError } from 'utils/sentry';
import { BLACK_THUMBNAIL_BASE64 } from 'constants/upload';
import * as FFmpegService from 'services/ffmpeg/ffmpegService';
import { convertBytesToHumanReadable } from 'utils/file/size';
import { isExactTypeHEIC } from 'utils/file';
import { ElectronFile, FileTypeInfo } from 'types/upload';
import { getUint8ArrayView } from '../readerService';
import { getFileNameSize, addLogLine } from 'utils/logging';
import HeicConversionService from 'services/heicConversionService';

const MAX_THUMBNAIL_DIMENSION = 720;
const MIN_COMPRESSION_PERCENTAGE_SIZE_DIFF = 10;
const MAX_THUMBNAIL_SIZE = 100 * 1024;
const MIN_QUALITY = 0.5;
const MAX_QUALITY = 0.7;

const WAIT_TIME_THUMBNAIL_GENERATION = 30 * 1000;

interface Dimension {
    width: number;
    height: number;
}

export async function generateThumbnail(
    file: File | ElectronFile,
    fileTypeInfo: FileTypeInfo
): Promise<{ thumbnail: Uint8Array; hasStaticThumbnail: boolean }> {
    try {
        addLogLine(`generating thumbnail for ${getFileNameSize(file)}`);
        let hasStaticThumbnail = false;
        let canvas = document.createElement('canvas');
        let thumbnail: Uint8Array;
        try {
            if (fileTypeInfo.fileType === FILE_TYPE.IMAGE) {
                const isHEIC = isExactTypeHEIC(fileTypeInfo.exactType);
                canvas = await generateImageThumbnail(file, isHEIC);
            } else {
                try {
                    addLogLine(
                        `ffmpeg generateThumbnail called for ${getFileNameSize(
                            file
                        )}`
                    );

                    const thumbFile =
                        await FFmpegService.generateVideoThumbnail(file);
                    addLogLine(
                        `ffmpeg thumbnail successfully generated ${getFileNameSize(
                            file
                        )}`
                    );
                    canvas = await generateImageThumbnail(thumbFile, false);
                } catch (e) {
                    addLogLine(
                        `ffmpeg thumbnail generated failed  ${getFileNameSize(
                            file
                        )} error: ${e.message}`
                    );
                    logError(e, 'failed to generate thumbnail using ffmpeg', {
                        fileFormat: fileTypeInfo.exactType,
                    });
                    canvas = await generateVideoThumbnail(file);
                }
            }
            const thumbnailBlob = await thumbnailCanvasToBlob(canvas);
            thumbnail = await getUint8ArrayView(thumbnailBlob);
            if (thumbnail.length === 0) {
                throw Error('EMPTY THUMBNAIL');
            }
            addLogLine(
                `thumbnail successfully generated ${getFileNameSize(file)}`
            );
        } catch (e) {
            logError(e, 'uploading static thumbnail', {
                fileFormat: fileTypeInfo.exactType,
            });
            addLogLine(
                `thumbnail generation failed ${getFileNameSize(file)} error: ${
                    e.message
                }`
            );
            thumbnail = Uint8Array.from(atob(BLACK_THUMBNAIL_BASE64), (c) =>
                c.charCodeAt(0)
            );
            hasStaticThumbnail = true;
        }
        return { thumbnail, hasStaticThumbnail };
    } catch (e) {
        logError(e, 'Error generating static thumbnail');
        throw e;
    }
}

export async function generateImageThumbnail(
    file: File | ElectronFile,
    isHEIC: boolean
) {
    const canvas = document.createElement('canvas');
    const canvasCTX = canvas.getContext('2d');

    let imageURL = null;
    let timeout = null;

    if (isHEIC) {
        addLogLine(`HEICConverter called for ${getFileNameSize(file)}`);
        const convertedBlob = await HeicConversionService.convert(
            new Blob([await file.arrayBuffer()])
        );
        file = new File([convertedBlob], file.name);
        addLogLine(`${getFileNameSize(file)} successfully converted`);
    }
    let image = new Image();
    imageURL = URL.createObjectURL(new Blob([await file.arrayBuffer()]));
    await new Promise((resolve, reject) => {
        image.setAttribute('src', imageURL);
        image.onload = () => {
            try {
                URL.revokeObjectURL(imageURL);
                const imageDimension = {
                    width: image.width,
                    height: image.height,
                };
                const thumbnailDimension = calculateThumbnailDimension(
                    imageDimension,
                    MAX_THUMBNAIL_DIMENSION
                );
                canvas.width = thumbnailDimension.width;
                canvas.height = thumbnailDimension.height;
                canvasCTX.drawImage(
                    image,
                    0,
                    0,
                    thumbnailDimension.width,
                    thumbnailDimension.height
                );
                image = null;
                clearTimeout(timeout);
                resolve(null);
            } catch (e) {
                const err = errorWithContext(
                    e,
                    `${CustomError.THUMBNAIL_GENERATION_FAILED} err: ${e}`
                );
                reject(err);
            }
        };
        timeout = setTimeout(
            () => reject(Error(CustomError.WAIT_TIME_EXCEEDED)),
            WAIT_TIME_THUMBNAIL_GENERATION
        );
    });
    return canvas;
}

export async function generateVideoThumbnail(file: File | ElectronFile) {
    const canvas = document.createElement('canvas');
    const canvasCTX = canvas.getContext('2d');

    let timeout = null;
    let videoURL = null;

    let video = document.createElement('video');
    videoURL = URL.createObjectURL(new Blob([await file.arrayBuffer()]));
    await new Promise((resolve, reject) => {
        video.preload = 'metadata';
        video.src = videoURL;
        video.addEventListener('loadeddata', function () {
            try {
                URL.revokeObjectURL(videoURL);
                if (!video) {
                    throw Error('video load failed');
                }
                const videoDimension = {
                    width: video.videoWidth,
                    height: video.videoHeight,
                };
                const thumbnailDimension = calculateThumbnailDimension(
                    videoDimension,
                    MAX_THUMBNAIL_DIMENSION
                );
                canvas.width = thumbnailDimension.width;
                canvas.height = thumbnailDimension.height;
                canvasCTX.drawImage(
                    video,
                    0,
                    0,
                    thumbnailDimension.width,
                    thumbnailDimension.height
                );
                video = null;
                clearTimeout(timeout);
                resolve(null);
            } catch (e) {
                const err = Error(
                    `${CustomError.THUMBNAIL_GENERATION_FAILED} err: ${e}`
                );
                logError(e, CustomError.THUMBNAIL_GENERATION_FAILED);
                reject(err);
            }
        });
        timeout = setTimeout(
            () => reject(Error(CustomError.WAIT_TIME_EXCEEDED)),
            WAIT_TIME_THUMBNAIL_GENERATION
        );
    });
    return canvas;
}

async function thumbnailCanvasToBlob(canvas: HTMLCanvasElement) {
    let thumbnailBlob: Blob = null;
    let prevSize = Number.MAX_SAFE_INTEGER;
    let quality = MAX_QUALITY;

    do {
        if (thumbnailBlob) {
            prevSize = thumbnailBlob.size;
        }
        thumbnailBlob = await new Promise((resolve) => {
            canvas.toBlob(
                function (blob) {
                    resolve(blob);
                },
                'image/jpeg',
                quality
            );
        });
        thumbnailBlob = thumbnailBlob ?? new Blob([]);
        quality -= 0.1;
    } while (
        quality >= MIN_QUALITY &&
        thumbnailBlob.size > MAX_THUMBNAIL_SIZE &&
        percentageSizeDiff(thumbnailBlob.size, prevSize) >=
            MIN_COMPRESSION_PERCENTAGE_SIZE_DIFF
    );
    if (thumbnailBlob.size > MAX_THUMBNAIL_SIZE) {
        logError(
            Error('thumbnail_too_large'),
            'thumbnail greater than max limit',
            { thumbnailSize: convertBytesToHumanReadable(thumbnailBlob.size) }
        );
    }

    return thumbnailBlob;
}

function percentageSizeDiff(
    newThumbnailSize: number,
    oldThumbnailSize: number
) {
    return ((oldThumbnailSize - newThumbnailSize) * 100) / oldThumbnailSize;
}

// method to calculate new size of image for limiting it to maximum width and height, maintaining aspect ratio
// returns {0,0} for invalid inputs
function calculateThumbnailDimension(
    originalDimension: Dimension,
    maxDimension: number
): Dimension {
    if (originalDimension.height === 0 || originalDimension.width === 0) {
        return { width: 0, height: 0 };
    }
    const widthScaleFactor = maxDimension / originalDimension.width;
    const heightScaleFactor = maxDimension / originalDimension.height;
    const scaleFactor = Math.min(widthScaleFactor, heightScaleFactor);
    const thumbnailDimension = {
        width: Math.round(originalDimension.width * scaleFactor),
        height: Math.round(originalDimension.height * scaleFactor),
    };
    if (thumbnailDimension.width === 0 || thumbnailDimension.height === 0) {
        return { width: 0, height: 0 };
    }
    return thumbnailDimension;
}
