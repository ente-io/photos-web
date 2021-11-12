import { CustomError } from 'utils/common/errorUtil';
import { logError } from 'utils/sentry';
import QueueProcessor from './upload/queueProcessor';
import { getUint8ArrayView } from './upload/readFileService';
import ffmpeg from 'ffmpeg.js/ffmpeg-mp4';
class FFmpegService {
    private generateThumbnailProcessor = new QueueProcessor<Uint8Array>(1);

    async generateThumbnail(file: File) {
        const response = this.generateThumbnailProcessor.queueUpRequest(() =>
            this.generateThumbnailHelper(file)
        );

        const thumbnail = await response.promise;
        if (!thumbnail) {
            throw Error(CustomError.THUMBNAIL_GENERATION_FAILED);
        }
        return thumbnail;
    }

    async generateThumbnailHelper(file: File) {
        try {
            const inputFileName = `${Date.now().toString()}-${file.name}`;
            const thumbFileName = `${Date.now().toString()}-thumb.png`;
            let stdout = '';
            let stderr = '';
            const result = ffmpeg({
                MEMFS: [
                    {
                        name: inputFileName,
                        data: await getUint8ArrayView(new FileReader(), file),
                    },
                ],
                arguments: [
                    '-i',
                    inputFileName,
                    '-ss',
                    `00:00:01`,
                    '-vframes',
                    '1',
                    '-vf',
                    'scale=-1:720',
                    thumbFileName,
                ],
                print: function (data) {
                    stdout += data + '\n';
                },
                printErr: function (data) {
                    stderr += data + '\n';
                },
                onExit: function (code) {
                    console.log('Process exited with code ' + code);
                    console.log(stdout);
                    console.log(stderr);
                },
            });
            console.log(result);
            return result.MEMFS[0].data;
        } catch (e) {
            logError(e, 'ffmpeg thumbnail generation failed');
            throw e;
        }
    }
}

export default new FFmpegService();
