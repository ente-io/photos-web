import { SelectedState } from 'types/gallery';
import {
    EnteFile,
    EncryptedEnteFile,
    FileWithUpdatedMagicMetadata,
    FileMagicMetadata,
    FileMagicMetadataProps,
    FilePublicMagicMetadata,
    FilePublicMagicMetadataProps,
} from 'types/file';
import { decodeLivePhoto } from 'services/livePhotoService';
import { getFileType } from 'services/typeDetectionService';
import DownloadManager from 'services/downloadManager';
import { logError } from 'utils/sentry';
import { User } from 'types/user';
import { getData, LS_KEYS } from 'utils/storage/localStorage';
import { updateFileCreationDateInEXIF } from 'services/upload/exifService';
import {
    TYPE_JPEG,
    TYPE_JPG,
    TYPE_HEIC,
    TYPE_HEIF,
    FILE_TYPE,
    SUPPORTED_RAW_FORMATS,
    RAW_FORMATS,
} from 'constants/file';
import PublicCollectionDownloadManager from 'services/publicCollectionDownloadManager';
import heicConversionService from 'services/heicConversionService';
import * as ffmpegService from 'services/ffmpeg/ffmpegService';
import { VISIBILITY_STATE } from 'types/magicMetadata';
import { IsArchived, updateMagicMetadata } from 'utils/magicMetadata';

import { addLocalLog, addLogLine } from 'utils/logging';
import { CustomError } from 'utils/error';
import { convertBytesToHumanReadable } from './size';
import ComlinkCryptoWorker from 'utils/comlink/ComlinkCryptoWorker';
import {
    updateFileMagicMetadata,
    updateFilePublicMagicMetadata,
} from 'services/fileService';
import isElectron from 'is-electron';
import imageProcessor from 'services/electron/imageProcessor';
import { isPlaybackPossible } from 'utils/photoFrame';
import { FileTypeInfo } from 'types/upload';
import { Remote } from 'comlink';
import { ML_SYNC_DOWNLOAD_TIMEOUT_MS } from 'constants/mlConfig';
import PQueue from 'p-queue';
import { DedicatedCryptoWorker } from 'worker/crypto.worker';

const WAIT_TIME_IMAGE_CONVERSION = 30 * 1000;

export function downloadAsFile(filename: string, content: string) {
    const file = new Blob([content], {
        type: 'text/plain',
    });
    const fileURL = URL.createObjectURL(file);
    downloadUsingAnchor(fileURL, filename);
}

export async function downloadFile(
    file: EnteFile,
    accessedThroughSharedURL: boolean,
    token?: string,
    passwordToken?: string
) {
    try {
        let fileBlob: Blob;
        const fileReader = new FileReader();
        if (accessedThroughSharedURL) {
            const fileURL =
                await PublicCollectionDownloadManager.getCachedOriginalFile(
                    file
                )[0];
            if (!fileURL) {
                fileBlob = await new Response(
                    await PublicCollectionDownloadManager.downloadFile(
                        token,
                        passwordToken,
                        file
                    )
                ).blob();
            } else {
                fileBlob = await (await fetch(fileURL)).blob();
            }
        } else {
            const fileURL = await DownloadManager.getCachedOriginalFile(
                file
            )[0];
            if (!fileURL) {
                fileBlob = await new Response(
                    await DownloadManager.downloadFile(file)
                ).blob();
            } else {
                fileBlob = await (await fetch(fileURL)).blob();
            }
        }

        if (file.metadata.fileType === FILE_TYPE.LIVE_PHOTO) {
            const livePhoto = await decodeLivePhoto(file, fileBlob);
            const image = new File([livePhoto.image], livePhoto.imageNameTitle);
            const imageType = await getFileType(image);
            const tempImageURL = URL.createObjectURL(
                new Blob([livePhoto.image], { type: imageType.mimeType })
            );
            const video = new File([livePhoto.video], livePhoto.videoNameTitle);
            const videoType = await getFileType(video);
            const tempVideoURL = URL.createObjectURL(
                new Blob([livePhoto.video], { type: videoType.mimeType })
            );
            downloadUsingAnchor(tempImageURL, livePhoto.imageNameTitle);
            downloadUsingAnchor(tempVideoURL, livePhoto.videoNameTitle);
        } else {
            const fileType = await getFileType(
                new File([fileBlob], file.metadata.title)
            );
            if (
                file.pubMagicMetadata?.data.editedTime &&
                (fileType.exactType === TYPE_JPEG ||
                    fileType.exactType === TYPE_JPG)
            ) {
                fileBlob = await updateFileCreationDateInEXIF(
                    fileReader,
                    fileBlob,
                    new Date(file.pubMagicMetadata.data.editedTime / 1000)
                );
            }
            fileBlob = new Blob([fileBlob], { type: fileType.mimeType });
            const tempURL = URL.createObjectURL(fileBlob);
            downloadUsingAnchor(tempURL, file.metadata.title);
        }
    } catch (e) {
        logError(e, 'failed to download file');
    }
}

