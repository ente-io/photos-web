import * as Comlink from 'comlink';
import FFmpegClient from 'services/ffmpeg/ffmpegClient';

export class FFmpeg {
    ffmpegClient;
    constructor() {
        this.ffmpegClient = new FFmpegClient();
    }
    async generateThumbnail(file) {
        return this.ffmpegClient.generateThumbnail(file);
    }
    async extractVideoMetadata(file) {
        return this.ffmpegClient.extractVideoMetadata(file);
    }

    async transcode(file, outputFormatExtension) {
        return this.ffmpegClient.transcode(file, outputFormatExtension);
    }
}

Comlink.expose(FFmpeg);
