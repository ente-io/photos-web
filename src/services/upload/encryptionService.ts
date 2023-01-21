import { Remote } from 'comlink';
import { EncryptionResult } from 'types/crypto';
import { DataStream, isDataStream } from 'types/upload';
import { DedicatedCryptoWorker } from 'worker/crypto.worker';

async function encryptFileStream(
    worker: Remote<DedicatedCryptoWorker>,
    fileData: DataStream,
    existingKey?: string
) {
    const { stream, chunkCount } = fileData;
    const fileStreamReader = stream.getReader();
    const { key, decryptionHeader, pushState } =
        await worker.initChunkEncryption(existingKey);
    const ref = { pullCount: 1 };
    const encryptedFileStream = new ReadableStream({
        async pull(controller) {
            const { value } = await fileStreamReader.read();
            const encryptedFileChunk = await worker.encryptFileChunk(
                value,
                pushState,
                ref.pullCount === chunkCount
            );
            controller.enqueue(encryptedFileChunk);
            if (ref.pullCount === chunkCount) {
                controller.close();
            }
            ref.pullCount++;
        },
    });
    return {
        key: key,
        file: {
            decryptionHeader,
            encryptedData: { stream: encryptedFileStream, chunkCount },
        },
    };
}

export async function encryptFiledata(
    worker: Remote<DedicatedCryptoWorker>,
    filedata: Uint8Array | DataStream,
    key?: string
): Promise<EncryptionResult<Uint8Array | DataStream>> {
    return isDataStream(filedata)
        ? await encryptFileStream(worker, filedata, key)
        : await worker.encryptFile(filedata, key);
}
