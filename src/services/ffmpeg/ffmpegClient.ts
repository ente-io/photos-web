import { createFFmpeg, FFmpeg } from 'ffmpeg';

const WORKING_DIR = 'working';
const WORKERFS = 'WORKERFS';

class FFmpegClient {
    private ffmpeg: FFmpeg = null;
    isLoading = null;
    workingDirectoryExists = false;

    async init() {
        if (this.isLoading) {
            await this.isLoading();
        }
        this.ffmpeg = createFFmpeg({
            corePath: '/js/ffmpeg/ffmpeg-core.js',
            mainName: 'main',
            log: true,
        });
        this.isLoading = this.ffmpeg.load();
        await this.isLoading;
        this.isLoading = null;
    }

    async generateThumbnail(file: File) {
        if (!file) {
            throw Error('invalid input file');
        }
        if (!this.ffmpeg) {
            throw Error('ffmpeg not loaded');
        }
        const inputFileName = `${Date.now().toString()}-${file.name}`;
        const thumbFilePath = `${WORKING_DIR}/${Date.now().toString()}-thumb.jpeg`;
        try {
            this.loadFile(inputFileName, file);

            let seekTime = 1.0;
            let thumb = null;
            while (seekTime > 0) {
                try {
                    await this.ffmpeg.run(
                        '-ss',
                        `00:00:0${seekTime.toFixed(3)}`,
                        '-i',
                        `${WORKING_DIR}/${inputFileName}`,
                        '-s',
                        '960x540',
                        '-f',
                        'image2',
                        '-vframes',
                        '1',
                        thumbFilePath
                    );
                    thumb = this.ffmpeg.FS('readFile', thumbFilePath);
                    break;
                } catch (e) {
                    seekTime = Number((seekTime / 10).toFixed(3));
                }
            }
            return thumb;
        } finally {
            this.cleanUp();
        }
    }

    private loadFile(inputFileName: string, file: File) {
        const FS = this.ffmpeg.FS;
        if (!this.workingDirectoryExists) {
            FS('mkdir', WORKING_DIR);
            this.workingDirectoryExists = true;
        }
        const tmpfile = new File([file], inputFileName, { type: file.type });

        FS('mount', WORKERFS, { files: [tmpfile] }, WORKING_DIR);
    }

    private cleanUp() {
        try {
            this.ffmpeg.FS('unmount', WORKING_DIR);
        } catch (e) {
            // ignore
        }
    }
}

export default new FFmpegClient();
