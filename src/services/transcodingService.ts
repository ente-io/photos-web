import { FILE_TYPE } from 'constants/file';
import isElectron from 'is-electron';
import { ElectronFile, FileWithMetadata, Metadata } from 'types/upload';
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

    async getStreamableVideo(file: ElectronFile | File) {
        try {
            if (isElectron() && this.allElectronAPIsExist) {
                const outputFile: ElectronFile =
                    await this.ElectronAPIs.getTranscodedFile(
                        [...ConvertToStreamableVideoCmds],
                        file,
                        MP4
                    );
                console.log({ outputFile });
                return await outputFile.arrayBuffer();
            } else {
                return await ffmpegService.convertToStreamableVideo(
                    new Uint8Array(await file.arrayBuffer()),
                    file.name
                );
            }
        } catch (e) {
            logError(e, 'get streamable video file failed');
            return;
        }
    }

    async transcodeFile(file: ElectronFile | File, metadata: Metadata) {
        const userPreferences = getLocalUserPreferences();
        if (
            metadata.fileType === FILE_TYPE.VIDEO &&
            userPreferences?.isVidTranscodingEnabled
        ) {
            const fileVariants: FileWithMetadata['fileVariants'] = {
                vidFileVariant: await this.getStreamableVideo(file),
            };
            return fileVariants;
        }
    }
}

export default new TranscodingService();
