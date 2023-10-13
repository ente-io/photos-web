import { ClipService, Versioned, ClipMethod } from 'types/machineLearning';
import WorkerElectronService from 'services/workerElectron/service';
import { imageBitmapToUint8Array } from 'utils/image';

class ClipVit32Service implements ClipService {
    public method: Versioned<ClipMethod>;

    public constructor() {
        this.method = {
            value: 'ClipVit32',
            version: 1,
        };
    }

    public async computeImageEmbedding(
        image: ImageBitmap
    ): Promise<Float32Array> {
        const imageData = await imageBitmapToUint8Array(image);
        const embedding = await WorkerElectronService.computeImageEmbedding(
            imageData
        );
        return embedding;
    }
    public async computeTextEmbedding(text: string): Promise<Float32Array> {
        const embedding = await WorkerElectronService.computeTextEmbedding(
            text
        );
        return embedding;
    }
}

export default new ClipVit32Service();
