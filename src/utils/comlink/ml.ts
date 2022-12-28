import { ComlinkWorker } from 'utils/comlink/comlinkWorker';
import { runningInBrowser } from 'utils/common';
import { DedicatedMLWorker } from 'worker/machineLearning.worker';

export const getDedicatedMLWorker = (
    name: 'ml-sync-worker' | 'ml-live-sync-worker'
) => {
    if (runningInBrowser()) {
        const cryptoComlinkWorker = new ComlinkWorker<typeof DedicatedMLWorker>(
            name,
            new Worker(
                new URL('worker/machineLearning.worker.ts', import.meta.url)
            )
        );
        return cryptoComlinkWorker;
    }
};
