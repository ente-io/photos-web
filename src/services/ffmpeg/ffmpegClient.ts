import { createFFmpeg, FFmpeg } from 'ffmpeg';
import { getUint8ArrayView, sanitizeName } from 'utils/ffmpeg';

class FFmpegClient {
    private ffmpeg: FFmpeg = null;
    isLoading = null;

    async init() {
        this.ffmpeg = createFFmpeg({
            corePath: '/js/ffmpeg/ffmpeg-core.js',
            singleThread: true,
            log: true,
        });
        this.isLoading = this.ffmpeg.load();
        await this.isLoading;
        this.isLoading = null;
    }

    async generateThumbnail(file: File) {
        let inputFileName: string;
        let thumbFileName: string;
        try {
            if (!file) {
                throw Error('invalid input file');
            }
            if (!this.ffmpeg) {
                throw Error('ffmpeg not loaded');
            }
            inputFileName = `${Date.now().toString()}-${sanitizeName(
                file.name
            )}`;
            thumbFileName = `${Date.now().toString()}-thumb.jpeg`;

            await this.writeFile(inputFileName, file);

            let seekTime = 1.0;
            let thumb = null;
            while (seekTime > 0) {
                try {
                    await this.ffmpeg.run(
                        '-ss',
                        `00:00:0${seekTime.toFixed(3)}`,
                        '-i',
                        inputFileName,
                        '-vframes',
                        '1',
                        '-vf',
                        'scale=-1:720',
                        thumbFileName
                    );
                    thumb = this.ffmpeg.FS('readFile', thumbFileName);
                    break;
                } catch (e) {
                    seekTime = Number((seekTime / 10).toFixed(3));
                }
            }
            this.ffmpeg.FS('unlink', inputFileName);
            return thumb;
        } finally {
            try {
                this.ffmpeg.FS('unlink', inputFileName);
            } catch (e) {
                // ignore
            }
            try {
                this.ffmpeg.FS('unlink', thumbFileName);
            } catch (e) {
                // ignore
            }
        }
    }

    private async writeFile(saveName: string, file: File) {
        this.ffmpeg.FS(
            'writeFile',
            saveName,
            await getUint8ArrayView(new FileReader(), file)
        );
    }
}

export default new FFmpegClient();
