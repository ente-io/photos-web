import { LimitedCacheStorage } from '@ente/types/cache/index';
import { ElectronCacheStorage } from '@ente/services/electron/cache';
import { runningInElectron, runningInWorker } from '@ente/utils/common';
import { WorkerElectronCacheStorageService } from '@ente/services/workerElectronCache/service';

class cacheStorageFactory {
    workerElectronCacheStorageServiceInstance: WorkerElectronCacheStorageService;
    getCacheStorage(): LimitedCacheStorage {
        if (runningInElectron()) {
            if (runningInWorker()) {
                if (!this.workerElectronCacheStorageServiceInstance) {
                    this.workerElectronCacheStorageServiceInstance =
                        new WorkerElectronCacheStorageService();
                }
                return this.workerElectronCacheStorageServiceInstance;
            } else {
                return ElectronCacheStorage;
            }
        } else {
            return transformBrowserCacheStorageToLimitedCacheStorage(caches);
        }
    }
}

export const CacheStorageFactory = new cacheStorageFactory();

function transformBrowserCacheStorageToLimitedCacheStorage(
    caches: CacheStorage
): LimitedCacheStorage {
    return {
        async open(cacheName) {
            const cache = await caches.open(cacheName);
            return {
                match: cache.match.bind(cache),
                put: cache.put.bind(cache),
                delete: cache.delete.bind(cache),
            };
        },
        delete: caches.delete.bind(caches),
    };
}
