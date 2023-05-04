import { CACHES } from '@ente/constants/cache';
import { CacheStorageService } from '@ente/services/cache/cacheStorageService';
import { logError } from '../sentry';

export async function cached(
    cacheName: string,
    id: string,
    get: () => Promise<Blob>
): Promise<Blob> {
    const cache = await CacheStorageService.open(cacheName);
    const cacheResponse = await cache.match(id);

    let result: Blob;
    if (cacheResponse) {
        result = await cacheResponse.blob();
    } else {
        result = await get();

        try {
            await cache.put(id, new Response(result));
        } catch (e) {
            // TODO: handle storage full exception.
            console.error('Error while storing file to cache: ', id);
        }
    }

    return result;
}

export async function getBlobFromCache(
    cacheName: string,
    url: string
): Promise<Blob> {
    const cache = await CacheStorageService.open(cacheName);
    const response = await cache.match(url);

    return response.blob();
}

export async function deleteAllCache() {
    try {
        await CacheStorageService.delete(CACHES.THUMBS);
        await CacheStorageService.delete(CACHES.FACE_CROPS);
        await CacheStorageService.delete(CACHES.FILES);
    } catch (e) {
        logError(e, 'deleteAllCache failed'); // log and ignore
    }
}
