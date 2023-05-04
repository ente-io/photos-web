import { ElectronCacheStorage } from '../electron/cache';
import * as Comlink from 'comlink';
import {
    LimitedCache,
    ProxiedLimitedCacheStorage,
    ProxiedWorkerLimitedCache,
} from '@ente/types/cache';
import {
    serializeResponse,
    deserializeToResponse,
} from '@ente/utils/workerElectronCache/proxy';

export class WorkerElectronCacheStorageClient
    implements ProxiedLimitedCacheStorage
{
    async open(cacheName: string) {
        const cache = await ElectronCacheStorage.open(cacheName);
        return Comlink.proxy({
            match: Comlink.proxy(transformMatch(cache.match.bind(cache))),
            put: Comlink.proxy(transformPut(cache.put.bind(cache))),
            delete: Comlink.proxy(cache.delete.bind(cache)),
        });
    }

    async delete(cacheName: string) {
        return await ElectronCacheStorage.delete(cacheName);
    }
}

function transformMatch(
    fn: LimitedCache['match']
): ProxiedWorkerLimitedCache['match'] {
    return async (key: string) => {
        return serializeResponse(await fn(key));
    };
}

function transformPut(
    fn: LimitedCache['put']
): ProxiedWorkerLimitedCache['put'] {
    return async (key: string, data: ArrayBuffer) => {
        fn(key, deserializeToResponse(data));
    };
}
