import { FFmpeg } from '@ffmpeg/ffmpeg';
import {
    createFFmpeg as createFFmpeg_old,
    FFmpeg as FFmpeg_old,
} from 'ffmpeg-wasm';
import QueueProcessor from 'services/queueProcessor';
import { getUint8ArrayView } from 'services/readerService';
import { promiseWithTimeout } from 'utils/common';
import { addLogLine } from '@ente/shared/logging';
import { logError } from '@ente/shared/sentry';
import { generateTempName } from 'utils/temp';
// import { convertBytesToHumanReadable } from '@ente/shared/utils/size';

const INPUT_PATH_PLACEHOLDER = 'INPUT';
const FFMPEG_PLACEHOLDER = 'FFMPEG';
const OUTPUT_PATH_PLACEHOLDER = 'OUTPUT';

const FFMPEG_EXECUTION_WAIT_TIME = 30 * 1000;

export class WasmFFmpeg {
    private ffmpeg_old: FFmpeg_old;
    private ffmpeg: FFmpeg;
    private ready: Promise<void> = null;
    private ffmpegTaskQueue = new QueueProcessor<File>(1);

    constructor() {
        this.ready = (async () => {
            // await this.init();
            await this.init_old();
        })();
    }

    private async init_old() {
        this.ffmpeg_old = createFFmpeg_old({
            corePath: '/js/ffmpeg-custom/ffmpeg-core.js',
            mt: false,
            logger: (message) => {
                addLogLine('ffmpeg_oldLog', message.message);
            },
        });

        if (!this.ffmpeg_old.isLoaded()) {
            await this.ffmpeg_old.load();
        }
    }

    private async init() {
        try {
            addLogLine('ffmpegLog', 'ffmpeg constructor');
            this.ffmpeg = new FFmpeg();
            addLogLine('ffmpegLog', 'ffmpeg constructor 2');
            this.ffmpeg.on('log', (message) => {
                addLogLine('ffmpegLog', message.message);
            });
            addLogLine('ffmpegLog', 'ffmpeg constructor 3');
            addLogLine('ffmpegLog', 'ffmpeg init');
            if (!this.ffmpeg.loaded) {
                addLogLine('ffmpegLog', 'ffmpeg init 2');
                await this.ffmpeg.load({
                    coreURL: '/js/ffmpeg-st/ffmpeg-core.js',
                    wasmURL: '/js/ffmpeg-st/ffmpeg-core.wasm',
                    // workerURL: '/js/ffmpeg/ffmpeg-core.worker.js',
                });
                addLogLine('ffmpegLog', 'ffmpeg init 3');
            }
            addLogLine('ffmpegLog', 'ffmpeg init 4');
            addLogLine('ffmpegLog', 'ffmpeg constructor 4');
        } catch (e) {
            console.log('ffmpegLog', 'ffmpeg init error', e);
            setTimeout(() => {
                this.ready = this.init();
            }, 1000);
        }
    }

    async run(
        cmd: string[],
        inputFile: File,
        outputFileName: string,
        dontTimeout = false
    ) {
        let oldV: File;
        //  newV: File;
        try {
            oldV = await this.run_old(
                cmd,
                inputFile,
                outputFileName,
                dontTimeout
            );
        } catch (e) {
            console.log('old ffmpeg failed', e);
        }
        // try {
        //     newV = await this.run_new(
        //         cmd,
        //         inputFile,
        //         outputFileName,
        //         dontTimeout
        //     );
        // } catch (e) {
        //     console.log('new ffmpeg failed', e);
        // }
        // if (oldV && !newV) {
        //     console.log(
        //         'new ffmpeg failed, old succeeded',
        //         convertBytesToHumanReadable(oldV.size)
        //     );
        // }
        return oldV;
    }

    async run_new(
        cmd: string[],
        inputFile: File,
        outputFileName: string,
        dontTimeout = false
    ) {
        const response = this.ffmpegTaskQueue.queueUpRequest(() => {
            if (dontTimeout) {
                return this.execute(cmd, inputFile, outputFileName);
            } else {
                return promiseWithTimeout<File>(
                    this.execute(cmd, inputFile, outputFileName),
                    FFMPEG_EXECUTION_WAIT_TIME
                );
            }
        });
        try {
            return await response.promise;
        } catch (e) {
            logError(e, 'ffmpeg run failed');
            throw e;
        }
    }

