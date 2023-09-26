import {
    ClipService,
    Versioned,
    ClipMethod,
    ClipImageEmbeddingExtractionResult,
} from 'types/machineLearning';

class ClipVit32Service implements ClipService {
    public method: Versioned<ClipMethod>;

    public constructor() {
        this.method = {
            value: 'ClipVit32',
            version: 1,
        };
    }

    private async initImageModel() {
        throw Error('Not implemented yet');
    }

    private async getClipVit32ImageModel() {
        throw Error('Not implemented yet');
    }

    public async computeImageEmbeddings(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        image: ImageBitmap
    ): Promise<ClipImageEmbeddingExtractionResult> {
        //
        throw Error('Not implemented yet');
    }
}

export default new ClipVit32Service();
