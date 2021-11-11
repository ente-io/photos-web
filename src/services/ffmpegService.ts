import { createFFmpeg, FFmpeg } from '@ffmpeg/ffmpeg';
import { CustomError } from 'utils/common/errorUtil';
import { logError } from 'utils/sentry';
import QueueProcessor from './upload/queueProcessor';
import { getUint8ArrayView } from './upload/readFileService';

class FFmpegService {
    private generateThumbnailProcessor = new QueueProcessor<Uint8Array>(1);
    async getFFmpegInstance() {
        try {
            const ffmpeg = createFFmpeg({
                corePath: '/js/ffmpeg/ffmpeg-core.js',
                log: true,
            });
            await ffmpeg.load();
            return ffmpeg;
        } catch (e) {
            logError(e, 'ffmpeg load failed');
            throw e;
        }
    }

    closeFFMPEG(ffmpeg: FFmpeg) {
        try {
            ffmpeg.exit();
        } catch (e) {
            // ignore
        }
    }

    async generateThumbnail(file: File) {
        const response = this.generateThumbnailProcessor.queueUpRequest(() =>
            this.generateThumbnailHelper(file)
        );
        try {
            return await response.promise;
        } catch (e) {
            if (e.message === CustomError.REQUEST_CANCELLED) {
                // ignore
                return null;
            } else {
                logError(e, 'ffmpeg thumbnail generation failed');
                throw e;
            }
        }
    }

    async generateThumbnailHelper(file: File) {
        let ffmpeg: FFmpeg;
        try {
            ffmpeg = await this.getFFmpegInstance();
            const inputFileName = `${Date.now().toString()}-${file.name}`;
            const thumbFileName = `${Date.now().toString()}-thumb.jpeg`;
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
                        '-vf',
                        'scale=-1:720',
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
        } finally {
            this.closeFFMPEG(ffmpeg);
        }
    }
}

export default new FFmpegService();
