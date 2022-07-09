import { FILE_TYPE } from 'constants/file';
import { FileWithCollection, FileWithMetadata } from 'types/upload';
import { logError } from 'utils/sentry';
import ffmpegService from './ffmpeg/ffmpegService';

export async function getStreamableVideo(
    fileWithCollection: FileWithCollection
) {
    try {
        const streamableVideoFile =
            await ffmpegService.convertToStreamableVideo(
                new Uint8Array(await fileWithCollection.file.arrayBuffer()),
                fileWithCollection.file.name
            );

        return streamableVideoFile;
    } catch (e) {
        logError(e, 'get streamable video file failed');
        return null;
    }
}

export async function transcodeFile(
    fileWithCollection: FileWithCollection,
    fileWithMetadata: FileWithMetadata
) {
    // replace with user pref config
    // eslint-disable-next-line no-constant-condition
    if (true) {
        if (fileWithMetadata.metadata.fileType === FILE_TYPE.VIDEO) {
            fileWithMetadata.fileVariants = {
                vidVariantFile: await getStreamableVideo(fileWithCollection),
            };
        }
    }
}
