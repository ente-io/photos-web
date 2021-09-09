import { CustomError } from 'utils/common/errorUtil';
import { ComlinkWorker, getDedicatedCryptoWorker } from 'utils/crypto';

class UploadWorker {
    private comlinkWorkers: ComlinkWorker[] = [];
    async initWorkerPool(size: number) {
        while (this.comlinkWorkers.length < size) {
            await this.addNewWorker();
        }
    }
    private async addNewWorker() {
        try {
            const comlinkWorker = getDedicatedCryptoWorker();
            this.comlinkWorkers.push(comlinkWorker);
        } catch (e) {
            throw Error(CustomError.FAILED_TO_LOAD_WEB_WORKER);
        }
    }

    get() {
        return this.comlinkWorkers.shift();
    }

    async release(comlinkWorker: ComlinkWorker) {
        comlinkWorker.worker.terminate();
        await this.addNewWorker();
    }

    terminateWorkers() {
        for (let i = 0; i < this.comlinkWorkers.length; i++) {
            this.comlinkWorkers[i].worker.terminate();
        }
    }
}

export default new UploadWorker();
