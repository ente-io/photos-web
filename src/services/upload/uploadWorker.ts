import { CustomError } from 'utils/common/errorUtil';
import { getDedicatedCryptoWorker } from 'utils/crypto';

class UploadWorker {
    private internalWorkers: Worker[] = [];
    private comlinkRemotes: any = [];
    async initWorkerPool(size: number) {
        while (this.internalWorkers.length < size) {
            await this.addNewWorker();
        }
    }
    private async addNewWorker() {
        try {
            const comlinkWorker = getDedicatedCryptoWorker();
            this.internalWorkers.push(comlinkWorker.worker);
            this.comlinkRemotes.push(await new comlinkWorker.comlink());
        } catch (e) {
            throw Error(CustomError.FAILED_TO_LOAD_WEB_WORKER);
        }
    }

    async get() {
        return this.comlinkRemotes.shift();
    }

    release(comlinkRemote: any) {
        this.comlinkRemotes.push(comlinkRemote);
    }

    terminateWorkers() {
        for (let i = 0; i < this.internalWorkers.length; i++) {
            this.internalWorkers[i].terminate();
        }
    }
}

export default new UploadWorker();
