import { runningInBrowser } from 'utils/common';
import { DedicatedMLWorker } from 'worker/ml.worker';
import { ComlinkWorker } from './comlinkWorker';

export const getDedicatedMLWorker = (name: string) => {
    if (runningInBrowser()) {
        const cryptoComlinkWorker = new ComlinkWorker<typeof DedicatedMLWorker>(
            name ?? 'ente-ml-worker',
            new Worker(new URL('worker/ml.worker.ts', import.meta.url))
        );
        return cryptoComlinkWorker;
    }
};
