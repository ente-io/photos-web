import { CustomError } from 'utils/common/errorUtil';
import { logError } from 'utils/sentry';
import QueueProcessor from '../upload/queueProcessor';
import * as Comlink from 'comlink';

class FFmpegService {
    private ffmpegWorker = null;

    private generateThumbnailProcessor = new QueueProcessor<Uint8Array>(1);
    async init() {
        try {
            const worker = new Worker(
                new URL('worker/ffmpeg.worker.js', import.meta.url)
            );
            this.ffmpegWorker = await new (Comlink.wrap(worker) as any)();

            await this.ffmpegWorker.init();
        } catch (e) {
            logError(e, 'ffmpeg load failed');
            throw e;
        }
    }

    async generateThumbnail(file: File) {
        if (!this.ffmpegWorker) {
            await this.init();
        }
        if (this.ffmpegWorker.isLoading()) {
            await this.ffmpegWorker.isLoading();
        }
        const response = this.generateThumbnailProcessor.queueUpRequest(() =>
            this.ffmpegWorker.generateThumbnail(file)
        );

        const thumbnail = await response.promise;
        if (!thumbnail) {
            throw Error(CustomError.THUMBNAIL_GENERATION_FAILED);
        }
        return thumbnail;
    }
}

export default new FFmpegService();
