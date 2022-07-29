import { SelectedState } from 'types/gallery';
import {
    EnteFile,
    fileAttribute,
    FileMagicMetadataProps,
    FilePublicMagicMetadataProps,
} from 'types/file';
import { decodeMotionPhoto } from 'services/motionPhotoService';
import { getFileType } from 'services/typeDetectionService';
import DownloadManager from 'services/downloadManager';
import { logError } from 'utils/sentry';
import { User } from 'types/user';
import CryptoWorker from 'utils/crypto';
import { getData, LS_KEYS } from 'utils/storage/localStorage';
import { updateFileCreationDateInEXIF } from 'services/upload/exifService';
import {
    TYPE_JPEG,
    TYPE_JPG,
    TYPE_HEIC,
    TYPE_HEIF,
    FILE_TYPE,
} from 'constants/file';
import PublicCollectionDownloadManager from 'services/publicCollectionDownloadManager';
import HEICConverter from 'services/heicConverter/heicConverterService';
import ffmpegService from 'services/ffmpeg/ffmpegService';
import { NEW_FILE_MAGIC_METADATA, VISIBILITY_STATE } from 'types/magicMetadata';
import { IsArchived, updateMagicMetadataProps } from 'utils/magicMetadata';
import { ARCHIVE_SECTION, TRASH_SECTION } from 'constants/collection';
import { addLogLine } from 'utils/logging';
import { makeHumanReadableStorage } from 'utils/billing';
import { GeoLocation } from 'types/upload';
export function downloadAsFile(filename: string, content: string) {
    const file = new Blob([content], {
        type: 'text/plain',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = filename;

    a.style.display = 'none';
    document.body.appendChild(a);

    a.click();

    a.remove();
}

export async function downloadFile(
    file: EnteFile,
    accessedThroughSharedURL: boolean,
    token?: string,
    passwordToken?: string
) {
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
        const fileURL = await DownloadManager.getCachedOriginalFile(file)[0];
        if (!fileURL) {
            fileBlob = await new Response(
                await DownloadManager.downloadFile(file)
            ).blob();
        } else {
            fileBlob = await (await fetch(fileURL)).blob();
        }
    }

    const fileType = await getFileType(
        new File([fileBlob], file.metadata.title)
    );
    if (
        file.pubMagicMetadata?.data.editedTime &&
        (fileType.exactType === TYPE_JPEG || fileType.exactType === TYPE_JPG)
    ) {
        fileBlob = await updateFileCreationDateInEXIF(
            fileReader,
            fileBlob,
            new Date(file.pubMagicMetadata.data.editedTime / 1000)
        );
    }
    let tempImageURL: string;
    let tempVideoURL: string;
    let tempURL: string;

    if (file.metadata.fileType === FILE_TYPE.LIVE_PHOTO) {
        const originalName = fileNameWithoutExtension(file.metadata.title);
        const motionPhoto = await decodeMotionPhoto(fileBlob, originalName);
        const image = new File([motionPhoto.image], motionPhoto.imageNameTitle);
        const imageType = await getFileType(image);
        tempImageURL = URL.createObjectURL(
            new Blob([motionPhoto.image], { type: imageType.mimeType })
        );
        const video = new File([motionPhoto.video], motionPhoto.videoNameTitle);
        const videoType = await getFileType(video);
        tempVideoURL = URL.createObjectURL(
            new Blob([motionPhoto.video], { type: videoType.mimeType })
        );
        downloadUsingAnchor(tempImageURL, motionPhoto.imageNameTitle);
        downloadUsingAnchor(tempVideoURL, motionPhoto.videoNameTitle);
    } else {
        fileBlob = new Blob([fileBlob], { type: fileType.mimeType });
        tempURL = URL.createObjectURL(fileBlob);
        downloadUsingAnchor(tempURL, file.metadata.title);
    }

    tempURL && URL.revokeObjectURL(tempURL);
    tempImageURL && URL.revokeObjectURL(tempImageURL);
    tempVideoURL && URL.revokeObjectURL(tempVideoURL);
}

function downloadUsingAnchor(link: string, name: string) {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = link;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

export function isFileHEIC(mimeType: string) {
    return (
        mimeType &&
        (mimeType.toLowerCase().endsWith(TYPE_HEIC) ||
            mimeType.toLowerCase().endsWith(TYPE_HEIF))
    );
}

export function sortFilesIntoCollections(files: EnteFile[]) {
    const collectionWiseFiles = new Map<number, EnteFile[]>([
        [ARCHIVE_SECTION, []],
        [TRASH_SECTION, []],
    ]);
    for (const file of files) {
        if (!collectionWiseFiles.has(file.collectionID)) {
            collectionWiseFiles.set(file.collectionID, []);
        }
        if (file.isTrashed) {
            collectionWiseFiles.get(TRASH_SECTION).push(file);
        } else {
            collectionWiseFiles.get(file.collectionID).push(file);
            if (IsArchived(file)) {
                collectionWiseFiles.get(ARCHIVE_SECTION).push(file);
            }
        }
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
    return filesIDs;
}
export function getSelectedFiles(
    selected: SelectedState,
    files: EnteFile[]
): EnteFile[] {
    const filesIDs = new Set(getSelectedFileIds(selected));
    const selectedFiles: EnteFile[] = [];
    const foundFiles = new Set<number>();
    for (const file of files) {
        if (filesIDs.has(file.id) && !foundFiles.has(file.id)) {
            selectedFiles.push(file);
            foundFiles.add(file.id);
        }
    }
    return selectedFiles;
}

export function formatDate(date: number | Date) {
    const dateTimeFormat = new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    return dateTimeFormat.format(date);
}

export function sortFiles(files: EnteFile[]) {
    // sort according to modification time first
    files = files.sort((a, b) => {
        if (!b.metadata?.modificationTime) {
            return -1;
        }
        if (!a.metadata?.modificationTime) {
            return 1;
        } else {
            return b.metadata.modificationTime - a.metadata.modificationTime;
        }
    });

    // then sort according to creation time, maintaining ordering according to modification time for files with creation time
    files = files
        .map((file, index) => ({ index, file }))
        .sort((a, b) => {
            let diff =
                b.file.metadata.creationTime - a.file.metadata.creationTime;
            if (diff === 0) {
                diff = a.index - b.index;
            }
            return diff;
        })
        .map((file) => file.file);
    return files;
}

export async function decryptFile(file: EnteFile, collectionKey: string) {
    try {
        const worker = await new CryptoWorker();
        file.key = await worker.decryptB64(
            file.encryptedKey,
            file.keyDecryptionNonce,
            collectionKey
        );
        const encryptedMetadata = file.metadata as unknown as fileAttribute;
        file.metadata = await worker.decryptMetadata(
            encryptedMetadata.encryptedData,
            encryptedMetadata.decryptionHeader,
            file.key
        );
        if (file.magicMetadata?.data) {
            file.magicMetadata.data = await worker.decryptMetadata(
                file.magicMetadata.data,
                file.magicMetadata.header,
                file.key
            );
        }
        if (file.pubMagicMetadata?.data) {
            file.pubMagicMetadata.data = await worker.decryptMetadata(
                file.pubMagicMetadata.data,
                file.pubMagicMetadata.header,
                file.key
            );
        }
        return file;
    } catch (e) {
        logError(e, 'file decryption failed');
        throw e;
    }
}

export const preservePhotoswipeProps =
    (newFiles: EnteFile[]) =>
    (currentFiles: EnteFile[]): EnteFile[] => {
        const currentFilesMap = Object.fromEntries(
            currentFiles.map((file) => [file.id, file])
        );
        const fileWithPreservedProperty = newFiles.map((file) => {
            const currentFile = currentFilesMap[file.id];
            return { ...currentFile, ...file };
        });
        return fileWithPreservedProperty;
    };

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

export async function convertForPreview(
    file: EnteFile,
    fileBlob: Blob
): Promise<Blob[]> {
    const convertIfHEIC = async (fileName: string, fileBlob: Blob) => {
        const mimeType = (
            await getFileType(new File([fileBlob], file.metadata.title))
        ).exactType;
        if (isFileHEIC(mimeType)) {
            addLogLine(
                `HEICConverter called for ${fileName}-${makeHumanReadableStorage(
                    fileBlob.size
                )}`
            );
            fileBlob = await HEICConverter.convert(fileBlob);
            addLogLine(`${fileName} successfully converted`);
        }
        return fileBlob;
    };

    if (file.metadata.fileType === FILE_TYPE.LIVE_PHOTO) {
        const originalName = fileNameWithoutExtension(file.metadata.title);
        const motionPhoto = await decodeMotionPhoto(fileBlob, originalName);
        let image = new Blob([motionPhoto.image]);

        // can run conversion in parellel as video and image
        // have different processes
        const convertedVideo = ffmpegService.convertToMP4(
            motionPhoto.video,
            motionPhoto.videoNameTitle
        );

        image = await convertIfHEIC(motionPhoto.imageNameTitle, image);
        const video = new Blob([await convertedVideo]);

        return [image, video];
    }

    fileBlob = await convertIfHEIC(file.metadata.title, fileBlob);
    return [fileBlob];
}

export async function changeFilesVisibility(
    files: EnteFile[],
    selected: SelectedState,
    visibility: VISIBILITY_STATE
) {
    const selectedFiles = getSelectedFiles(selected, files);
    const updatedFiles: EnteFile[] = [];
    for (const file of selectedFiles) {
        const updatedMagicMetadataProps: FileMagicMetadataProps = {
            visibility,
        };

        updatedFiles.push({
            ...file,
            magicMetadata: await updateMagicMetadataProps(
                file.magicMetadata ?? NEW_FILE_MAGIC_METADATA,
                file.key,
                updatedMagicMetadataProps
            ),
        });
    }
    return updatedFiles;
}

export async function changeFileCreationTime(
    file: EnteFile,
    editedTime: number
) {
    const updatedPublicMagicMetadataProps: FilePublicMagicMetadataProps = {
        editedTime,
    };
    file.pubMagicMetadata = await updateMagicMetadataProps(
        file.pubMagicMetadata ?? NEW_FILE_MAGIC_METADATA,
        file.key,
        updatedPublicMagicMetadataProps
    );
    return file;
}

export async function changeFileName(file: EnteFile, editedName: string) {
    const updatedPublicMagicMetadataProps: FilePublicMagicMetadataProps = {
        editedName,
    };

    file.pubMagicMetadata = await updateMagicMetadataProps(
        file.pubMagicMetadata ?? NEW_FILE_MAGIC_METADATA,
        file.key,
        updatedPublicMagicMetadataProps
    );
    return file;
}

export async function updateFileLocation(
    file: EnteFile,
    newLocation: GeoLocation
) {
    const updatedPublicMagicMetadataProps: FilePublicMagicMetadataProps = {
        editedLatitude: newLocation.latitude,
        editedLongitude: newLocation.longitude,
    };

    file.pubMagicMetadata = await updateMagicMetadataProps(
        file.pubMagicMetadata ?? NEW_FILE_MAGIC_METADATA,
        file.key,
        updatedPublicMagicMetadataProps
    );
    return file;
}

export function isSharedFile(file: EnteFile) {
    const user: User = getData(LS_KEYS.USER);

    if (!user?.id || !file?.ownerID) {
        return false;
    }
    return file.ownerID !== user.id;
}

export function mergeMetadata(files: EnteFile[]): EnteFile[] {
    return files.map((file) => ({
        ...file,
        metadata: {
            ...file.metadata,
            ...(file.pubMagicMetadata?.data
                ? {
                      ...(file.pubMagicMetadata?.data.editedTime && {
                          creationTime: file.pubMagicMetadata.data.editedTime,
                      }),
                      ...(file.pubMagicMetadata?.data.editedName && {
                          title: file.pubMagicMetadata.data.editedName,
                      }),
                      ...(file.pubMagicMetadata?.data.editedLatitude && {
                          latitude: file.pubMagicMetadata.data.editedLatitude,
                      }),
                      ...(file.pubMagicMetadata?.data.editedLatitude && {
                          longitude: file.pubMagicMetadata.data.editedLongitude,
                      }),
                  }
                : {}),
            ...(file.magicMetadata?.data ? file.magicMetadata.data : {}),
        },
    }));
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

export function getUniqueFiles(files: EnteFile[]) {
    const idSet = new Set<number>();
    return files.filter((file) => {
        if (!idSet.has(file.id)) {
            idSet.add(file.id);
            return true;
        } else {
            return false;
        }
    });
}
export function getNonTrashedUniqueUserFiles(files: EnteFile[]) {
    const user: User = getData(LS_KEYS.USER) ?? {};
    return getUniqueFiles(
        files.filter(
            (file) =>
                (typeof file.isTrashed === 'undefined' || !file.isTrashed) &&
                (!user.id || file.ownerID === user.id)
        )
    );
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

export function needsConversionForPreview(file: EnteFile) {
    const fileExtension = splitFilenameAndExtension(file.metadata.title)[1];
    if (
        file.metadata.fileType === FILE_TYPE.LIVE_PHOTO ||
        (file.metadata.fileType === FILE_TYPE.IMAGE &&
            isFileHEIC(fileExtension))
    ) {
        return true;
    } else {
        return false;
    }
}

export const isLivePhoto = (file: EnteFile) =>
    file.metadata.fileType === FILE_TYPE.LIVE_PHOTO;

export const isImageOrVideo = (fileType: FILE_TYPE) =>
    [FILE_TYPE.IMAGE, FILE_TYPE.VIDEO].includes(fileType);

export const getArchivedFiles = (files: EnteFile[]) => {
    return files.filter(IsArchived).map((file) => file.id);
};

export const createTypedObjectURL = async (blob: Blob, fileName: string) => {
    const type = await getFileType(new File([blob], fileName));
    return URL.createObjectURL(new Blob([blob], { type: type.mimeType }));
};