function downloadUsingAnchor(link: string, name: string) {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = link;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(link);
    a.remove();
}

export function groupFilesBasedOnCollectionID(files: EnteFile[]) {
    const collectionWiseFiles = new Map<number, EnteFile[]>();
    for (const file of files) {
        if (!collectionWiseFiles.has(file.collectionID)) {
            collectionWiseFiles.set(file.collectionID, []);
        }
        collectionWiseFiles.get(file.collectionID).push(file);
    }
    return collectionWiseFiles;
}

function getSelectedFileIds(selectedFiles: SelectedState) {
    const filesIDs: number[] = [];
    for (const [key, val] of Object.entries(selectedFiles)) {
        if (typeof val === 'boolean' && val) {
            filesIDs.push(Number(key));
        }
    }
    return new Set(filesIDs);
}
export function getSelectedFiles(
    selected: SelectedState,
    files: EnteFile[]
): EnteFile[] {
    const selectedFilesIDs = getSelectedFileIds(selected);
    return files.filter((file) => selectedFilesIDs.has(file.id));
}

export function sortFiles(files: EnteFile[], sortAsc = false) {
    // sort based on the time of creation time of the file,
    // for files with same creation time, sort based on the time of last modification
    const factor = sortAsc ? -1 : 1;
    return files.sort((a, b) => {
        if (a.metadata.creationTime === b.metadata.creationTime) {
            return (
                factor *
                (b.metadata.modificationTime - a.metadata.modificationTime)
            );
        }
        return factor * (b.metadata.creationTime - a.metadata.creationTime);
    });
}

export async function decryptFile(
    file: EncryptedEnteFile,
    collectionKey: string
): Promise<EnteFile> {
    try {
        const worker = await ComlinkCryptoWorker.getInstance();
        const {
            encryptedKey,
            keyDecryptionNonce,
            metadata,
            magicMetadata,
            pubMagicMetadata,
            ...restFileProps
        } = file;
        const fileKey = await worker.decryptB64(
            encryptedKey,
            keyDecryptionNonce,
            collectionKey
        );
        const fileMetadata = await worker.decryptMetadata(
            metadata.encryptedData,
            metadata.decryptionHeader,
            fileKey
        );
        let fileMagicMetadata: FileMagicMetadata;
        let filePubMagicMetadata: FilePublicMagicMetadata;
        if (magicMetadata?.data) {
            fileMagicMetadata = {
                ...file.magicMetadata,
                data: await worker.decryptMetadata(
                    magicMetadata.data,
                    magicMetadata.header,
                    fileKey
                ),
            };
        }
        if (pubMagicMetadata?.data) {
            filePubMagicMetadata = {
                ...pubMagicMetadata,
                data: await worker.decryptMetadata(
                    pubMagicMetadata.data,
                    pubMagicMetadata.header,
                    fileKey
                ),
            };
        }
        return {
            ...restFileProps,
            key: fileKey,
            metadata: fileMetadata,
            magicMetadata: fileMagicMetadata,
            pubMagicMetadata: filePubMagicMetadata,
        };
    } catch (e) {
        logError(e, 'file decryption failed');
        throw e;
    }
}

export function fileNameWithoutExtension(filename: string) {
    const lastDotPosition = filename.lastIndexOf('.');
    if (lastDotPosition === -1) return filename;
    else return filename.slice(0, lastDotPosition);
}

export function fileExtensionWithDot(filename: string) {
    const lastDotPosition = filename.lastIndexOf('.');
    if (lastDotPosition === -1) return '';
    else return filename.slice(lastDotPosition);
}

export function splitFilenameAndExtension(filename: string): [string, string] {
    const lastDotPosition = filename.lastIndexOf('.');
    if (lastDotPosition === -1) return [filename, null];
    else
        return [
            filename.slice(0, lastDotPosition),
            filename.slice(lastDotPosition + 1),
        ];
}

export function getFileExtension(filename: string) {
    return splitFilenameAndExtension(filename)[1]?.toLocaleLowerCase();
}

