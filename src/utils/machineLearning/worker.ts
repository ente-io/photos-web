import { runningInBrowser } from 'utils/common';
import { Remote, wrap } from 'comlink';
import { DedicatedMLWorker } from 'worker/machineLearning.worker';
import { MachineLearningWorker } from 'types/machineLearning';
import { syncWithRemote } from 'utils/file';

export const WorkerMessage = {
    SYNC_WITH_REMOTE: 'SYNC_WITH_REMOTE',
};

export class MLWorkerWithProxy {
    public proxy: Promise<Remote<MachineLearningWorker>>;
    private worker: Worker;
    private name: string;

    constructor(name: string) {
        this.name = name;
        if (!runningInBrowser()) {
            return;
        }
        this.worker = new Worker(
            new URL('worker/machineLearning.worker', import.meta.url),
            { name: 'ml-sync' }
        );
        this.worker.onerror = (errorEvent) => {
            console.error('Got error event from worker', errorEvent);
        };
        this.worker.onmessage = async (event) => {
            console.log(`Got message from ${this.name}`, event);
            if (event?.data === WorkerMessage.SYNC_WITH_REMOTE) {
                await syncWithRemote();
            }
        };
        console.log(`Initiated ${this.name}`);
        const comlink = wrap<typeof DedicatedMLWorker>(this.worker);
        this.proxy = new comlink();
    }

    public terminate() {
        this.worker.terminate();
        console.log(`Terminated ${this.name}`);
    }
}
