import { ElectronAPIs } from './electron';

export interface ProxiedLimitedCache {
    match: (key: string) => Promise<ArrayBuffer>;
    put: (key: string, data: ArrayBuffer) => Promise<void>;
    delete: (key: string) => Promise<boolean>;
}

export interface ProxiedElectronAPIs {
    openDiskCache: (cacheName: string) => Promise<ProxiedLimitedCache>;
    deleteDiskCache: (cacheName: string) => Promise<boolean>;
    computeImageEmbeddings: (imageData: Uint8Array) => Promise<Float32Array>;
}

export type WorkerElectronAPIs = Pick<
    ElectronAPIs,
    'openDiskCache' | 'deleteDiskCache' | 'computeImageEmbeddings'
>;