export function generateStreamFromArrayBuffer(data: Uint8Array) {
    return new ReadableStream({
        async start(controller: ReadableStreamDefaultController) {
            controller.enqueue(data);
            controller.close();
        },
    });
}

export async function getRenderableFileURL(file: EnteFile, fileBlob: Blob) {
    switch (file.metadata.fileType) {
        case FILE_TYPE.IMAGE: {
            const convertedBlob = await getRenderableImage(
                file.metadata.title,
                fileBlob
            );
            return {
                converted: [
                    convertedBlob ? URL.createObjectURL(convertedBlob) : null,
                ],
                original: [URL.createObjectURL(fileBlob)],
            };
        }
        case FILE_TYPE.LIVE_PHOTO: {
            const livePhoto = await getRenderableLivePhoto(file, fileBlob);
            return {
                converted: livePhoto.map((asset) =>
                    asset ? URL.createObjectURL(asset) : null
                ),
                original: [URL.createObjectURL(fileBlob)],
            };
        }
        case FILE_TYPE.VIDEO: {
            const convertedBlob = await getPlayableVideo(
                file.metadata.title,
                new Uint8Array(await fileBlob.arrayBuffer())
            );
            return {
                converted: [URL.createObjectURL(convertedBlob)],
                original: [URL.createObjectURL(fileBlob)],
            };
        }
        default: {
            const previewURL = await createTypedObjectURL(
                fileBlob,
                file.metadata.title
            );
            return {
                converted: [previewURL],
                original: [previewURL],
            };
        }
    }
}

async function getRenderableLivePhoto(
    file: EnteFile,
    fileBlob: Blob
): Promise<Blob[]> {
    const livePhoto = await decodeLivePhoto(file, fileBlob);
    const imageBlob = new Blob([livePhoto.image]);
    return await Promise.all([
        getRenderableImage(livePhoto.imageNameTitle, imageBlob),
        getPlayableVideo(livePhoto.videoNameTitle, livePhoto.video),
    ]);
}

export async function getPlayableVideo(
    videoNameTitle: string,
    video: Uint8Array
) {
    try {
        const isPlayable = await isPlaybackPossible(
            URL.createObjectURL(new Blob([video]))
        );
        if (isPlayable) {
            return new Blob([video.buffer]);
        } else {
            addLogLine('video format not supported, converting it');
            const mp4ConvertedVideo = await ffmpegService.convertToMP4(
                new File([video], videoNameTitle)
            );
            return new Blob([await mp4ConvertedVideo.arrayBuffer()]);
        }
    } catch (e) {
        logError(e, 'video conversion failed');
        return new Blob([video.buffer]);
    }
}

export async function getRenderableImage(fileName: string, imageBlob: Blob) {
    let fileTypeInfo: FileTypeInfo;
    try {
        const tempFile = new File([imageBlob], fileName);
        fileTypeInfo = await getFileType(tempFile);
        addLocalLog(() => `file type info: ${JSON.stringify(fileTypeInfo)}`);
        const { exactType } = fileTypeInfo;
        let convertedImageBlob: Blob;
        if (isRawFile(exactType)) {
            try {
                if (!isSupportedRawFormat(exactType)) {
                    throw Error(CustomError.UNSUPPORTED_RAW_FORMAT);
                }

                if (!isElectron()) {
                    throw Error(CustomError.NOT_AVAILABLE_ON_WEB);
                }
                addLogLine(
                    `RawConverter called for ${fileName}-${convertBytesToHumanReadable(
                        imageBlob.size
                    )}`
                );
                convertedImageBlob = await imageProcessor.convertToJPEG(
                    imageBlob,
                    fileName
                );
                addLogLine(`${fileName} successfully converted`);
            } catch (e) {
                try {
                    if (!isFileHEIC(exactType)) {
                        throw e;
                    }
                    addLogLine(
                        `HEICConverter called for ${fileName}-${convertBytesToHumanReadable(
                            imageBlob.size
                        )}`
                    );
                    convertedImageBlob = await heicConversionService.convert(
                        imageBlob
                    );
                    addLogLine(`${fileName} successfully converted`);
                } catch (e) {
                    throw Error(CustomError.NON_PREVIEWABLE_FILE);
                }
            }
            return convertedImageBlob;
        } else {
            return imageBlob;
        }
    } catch (e) {
        logError(e, 'get Renderable Image failed', { fileTypeInfo });
        return null;
    }
}

