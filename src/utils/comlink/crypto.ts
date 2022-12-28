import { ComlinkWorker } from 'utils/comlink/comlinkWorker';
import { runningInBrowser } from 'utils/common';
import { DedicatedCryptoWorker } from 'worker/crypto.worker';

export const getDedicatedCryptoWorker = () => {
    if (runningInBrowser()) {
        const cryptoComlinkWorker = new ComlinkWorker<
            typeof DedicatedCryptoWorker
        >(
            'ente-crypto-worker',
            new Worker(new URL('worker/crypto.worker.ts', import.meta.url))
        );
        return cryptoComlinkWorker;
    }
};

export const CryptoWorker = getDedicatedCryptoWorker()?.remote;
