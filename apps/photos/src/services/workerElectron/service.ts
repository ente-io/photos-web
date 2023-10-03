import * as Comlink from 'comlink';
import { LimitedCache } from 'types/cache';
import { WorkerElectronClient } from './client';
import { wrap } from 'comlink';
import {
    deserializeToResponse,
    serializeResponse,
} from 'utils/workerElectronCache/proxy';
import { ProxiedLimitedCache, WorkerElectronAPIs } from 'types/workerElectron';

class WorkerElectronService implements WorkerElectronAPIs {
    proxiedElectronService: Comlink.Remote<WorkerElectronClient>;
    ready: Promise<any>;

    constructor() {
        this.ready = this.init();
    }
    async init() {
        const proxiedElectronService = wrap<typeof WorkerElectronClient>(self);

        this.proxiedElectronService = await new proxiedElectronService();
    }
    async openDiskCache(cacheName: string) {
        await this.ready;
        const cache = await this.proxiedElectronService.openDiskCache(
            cacheName
        );
        return {
            match: transformMatch(cache.match.bind(cache)),
            put: transformPut(cache.put.bind(cache)),
            delete: cache.delete.bind(cache),
        };
    }

    async deleteDiskCache(cacheName: string) {
        await this.ready;
        return await this.proxiedElectronService.deleteDiskCache(cacheName);
    }

    async computeImageEmbeddings(imageFile: Uint8Array): Promise<Float32Array> {
        await this.ready;
        return await this.proxiedElectronService.computeImageEmbeddings(
            imageFile
        );
    }
}

export default new WorkerElectronService();

function transformMatch(
    fn: ProxiedLimitedCache['match']
): LimitedCache['match'] {
    return async (key: string) => {
        return deserializeToResponse(await fn(key));
    };
}

function transformPut(fn: ProxiedLimitedCache['put']): LimitedCache['put'] {
    return async (key: string, data: Response) => {
        fn(key, await serializeResponse(data));
    };
}
