import { FILE_TYPE } from 'constants/file';
import { LIVE_PHOTO_ASSET_SIZE_LIMIT } from 'constants/upload';
import { encodeMotionPhoto } from 'services/motionPhotoService';
import { getFileType } from 'services/typeDetectionService';
import {
    ElectronFile,
    FileTypeInfo,
    FileWithCollection,
    LivePhotoAssets,
    ParsedMetadataJSONMap,
} from 'types/upload';
import { CustomError } from 'utils/error';
import { getFileTypeFromExtensionForLivePhotoClustering } from 'utils/file/livePhoto';
import { splitFilenameAndExtension, isImageOrVideo } from 'utils/file';
import { logError } from 'utils/sentry';
import { getUint8ArrayView } from '../readerService';
import { extractFileMetadata } from './fileService';
import { getFileHash } from './hashService';
import { generateThumbnail } from './thumbnailService';
import uploadCancelService from './uploadCancelService';
import { Remote } from 'comlink';
import { DedicatedCryptoWorker } from 'worker/crypto.worker';

interface LivePhotoIdentifier {
    collectionID: number;
    fileType: FILE_TYPE;
    name: string;
    size: number;
}

const UNDERSCORE_THREE = '_3';

const UNDERSCORE = '_';

export async function getLivePhotoFileType(
    livePhotoAssets: LivePhotoAssets
): Promise<FileTypeInfo> {
    const imageFileTypeInfo = await getFileType(livePhotoAssets.image);
    const videoFileTypeInfo = await getFileType(livePhotoAssets.video);
    return {
        fileType: FILE_TYPE.LIVE_PHOTO,
        exactType: `${imageFileTypeInfo.exactType}+${videoFileTypeInfo.exactType}`,
        imageType: imageFileTypeInfo.exactType,
        videoType: videoFileTypeInfo.exactType,
    };
}

export async function extractLivePhotoMetadata(
    worker: Remote<DedicatedCryptoWorker>,
    parsedMetadataJSONMap: ParsedMetadataJSONMap,
    livePhotoAssets: LivePhotoAssets,
    collectionIdentifier: number | string,
    fileTypeInfo: FileTypeInfo
) {
    const imageFileTypeInfo: FileTypeInfo = {
        fileType: FILE_TYPE.IMAGE,
        exactType: fileTypeInfo.imageType,
    };
    const imageMetadata = await extractFileMetadata(
        worker,
        parsedMetadataJSONMap,
        livePhotoAssets.image,
        collectionIdentifier,
        imageFileTypeInfo
    );
    const videoHash = await getFileHash(worker, livePhotoAssets.video);
    return {
        ...imageMetadata,
        title: getLivePhotoName(livePhotoAssets),
        fileType: FILE_TYPE.LIVE_PHOTO,
        imageHash: imageMetadata.hash,
        videoHash: videoHash,
        hash: undefined,
    };
}

export function getLivePhotoSize(livePhotoAssets: LivePhotoAssets) {
    return livePhotoAssets.image.size + livePhotoAssets.video.size;
}

export function getLivePhotoName(livePhotoAssets: LivePhotoAssets) {
    return livePhotoAssets.image.name;
}

export async function readLivePhoto(
    fileTypeInfo: FileTypeInfo,
    livePhotoAssets: LivePhotoAssets
) {
    const { thumbnail, hasStaticThumbnail } = await generateThumbnail(
        livePhotoAssets.image,
        {
            exactType: fileTypeInfo.imageType,
            fileType: FILE_TYPE.IMAGE,
        }
    );

    const image = await getUint8ArrayView(livePhotoAssets.image);

    const video = await getUint8ArrayView(livePhotoAssets.video);

    return {
        filedata: await encodeMotionPhoto({
            image,
            video,
            imageNameTitle: livePhotoAssets.image.name,
            videoNameTitle: livePhotoAssets.video.name,
        }),
        thumbnail,
        hasStaticThumbnail,
    };
}

