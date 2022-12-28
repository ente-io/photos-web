import { ComlinkWorker } from 'utils/comlink/comlinkWorker';
import { runningInBrowser } from 'utils/common';
import { DedicatedFFmpegWorker } from 'worker/ffmpeg.worker';

const getDedicatedFFmpegWorker = () => {
    if (runningInBrowser()) {
        const cryptoComlinkWorker = new ComlinkWorker<
            typeof DedicatedFFmpegWorker
        >(
            'ente-ffmpeg-worker',
            new Worker(new URL('worker/ffmpeg.worker.ts', import.meta.url))
        );
        return cryptoComlinkWorker;
    }
};

export const FFmpegWorker = getDedicatedFFmpegWorker()?.remote;
