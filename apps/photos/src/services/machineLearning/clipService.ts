import { MLSyncContext, MLSyncFileContext } from 'types/machineLearning';
import { isDifferentOrOld } from 'utils/machineLearning';
import ReaderService from './readerService';
import { addLogLine } from 'utils/logging';
import mlIDbStorage from 'utils/storage/mlIDbStorage';

class ClipService {
    async syncFileClipImageEmbedding(
        syncContext: MLSyncContext,
        fileContext: MLSyncFileContext
    ) {
        const { oldMlFile, newMlFile } = fileContext;
        if (
            !isDifferentOrOld(
                oldMlFile?.clipMethod,
                syncContext.clipService.method
            ) &&
            oldMlFile?.imageSource === syncContext.config.imageSource
        ) {
            newMlFile.ClipImageEmbedding = oldMlFile?.ClipImageEmbedding;
            newMlFile.clipMethod = oldMlFile.clipMethod;
            newMlFile.imageDimensions = oldMlFile.imageDimensions;
            newMlFile.imageSource = oldMlFile.imageSource;
            return;
        }
        newMlFile.clipMethod = syncContext.clipService.method;
        fileContext.newDetection = true;
        const imageBitmap = await ReaderService.getImageBitmap(
            syncContext,
            fileContext
        );
        const startTime = Date.now();

        const embedding = await syncContext.clipService.computeImageEmbedding(
            imageBitmap
        );

        newMlFile.ClipImageEmbedding = {
            embedding,
            fileId: fileContext.enteFile.id,
        };
        const endTime = Date.now();
        addLogLine(
            `Clip computeImageEmbeddings time taken ${
                fileContext.enteFile.id
            }: ${endTime - startTime}ms`
        );
    }

    async generateTextEmbedding(syncContext: MLSyncContext, text: string) {
        const startTime = Date.now();
        const embedding = await syncContext.clipService.computeTextEmbedding(
            text
        );
        const endTime = Date.now();
        addLogLine(
            `Clip computeTextEmbeddings time taken ${text}: ${
                endTime - startTime
            }ms`
        );
        return embedding;
    }

    async getAllImageEmbeddings() {
        return await mlIDbStorage.getAllClipImageEmbeddings();
    }

    async computeScore(
        imageEmbedding: Float32Array,
        textEmbedding: Float32Array
    ) {
        if (imageEmbedding.length !== textEmbedding.length) {
            throw Error('imageEmbedding and textEmbedding length mismatch');
        }
        let score = 0;
        let imageNormalization = 0;
        let textNormalization = 0;

        for (let index = 0; index < imageEmbedding.length; index++) {
            imageNormalization += imageEmbedding[index] * imageEmbedding[index];
            textNormalization += textEmbedding[index] * textEmbedding[index];
        }
        for (let index = 0; index < imageEmbedding.length; index++) {
            imageEmbedding[index] =
                imageEmbedding[index] / Math.sqrt(imageNormalization);
            textEmbedding[index] =
                textEmbedding[index] / Math.sqrt(textNormalization);
        }
        for (let index = 0; index < imageEmbedding.length; index++) {
            score += imageEmbedding[index] * textEmbedding[index];
        }
        return score;
    }
}

export default new ClipService();