    async run_old(
        cmd: string[],
        inputFile: File,
        outputFileName: string,
        dontTimeout = false
    ) {
        const response = this.ffmpegTaskQueue.queueUpRequest(() => {
            if (dontTimeout) {
                return this.execute_old(cmd, inputFile, outputFileName);
            } else {
                return promiseWithTimeout<File>(
                    this.execute_old(cmd, inputFile, outputFileName),
                    FFMPEG_EXECUTION_WAIT_TIME
                );
            }
        });
        try {
            return await response.promise;
        } catch (e) {
            logError(e, 'ffmpeg run old failed');
            throw e;
        }
    }

    private async execute_old(
        cmd: string[],
        inputFile: File,
        outputFileName: string
    ) {
        let tempInputFilePath: string;
        let tempOutputFilePath: string;
        try {
            await this.ready;
            const extension = getFileExtension(inputFile.name);
            const tempNameSuffix = extension ? `input.${extension}` : 'input';
            tempInputFilePath = `${generateTempName(10, tempNameSuffix)}`;
            this.ffmpeg_old.FS(
                'writeFile',
                tempInputFilePath,
                await getUint8ArrayView(inputFile)
            );
            tempOutputFilePath = `${generateTempName(10, outputFileName)}`;

            cmd = cmd.map((cmdPart) => {
                if (cmdPart === FFMPEG_PLACEHOLDER) {
                    return '';
                } else if (cmdPart === INPUT_PATH_PLACEHOLDER) {
                    return tempInputFilePath;
                } else if (cmdPart === OUTPUT_PATH_PLACEHOLDER) {
                    return tempOutputFilePath;
                } else {
                    return cmdPart;
                }
            });
            addLogLine(`${cmd}`);
            await this.ffmpeg_old.run(...cmd);
            return new File(
                [this.ffmpeg_old.FS('readFile', tempOutputFilePath)],
                outputFileName
            );
        } finally {
            try {
                this.ffmpeg_old.FS('unlink', tempInputFilePath);
            } catch (e) {
                logError(e, 'unlink input file failed');
            }
            try {
                this.ffmpeg_old.FS('unlink', tempOutputFilePath);
            } catch (e) {
                logError(e, 'unlink output file failed');
            }
        }
    }

    private async execute(
        cmd: string[],
        inputFile: File,
        outputFileName: string
    ) {
        let tempInputFilePath: string;
        let tempOutputFilePath: string;
        try {
            await this.ready;
            const extension = getFileExtension(inputFile.name);
            const tempNameSuffix = extension ? `input.${extension}` : 'input';
            tempInputFilePath = `${generateTempName(10, tempNameSuffix)}`;
            this.ffmpeg.writeFile(
                tempInputFilePath,
                await getUint8ArrayView(inputFile)
            );
            tempOutputFilePath = `${generateTempName(10, outputFileName)}`;

            cmd = cmd.map((cmdPart) => {
                if (cmdPart === FFMPEG_PLACEHOLDER) {
                    return '';
                } else if (cmdPart === INPUT_PATH_PLACEHOLDER) {
                    return tempInputFilePath;
                } else if (cmdPart === OUTPUT_PATH_PLACEHOLDER) {
                    return tempOutputFilePath;
                } else {
                    return cmdPart;
                }
            });
            addLogLine(`${cmd}`);
            await this.ffmpeg.exec(cmd);
            return new File(
                [await this.ffmpeg.readFile(tempOutputFilePath)],
                outputFileName
            );
        } finally {
            try {
                this.ffmpeg.deleteFile(tempInputFilePath);
            } catch (e) {
                logError(e, 'unlink input file failed');
            }
            try {
                this.ffmpeg.deleteFile(tempOutputFilePath);
            } catch (e) {
                logError(e, 'unlink output file failed');
            }
        }
    }
}

function getFileExtension(filename: string) {
    const lastDotPosition = filename.lastIndexOf('.');
    if (lastDotPosition === -1) return null;
    else {
        return filename.slice(lastDotPosition + 1);
    }
}
