import { FILE_TYPE } from 'constants/file';
import isElectron from 'is-electron';
import { ElectronFile, FileTypeInfo, FileWithMetadata } from 'types/upload';
import { runningInBrowser } from 'utils/common';
import { TranscodeVideoCmd, MP4 } from 'utils/ffmpeg/cmd';
import { logError } from 'utils/sentry';
import { getLocalUserPreferences } from 'utils/user';

class TranscodingService {
    ElectronAPIs: any;
    private allElectronAPIsExist: boolean = false;

    constructor() {
        this.ElectronAPIs = runningInBrowser() && window['ElectronAPIs'];
        this.allElectronAPIsExist = !!this.ElectronAPIs?.getTranscodedFile;
    }

    async getTranscodedVideo(file: ElectronFile | File) {
        try {
            if (isElectron() && this.allElectronAPIsExist) {
                const outputFile: ElectronFile =
                    await this.ElectronAPIs.getTranscodedFile(
                        [...TranscodeVideoCmd],
                        file,
                        MP4
                    );
                console.log({ outputFile });
                return await outputFile.arrayBuffer();
            }
        } catch (e) {
            logError(e, 'get streamable video file failed');
            return;
        }
    }

    async transcodeFile(file: ElectronFile | File, fileTypeInfo: FileTypeInfo) {
        const userPreferences = getLocalUserPreferences();
        if (
            fileTypeInfo.fileType === FILE_TYPE.VIDEO &&
            userPreferences?.data.isVidTranscodingEnabled
        ) {
            console.log('transcoding video');
            const transcodedVideo = await this.getTranscodedVideo(file);
            console.log({ vidFileVariant: transcodedVideo });
            if (transcodedVideo) {
                const fileVariants: FileWithMetadata['fileVariants'] = {
                    tcFile: transcodedVideo,
                };
                return fileVariants;
            }
        }
    }
}

export default new TranscodingService();
