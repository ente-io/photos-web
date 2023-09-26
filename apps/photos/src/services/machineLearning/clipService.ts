import { MLSyncContext, MLSyncFileContext } from 'types/machineLearning';
import { isDifferentOrOld } from 'utils/machineLearning';
import ReaderService from './readerService';
import { addLogLine } from 'utils/logging';

class ClipService {
    async syncFileClipImageEmbeddings(
        syncContext: MLSyncContext,
        fileContext: MLSyncFileContext
    ) {
        const startTime = Date.now();
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
        const clipImageEmbeddingExtractionResult =
            await syncContext.clipService.computeImageEmbeddings(imageBitmap);

        newMlFile.ClipImageEmbedding = {
            ...clipImageEmbeddingExtractionResult,
            fileId: fileContext.enteFile.id,
        };
        const endTime = Date.now();
        addLogLine(
            `Clip computeImageEmbeddings time taken ${
                fileContext.enteFile.id
            }: ${endTime - startTime}ms`
        );
    }
}

export default new ClipService();
