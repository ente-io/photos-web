import { ElectronCacheStorage } from 'services/electron/cache';
import * as Comlink from 'comlink';
import { LimitedCache } from 'types/cache';
import {
    serializeResponse,
    deserializeToResponse,
} from 'utils/workerElectronCache/proxy';
import { ProxiedLimitedCache, ProxiedElectronAPIs } from 'types/workerElectron';
import ElectronClipService from 'services/electron/clip';

export class WorkerElectronClient implements ProxiedElectronAPIs {
    async openDiskCache(cacheName: string) {
        const cache = await ElectronCacheStorage.open(cacheName);
        return Comlink.proxy({
            match: Comlink.proxy(transformMatch(cache.match.bind(cache))),
            put: Comlink.proxy(transformPut(cache.put.bind(cache))),
            delete: Comlink.proxy(cache.delete.bind(cache)),
        }) as ProxiedLimitedCache;
    }

    async deleteDiskCache(cacheName: string) {
        return ElectronCacheStorage.delete(cacheName);
    }

    async computeImageEmbedding(imageData: Uint8Array) {
        return ElectronClipService.computeImageEmbedding(imageData);
    }

    async computeTextEmbedding(text: string) {
        return ElectronClipService.computeTextEmbedding(text);
    }
}

function transformMatch(
    fn: LimitedCache['match']
): ProxiedLimitedCache['match'] {
    return async (key: string) => {
        return serializeResponse(await fn(key));
    };
}

function transformPut(fn: LimitedCache['put']): ProxiedLimitedCache['put'] {
    return async (key: string, data: ArrayBuffer) => {
        fn(key, deserializeToResponse(data));
    };
}
