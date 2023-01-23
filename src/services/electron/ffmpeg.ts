import { IFFmpeg } from 'services/ffmpeg/ffmpegFactory';
import { ElectronAPIs } from 'types/electron';
import { ElectronFile } from 'types/upload';
import { runningInBrowser } from 'utils/common';

export class ElectronFFmpeg implements IFFmpeg {
    private electronAPIs: ElectronAPIs;

    constructor() {
        this.electronAPIs = runningInBrowser() && globalThis['ElectronAPIs'];
    }

    async run(
        cmd: string[],
        inputFile: ElectronFile | File,
        outputFilename: string
    ) {
        if (this.electronAPIs?.runFFmpegCmd) {
            return this.electronAPIs.runFFmpegCmd(
                cmd,
                inputFile,
                outputFilename
            );
        }
    }
    async liveTranscodeVideo(inputFileStream: ReadableStream<Uint8Array>) {
        if (this.electronAPIs?.liveTranscodeVideo) {
            return this.electronAPIs.liveTranscodeVideo(inputFileStream);
        }
    }
}
