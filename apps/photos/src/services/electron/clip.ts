import { ElectronAPIs } from 'types/electron';

class ElectronClipService {
    private electronAPIs: ElectronAPIs;

    constructor() {
        this.electronAPIs = globalThis['ElectronAPIs'];
    }

    async computeImageEmbeddings(imageData: Uint8Array): Promise<Float32Array> {
        // compute image embeddings
        const embeddings = await this.electronAPIs.computeImageEmbeddings(
            imageData
        );
        return embeddings;
    }
}

export default new ElectronClipService();