export async function clusterLivePhotoFiles(mediaFiles: FileWithCollection[]) {
    try {
        const analysedMediaFiles: FileWithCollection[] = [];
        mediaFiles
            .sort(
                (
                    { uploadAsset: firstMediaFile },
                    { uploadAsset: secondMediaFile }
                ) =>
                    splitFilenameAndExtension(
                        firstMediaFile.file.name
                    )[0].localeCompare(
                        splitFilenameAndExtension(secondMediaFile.file.name)[0]
                    )
            )
            .sort(
                (firstMediaFile, secondMediaFile) =>
                    firstMediaFile.collectionID - secondMediaFile.collectionID
            );
        let index = 0;
        while (index < mediaFiles.length - 1) {
            if (uploadCancelService.isUploadCancelationRequested()) {
                throw Error(CustomError.UPLOAD_CANCELLED);
            }
            const firstMediaFile = mediaFiles[index];
            const secondMediaFile = mediaFiles[index + 1];
            const firstFileType =
                getFileTypeFromExtensionForLivePhotoClustering(
                    firstMediaFile.uploadAsset.file.name
                );
            const secondFileType =
                getFileTypeFromExtensionForLivePhotoClustering(
                    secondMediaFile.uploadAsset.file.name
                );
            const firstFileIdentifier: LivePhotoIdentifier = {
                collectionID: firstMediaFile.collectionID,
                fileType: firstFileType,
                name: firstMediaFile.uploadAsset.file.name,
                size: firstMediaFile.uploadAsset.file.size,
            };
            const secondFileIdentifier: LivePhotoIdentifier = {
                collectionID: secondMediaFile.collectionID,
                fileType: secondFileType,
                name: secondMediaFile.uploadAsset.file.name,
                size: secondMediaFile.uploadAsset.file.size,
            };
            if (
                areFilesLivePhotoAssets(
                    firstFileIdentifier,
                    secondFileIdentifier
                )
            ) {
                let imageFile: File | ElectronFile;
                let videoFile: File | ElectronFile;
                if (
                    firstFileType === FILE_TYPE.IMAGE &&
                    secondFileType === FILE_TYPE.VIDEO
                ) {
                    imageFile = firstMediaFile.uploadAsset.file;
                    videoFile = secondMediaFile.uploadAsset.file;
                } else {
                    videoFile = firstMediaFile.uploadAsset.file;
                    imageFile = secondMediaFile.uploadAsset.file;
                }
                const livePhotoLocalID = firstMediaFile.uploadAsset.localID;
                analysedMediaFiles.push({
                    uploadAsset: {
                        localID: livePhotoLocalID,
                        livePhotoAssets: {
                            image: imageFile,
                            video: videoFile,
                        },
                    },
                    collectionID: firstMediaFile.collectionID,
                });
                index += 2;
            } else {
                analysedMediaFiles.push({
                    ...firstMediaFile,
                });
                index += 1;
            }
        }
        if (index === mediaFiles.length - 1) {
            analysedMediaFiles.push({
                ...mediaFiles[index],
            });
        }
        return analysedMediaFiles;
    } catch (e) {
        if (e.message === CustomError.UPLOAD_CANCELLED) {
            throw e;
        } else {
            logError(e, 'failed to cluster live photo');
            throw e;
        }
    }
}

function areFilesLivePhotoAssets(
    firstFileIdentifier: LivePhotoIdentifier,
    secondFileIdentifier: LivePhotoIdentifier
) {
    if (
        firstFileIdentifier.collectionID ===
            secondFileIdentifier.collectionID &&
        firstFileIdentifier.fileType !== secondFileIdentifier.fileType &&
        isImageOrVideo(firstFileIdentifier.fileType) &&
        isImageOrVideo(secondFileIdentifier.fileType) &&
        removeUnderscoreThreeSuffix(
            splitFilenameAndExtension(firstFileIdentifier.name)[0]
        ) ===
            removeUnderscoreThreeSuffix(
                splitFilenameAndExtension(secondFileIdentifier.name)[0]
            )
    ) {
        // checks size of live Photo assets are less than allowed limit
        // I did that based on the assumption that live photo assets ideally would not be larger than LIVE_PHOTO_ASSET_SIZE_LIMIT
        // also zipping library doesn't support stream as a input
        if (
            firstFileIdentifier.size <= LIVE_PHOTO_ASSET_SIZE_LIMIT &&
            secondFileIdentifier.size <= LIVE_PHOTO_ASSET_SIZE_LIMIT
        ) {
            return true;
        } else {
            logError(
                new Error(CustomError.TOO_LARGE_LIVE_PHOTO_ASSETS),
                CustomError.TOO_LARGE_LIVE_PHOTO_ASSETS,
                {
                    fileSizes: [
                        firstFileIdentifier.size,
                        secondFileIdentifier.size,
                    ],
                }
            );
        }
    }
    return false;
}

function removeUnderscoreThreeSuffix(filename: string) {
    if (filename.endsWith(UNDERSCORE_THREE)) {
        return filename.slice(0, filename.lastIndexOf(UNDERSCORE));
    } else {
        return filename;
    }
}
