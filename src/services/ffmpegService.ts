import { createFFmpeg, FFmpeg } from '@ffmpeg/ffmpeg';
import { CustomError } from 'utils/common/errorUtil';
import { logError } from 'utils/sentry';
import QueueProcessor from './upload/queueProcessor';
import { getUint8ArrayView } from './upload/readFileService';

class FFmpegService {
    private ffmpeg: FFmpeg = null;
    private isLoading = null;

    private generateThumbnailProcessor = new QueueProcessor<Uint8Array>(1);
    async init() {
        try {
            this.ffmpeg = createFFmpeg({
                corePath: '/js/ffmpeg/ffmpeg-core.js',
            });
            this.isLoading = this.ffmpeg.load();
            await this.isLoading;
            this.isLoading = null;
        } catch (e) {
            logError(e, 'ffmpeg load failed');
            throw e;
        }
    }

    async generateThumbnail(file: File) {
        if (!this.ffmpeg) {
            await this.init();
        }
        if (this.isLoading) {
            await this.isLoading;
        }
        const response = this.generateThumbnailProcessor.queueUpRequest(
            generateThumbnailHelper.bind(null, this.ffmpeg, file)
        );

        const thumbnail = await response.promise;
        if (!thumbnail) {
            throw Error(CustomError.THUMBNAIL_GENERATION_FAILED);
        }
        return thumbnail;
    }
}

async function generateThumbnailHelper(ffmpeg: FFmpeg, file: File) {
    try {
        const inputFileName = `${Date.now().toString}-${file.name}`;
        const thumbFileName = `${Date.now().toString}-thumb.png`;
        ffmpeg.FS(
            'writeFile',
            inputFileName,
            await getUint8ArrayView(new FileReader(), file)
        );
        let seekTime = 1.0;
        let thumb = null;
        while (seekTime > 0) {
            try {
                await ffmpeg.run(
                    '-i',
                    inputFileName,
                    '-ss',
                    `00:00:0${seekTime.toFixed(3)}`,
                    '-vframes',
                    '1',
                    thumbFileName
                );
                thumb = ffmpeg.FS('readFile', thumbFileName);
                ffmpeg.FS('unlink', thumbFileName);
                break;
            } catch (e) {
                seekTime = Number((seekTime / 10).toFixed(3));
            }
        }
        ffmpeg.FS('unlink', inputFileName);
        return thumb;
    } catch (e) {
        logError(e, 'ffmpeg thumbnail generation failed');
        throw e;
    }
}

export default new FFmpegService();
