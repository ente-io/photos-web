import {
    FileTypeInfo,
    FileInMemory,
    Metadata,
    EncryptedFile,
    FileWithMetadata,
    ParsedMetadataJSONMap,
    ElectronFile,
    LocalFileVariants,
} from 'types/upload';
import { canBeTranscoded, splitFilenameAndExtension } from 'utils/file';
import { logError } from 'utils/sentry';
import { getFileNameSize, addLogLine } from 'utils/logging';
import { encryptFiledata } from './encryptionService';
import { extractMetadata, getMetadataJSONMapKey } from './metadataService';
import { getFileData } from '../readerService';
import { generateThumbnail } from './thumbnailService';
import { DedicatedCryptoWorker } from 'worker/crypto.worker';
import { Remote } from 'comlink';
import { EncryptedMagicMetadata } from 'types/magicMetadata';
import { transcodeVideo } from 'services/ffmpeg/ffmpegService';

const EDITED_FILE_SUFFIX = '-edited';

export function getFileSize(file: File | ElectronFile) {
    return file.size;
}

export function getFilename(file: File | ElectronFile) {
    return file.name;
}

export async function readFile(
    fileTypeInfo: FileTypeInfo,
    rawFile: File | ElectronFile
): Promise<FileInMemory> {
    const { thumbnail, hasStaticThumbnail } = await generateThumbnail(
        rawFile,
        fileTypeInfo
    );
    addLogLine(`reading file data ${getFileNameSize(rawFile)} `);
    const filedata = await getFileData(rawFile);
    let fileVariants: FileInMemory['fileVariants'];
    if (canBeTranscoded(fileTypeInfo)) {
        const transcodedVideo = await transcodeVideo(rawFile);
        fileVariants = {
            tcFile: await getFileData(transcodedVideo),
        };
    }

    addLogLine(`read file data successfully ${getFileNameSize(rawFile)} `);

    return {
        filedata,
        thumbnail,
        hasStaticThumbnail,
        fileVariants,
    };
}

export async function extractFileMetadata(
    worker,
    parsedMetadataJSONMap: ParsedMetadataJSONMap,
    collectionID: number,
    fileTypeInfo: FileTypeInfo,
    rawFile: File | ElectronFile
) {
    const originalName = getFileOriginalName(rawFile);
    const googleMetadata =
        parsedMetadataJSONMap.get(
            getMetadataJSONMapKey(collectionID, originalName)
        ) ?? {};
    const extractedMetadata: Metadata = await extractMetadata(
        worker,
        rawFile,
        fileTypeInfo
    );

    for (const [key, value] of Object.entries(googleMetadata)) {
        if (!value) {
            continue;
        }
        extractedMetadata[key] = value;
    }
    return extractedMetadata;
}

export async function encryptFile(
    worker: Remote<DedicatedCryptoWorker>,
    file: FileWithMetadata,
    encryptionKey: string
): Promise<EncryptedFile> {
    try {
        const { key: fileKey, file: encryptedFiledata } = await encryptFiledata(
            worker,
            file.filedata
        );

        const { file: encryptedThumbnail } = await worker.encryptThumbnail(
            file.thumbnail,
            fileKey
        );
        const { file: encryptedMetadata } = await worker.encryptMetadata(
            file.metadata,
            fileKey
        );

        let encryptedPubMagicMetadata: EncryptedMagicMetadata;
        if (file.pubMagicMetadata) {
            const { file: encryptedPubMagicMetadataData } =
                await worker.encryptMetadata(
                    file.pubMagicMetadata.data,
                    fileKey
                );
            encryptedPubMagicMetadata = {
                version: file.pubMagicMetadata.version,
                count: file.pubMagicMetadata.count,
                data: encryptedPubMagicMetadataData.encryptedData,
                header: encryptedPubMagicMetadataData.decryptionHeader,
            };
        }
        let encryptedFileVariants: LocalFileVariants;
        if (file.fileVariants) {
            if (file.fileVariants.tcFile) {
                const { file: encryptedFileVariant } = await encryptFiledata(
                    worker,
                    file.fileVariants.tcFile,
                    fileKey
                );
                encryptedFileVariants.tcFile = encryptedFileVariant;
            }
        }

        const encryptedKey = await worker.encryptToB64(fileKey, encryptionKey);

        const result: EncryptedFile = {
            file: {
                file: encryptedFiledata,
                thumbnail: encryptedThumbnail,
                fileVariants: encryptedFileVariants,
                metadata: encryptedMetadata,
                pubMagicMetadata: encryptedPubMagicMetadata,
                localID: file.localID,
            },
            fileKey: encryptedKey,
        };
        return result;
    } catch (e) {
        logError(e, 'Error encrypting files');
        throw e;
    }
}

/*
    Get the original file name for edited file to associate it to original file's metadataJSON file 
    as edited file doesn't have their own metadata file
*/
function getFileOriginalName(file: File | ElectronFile) {
    let originalName: string = null;
    const [nameWithoutExtension, extension] = splitFilenameAndExtension(
        file.name
    );

    const isEditedFile = nameWithoutExtension.endsWith(EDITED_FILE_SUFFIX);
    if (isEditedFile) {
        originalName = nameWithoutExtension.slice(
            0,
            -1 * EDITED_FILE_SUFFIX.length
        );
    } else {
        originalName = nameWithoutExtension;
    }
    if (extension) {
        originalName += '.' + extension;
    }
    return originalName;
}
