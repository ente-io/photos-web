import {
    ClipService,
    Versioned,
    ClipMethod,
    ClipImageEmbeddingExtractionResult,
} from 'types/machineLearning';
import WorkerElectronService from 'services/workerElectron/service';
import { imageBitmapToBlob } from 'utils/image';

class ClipVit32Service implements ClipService {
    public method: Versioned<ClipMethod>;

    public constructor() {
        this.method = {
            value: 'ClipVit32',
            version: 1,
        };
    }

    public async computeImageEmbeddings(
        image: ImageBitmap
    ): Promise<ClipImageEmbeddingExtractionResult> {
        const imageData = new Uint8Array(
            await (await imageBitmapToBlob(image)).arrayBuffer()
        );
        const imageEmbeddings =
            await WorkerElectronService.computeImageEmbeddings(imageData);
        return {
            imageEmbeddings,
        };
    }
}

export default new ClipVit32Service();
