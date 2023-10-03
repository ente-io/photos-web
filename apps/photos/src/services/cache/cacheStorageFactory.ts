import { LimitedCacheStorage } from 'types/cache/index';
import { ElectronCacheStorage } from 'services/electron/cache';
import { runningInElectron, runningInWorker } from 'utils/common';
import WorkerElectronService from 'services/workerElectron/service';

class cacheStorageFactory {
    getCacheStorage(): LimitedCacheStorage {
        if (runningInElectron()) {
            if (runningInWorker()) {
                return {
                    open: WorkerElectronService.openDiskCache.bind(
                        WorkerElectronService
                    ),
                    delete: WorkerElectronService.deleteDiskCache.bind(
                        WorkerElectronService
                    ),
                };
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
