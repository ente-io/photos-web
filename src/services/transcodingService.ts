import { FILE_TYPE } from 'constants/file';
import isElectron from 'is-electron';
import {
    ElectronFile,
    FileWithCollection,
    FileWithMetadata,
} from 'types/upload';
import { runningInBrowser } from 'utils/common';
import { ConvertToStreamableVideoCmds, MP4 } from 'utils/ffmpeg/cmds';
import { logError } from 'utils/sentry';
import { getLocalUserPreferences } from 'utils/user';
import ffmpegService from './ffmpeg/ffmpegService';

class TranscodingService {
    ElectronAPIs: any;
    private allElectronAPIsExist: boolean = false;

    constructor() {
        this.ElectronAPIs = runningInBrowser() && window['ElectronAPIs'];
        this.allElectronAPIsExist = !!this.ElectronAPIs?.getTranscodedFile;
    }

    async getStreamableVideo(fileWithCollection: FileWithCollection) {
        try {
            if (isElectron() && this.allElectronAPIsExist) {
                const file: ElectronFile =
                    await this.ElectronAPIs.getTranscodedFile(
                        ConvertToStreamableVideoCmds,
                        fileWithCollection.file,
                        MP4
                    );
                console.log({ file });
                return await file.arrayBuffer();
            } else {
                return await ffmpegService.convertToStreamableVideo(
                    new Uint8Array(await fileWithCollection.file.arrayBuffer()),
                    fileWithCollection.file.name
                );
            }
        } catch (e) {
            logError(e, 'get streamable video file failed');
            throw e;
        }
    }

    async transcodeFile(
        fileWithCollection: FileWithCollection,
        fileWithMetadata: FileWithMetadata
    ) {
        const userPreferences = getLocalUserPreferences();
        if (
            fileWithMetadata.metadata.fileType === FILE_TYPE.VIDEO &&
            userPreferences?.isVidTranscodingEnabled
        ) {
            fileWithMetadata.fileVariants = {
                vidVariantFile: await this.getStreamableVideo(
                    fileWithCollection
                ),
            };
        }
    }
}

export default new TranscodingService();
