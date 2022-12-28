import { ComlinkWorker } from 'utils/comlink/comlinkWorker';
import { runningInBrowser } from 'utils/common';
import { DedicatedConvertWorker } from 'worker/convert.worker';

export const getDedicatedConvertWorker = () => {
    if (runningInBrowser()) {
        const cryptoComlinkWorker = new ComlinkWorker<
            typeof DedicatedConvertWorker
        >(
            'ente-convert-worker',
            new Worker(new URL('worker/convert.worker.ts', import.meta.url))
        );
        return cryptoComlinkWorker;
    }
};