export function isFileHEIC(exactType: string) {
    return (
        exactType.toLowerCase().endsWith(TYPE_HEIC) ||
        exactType.toLowerCase().endsWith(TYPE_HEIF)
    );
}

export function isRawFile(exactType: string) {
    return RAW_FORMATS.includes(exactType.toLowerCase());
}

export function isSupportedRawFormat(exactType: string) {
    return SUPPORTED_RAW_FORMATS.includes(exactType.toLowerCase());
}

export async function changeFilesVisibility(
    files: EnteFile[],
    visibility: VISIBILITY_STATE
): Promise<EnteFile[]> {
    const fileWithUpdatedMagicMetadataList: FileWithUpdatedMagicMetadata[] = [];
    for (const file of files) {
        const updatedMagicMetadataProps: FileMagicMetadataProps = {
            visibility,
        };

        fileWithUpdatedMagicMetadataList.push({
            file,
            updatedMagicMetadata: await updateMagicMetadata(
                updatedMagicMetadataProps,
                file.magicMetadata,
                file.key
            ),
        });
    }
    return await updateFileMagicMetadata(fileWithUpdatedMagicMetadataList);
}

export async function changeFileCreationTime(
    file: EnteFile,
    editedTime: number
): Promise<EnteFile> {
    const updatedPublicMagicMetadataProps: FilePublicMagicMetadataProps = {
        editedTime,
    };
    const updatedPublicMagicMetadata: FilePublicMagicMetadata =
        await updateMagicMetadata(
            updatedPublicMagicMetadataProps,
            file.pubMagicMetadata,
            file.key
        );
    const updateResult = await updateFilePublicMagicMetadata([
        { file, updatedPublicMagicMetadata },
    ]);
    return updateResult[0];
}

export async function changeFileName(
    file: EnteFile,
    editedName: string
): Promise<EnteFile> {
    const updatedPublicMagicMetadataProps: FilePublicMagicMetadataProps = {
        editedName,
    };

    const updatedPublicMagicMetadata: FilePublicMagicMetadata =
        await updateMagicMetadata(
            updatedPublicMagicMetadataProps,
            file.pubMagicMetadata,
            file.key
        );
    const updateResult = await updateFilePublicMagicMetadata([
        { file, updatedPublicMagicMetadata },
    ]);
    return updateResult[0];
}

export async function changeCaption(
    file: EnteFile,
    caption: string
): Promise<EnteFile> {
    const updatedPublicMagicMetadataProps: FilePublicMagicMetadataProps = {
        caption,
    };

    const updatedPublicMagicMetadata: FilePublicMagicMetadata =
        await updateMagicMetadata(
            updatedPublicMagicMetadataProps,
            file.pubMagicMetadata,
            file.key
        );
    const updateResult = await updateFilePublicMagicMetadata([
        { file, updatedPublicMagicMetadata },
    ]);
    return updateResult[0];
}

export function isSharedFile(user: User, file: EnteFile) {
    if (!user?.id || !file?.ownerID) {
        return false;
    }
    return file.ownerID !== user.id;
}

export function mergeMetadata(files: EnteFile[]): EnteFile[] {
    return files.map((file) => {
        if (file.pubMagicMetadata?.data.editedTime) {
            file.metadata.creationTime = file.pubMagicMetadata.data.editedTime;
        }
        if (file.pubMagicMetadata?.data.editedName) {
            file.metadata.title = file.pubMagicMetadata.data.editedName;
        }

        return file;
    });
}

export function updateExistingFilePubMetadata(
    existingFile: EnteFile,
    updatedFile: EnteFile
) {
    existingFile.pubMagicMetadata = updatedFile.pubMagicMetadata;
    existingFile.metadata = mergeMetadata([existingFile])[0].metadata;
}

export async function getFileFromURL(fileURL: string) {
    const fileBlob = await (await fetch(fileURL)).blob();
    const fileFile = new File([fileBlob], 'temp');
    return fileFile;
}

export function getUniqueFiles(files: EnteFile[], sortAsc = false) {
    const idSet = new Set<number>();
    const uniqueFiles = files.filter((file) => {
        if (!idSet.has(file.id)) {
            idSet.add(file.id);
            return true;
        } else {
            return false;
        }
    });

    if (sortAsc === true) {
        return uniqueFiles.sort(
            (a, b) => a.metadata.creationTime - b.metadata.creationTime
        );
    }
    return uniqueFiles;
}

export async function downloadFiles(files: EnteFile[]) {
    for (const file of files) {
        try {
            await downloadFile(file, false);
        } catch (e) {
            logError(e, 'download fail for file');
        }
    }
}

