import { FILE_TYPE } from 'constants/file';
import { getExifData } from './exifService';
import { Metadata, FileTypeInfo, FileWithCollection } from 'types/upload';
import { MAX_FILE_SIZE_SUPPORTED } from 'constants/upload';
import { logError } from 'utils/sentry';
import UploadService from './uploadService';

export async function extractMetadata(
    receivedFile: File,
    fileTypeInfo: FileTypeInfo
) {
    let exifData = null;
    if (fileTypeInfo.fileType === FILE_TYPE.IMAGE) {
        exifData = await getExifData(receivedFile, fileTypeInfo);
    }

    const extractedMetadata: Metadata = {
        title: receivedFile.name,
        creationTime:
            exifData?.creationTime ?? receivedFile.lastModified * 1000,
        modificationTime: receivedFile.lastModified * 1000,
        latitude: exifData?.location?.latitude,
        longitude: exifData?.location?.longitude,
        fileType: fileTypeInfo.fileType,
    };
    return extractedMetadata;
}

export async function extractMetadataFromFiles(
    mediaFiles: FileWithCollection[],
    increaseFileUploaded: () => void
) {
    try {
        const reader = new FileReader();
        for (const { file, localID, collectionID } of mediaFiles) {
            const { fileTypeInfo, metadata } = await (async () => {
                if (file.size >= MAX_FILE_SIZE_SUPPORTED) {
                    return { fileTypeInfo: null, metadata: null };
                }
                const fileTypeInfo = await UploadService.getFileType(
                    reader,
                    file
                );
                if (fileTypeInfo.fileType === FILE_TYPE.OTHERS) {
                    return { fileTypeInfo, metadata: null };
                }
                const metadata =
                    (await UploadService.extractFileMetadata(
                        file,
                        collectionID,
                        fileTypeInfo
                    )) || null;
                return { fileTypeInfo, metadata };
            })();

            this.metadataAndFileTypeInfoMap.set(localID, {
                fileTypeInfo: fileTypeInfo && { ...fileTypeInfo },
                metadata: metadata && { ...metadata },
            });
            increaseFileUploaded();
        }
    } catch (e) {
        logError(e, 'error extracting metadata');
        // silently ignore the error
    }
}
