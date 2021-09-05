import * as Comlink from 'comlink';
import FFmpegClient from 'services/ffmpeg/ffmpegClient';

export class FFmpegWorker {
    async init() {
        return FFmpegClient.init();
    }

    isLoading() {
        return FFmpegClient.isLoading;
    }

    async generateThumbnail(file) {
        return FFmpegClient.generateThumbnail(file);
    }
}

Comlink.expose(FFmpegWorker);
