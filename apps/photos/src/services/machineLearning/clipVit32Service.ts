import {
    ClipService,
    Versioned,
    ClipMethod,
    ClipImageEmbeddingExtractionResult,
} from 'types/machineLearning';
import WorkerElectronService from 'services/workerElectron/service';

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
        const imageData = convertBitMapToUint8Array(image);
        const imageEmbeddings =
            await WorkerElectronService.computeImageEmbeddings(imageData);
        return {
            imageEmbeddings,
        };
    }
}

export default new ClipVit32Service();

const convertBitMapToUint8Array = (image: ImageBitmap) => {
    const canvas = new OffscreenCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const imageUintArray = new Uint8Array(imageData.data.buffer);
    return imageUintArray;
};
