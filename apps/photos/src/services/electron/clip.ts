import { ElectronAPIs } from 'types/electron';

class ElectronClipService {
    private electronAPIs: ElectronAPIs;

    constructor() {
        this.electronAPIs = globalThis['ElectronAPIs'];
    }

    async computeImageEmbedding(imageData: Uint8Array): Promise<Float32Array> {
        // compute image embedding
        const embedding = await this.electronAPIs.computeImageEmbedding(
            imageData
        );
        return embedding;
    }

    async computeTextEmbedding(text: string): Promise<Float32Array> {
        // compute text embedding
        const embedding = await this.electronAPIs.computeTextEmbedding(text);
        return embedding;
    }
}

export default new ElectronClipService();
