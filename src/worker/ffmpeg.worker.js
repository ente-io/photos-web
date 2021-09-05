/* eslint-disable no-undef */
import * as Comlink from 'comlink';
import FFmpegClient from 'services/ffmpeg/ffmpegClient';

importScripts('/js/ffmpeg/ffmpeg-core.js');
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
