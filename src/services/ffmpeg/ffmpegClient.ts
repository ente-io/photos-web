import { createFFmpeg, FFmpeg } from 'ffmpeg';
import { getUint8ArrayView } from 'utils/readFile';
import { logError } from 'utils/sentry';

class FFmpegClient {
    private ffmpeg: FFmpeg = null;
    isLoading = null;

    async init() {
        try {
            this.ffmpeg = createFFmpeg({
                corePath: '/js/ffmpeg/ffmpeg-core.js',
                mainName: 'main',
                log: true,
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
        if (!file) {
            throw Error('invalid input file');
        }
        if (!this.ffmpeg) {
            throw Error('ffmpeg not loaded');
        }
        const inputFileName = `${Date.now().toString()}-${file.name}`;
        const thumbFileName = `${Date.now().toString()}-thumb.jpeg`;

        try {
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
                        '-s',
                        '960x540',
                        '-f',
                        'image2',
                        '-vframes',
                        '1',
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
        } catch (e) {
            logError(e, 'ffmpeg thumbnail generation failed');
            throw e;
        } finally {
            try {
                this.ffmpeg.FS('unlink', inputFileName);
            } catch (e) {
                logError(e, 'input file unlink failed');
            }
            try {
                this.ffmpeg.FS('unlink', thumbFileName);
            } catch (e) {
                logError(e, 'thumbnail file unlink failed');
            }
        }
    }

    private async writeFile(saveName: string, file: File) {
        this.ffmpeg.FS(
            'writeFile',
            saveName,
            await getUint8ArrayView(new FileReader(), file)
        );
        //     const FS = this.ffmpeg.FS;
        //     const rootDirs = FS('readdir', '/');
        //     if (rootDirs.indexOf('input') === -1) {
        //         FS('mkdir', '/input');
        //     } else {
        //         this.ffmpeg.FS('unmount', 'input');
        //     }
        //     if (rootDirs.indexOf('output') === -1) {
        //         FS('mkdir', '/output');
        //     }
        //     const tmpfile = new File([file], 'file', { type: file.type });
        //     FS('mount', 'WORKERFS', { files: [tmpfile] }, '/input');
    }
}

export default new FFmpegClient();