export const isImageOrVideo = (fileType: FILE_TYPE) =>
    [FILE_TYPE.IMAGE, FILE_TYPE.VIDEO].includes(fileType);

export const getArchivedFiles = (files: EnteFile[]) => {
    return files.filter(IsArchived).map((file) => file.id);
};

export const createTypedObjectURL = async (blob: Blob, fileName: string) => {
    const type = await getFileType(new File([blob], fileName));
    return URL.createObjectURL(new Blob([blob], { type: type.mimeType }));
};

export const getUserOwnedFiles = (files: EnteFile[]) => {
    const user: User = getData(LS_KEYS.USER);
    if (!user?.id) {
        throw Error('user missing');
    }
    return files.filter((file) => file.ownerID === user.id);
};

// doesn't work on firefox
export const copyFileToClipboard = async (fileUrl: string) => {
    const canvas = document.createElement('canvas');
    const canvasCTX = canvas.getContext('2d');
    const image = new Image();

    const blobPromise = new Promise<Blob>((resolve, reject) => {
        let timeout: NodeJS.Timeout = null;
        try {
            image.setAttribute('src', fileUrl);
            image.onload = () => {
                canvas.width = image.width;
                canvas.height = image.height;
                canvasCTX.drawImage(image, 0, 0, image.width, image.height);
                canvas.toBlob(
                    (blob) => {
                        resolve(blob);
                    },
                    'image/png',
                    1
                );

                clearTimeout(timeout);
            };
        } catch (e) {
            void logError(e, 'failed to copy to clipboard');
            reject(e);
        } finally {
            clearTimeout(timeout);
        }
        timeout = setTimeout(
            () => reject(Error(CustomError.WAIT_TIME_EXCEEDED)),
            WAIT_TIME_IMAGE_CONVERSION
        );
    });

    const { ClipboardItem } = window;

    await navigator.clipboard
        .write([new ClipboardItem({ 'image/png': blobPromise })])
        .catch((e) => logError(e, 'failed to copy to clipboard'));
};

export function getLatestVersionFiles(files: EnteFile[]) {
    const latestVersionFiles = new Map<string, EnteFile>();
    files.forEach((file) => {
        const uid = `${file.collectionID}-${file.id}`;
        if (
            !latestVersionFiles.has(uid) ||
            latestVersionFiles.get(uid).updationTime < file.updationTime
        ) {
            latestVersionFiles.set(uid, file);
        }
    });
    return Array.from(latestVersionFiles.values()).filter(
        (file) => !file.isDeleted
    );
}

export function getPersonalFiles(files: EnteFile[], user: User) {
    if (!user?.id) {
        throw Error('user missing');
    }
    return files.filter((file) => file.ownerID === user.id);
}

export function getIDBasedSortedFiles(files: EnteFile[]) {
    return files.sort((a, b) => a.id - b.id);
}

export function constructFileToCollectionMap(files: EnteFile[]) {
    const fileToCollectionsMap = new Map<number, number[]>();
    (files ?? []).forEach((file) => {
        if (!fileToCollectionsMap.get(file.id)) {
            fileToCollectionsMap.set(file.id, []);
        }
        fileToCollectionsMap.get(file.id).push(file.collectionID);
    });
    return fileToCollectionsMap;
}

export async function getOriginalFile(
    file: EnteFile,
    token: string,
    enteWorker?: Remote<DedicatedCryptoWorker>,
    queue?: PQueue
) {
    let fileStream;
    if (queue) {
        fileStream = await queue.add(() =>
            DownloadManager.downloadFile(
                file,
                token,
                enteWorker,
                ML_SYNC_DOWNLOAD_TIMEOUT_MS
            )
        );
    } else {
        fileStream = await DownloadManager.downloadFile(
            file,
            token,
            enteWorker
        );
    }
    return new Response(fileStream).blob();
}

export async function getOriginalConvertedFile(
    file: EnteFile,
    token: string,
    enteWorker?: Remote<DedicatedCryptoWorker>,
    queue?: PQueue
) {
    const fileBlob = await getOriginalFile(file, token, enteWorker, queue);
    if (file.metadata.fileType === FILE_TYPE.IMAGE) {
        return await getRenderableImage(file.metadata.title, fileBlob);
    } else {
        const livePhoto = await decodeLivePhoto(file, fileBlob);
        return await getRenderableImage(
            livePhoto.imageNameTitle,
            new Blob([livePhoto.image])
        );
    }
}
