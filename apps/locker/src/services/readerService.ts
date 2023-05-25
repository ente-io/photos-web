import { convertBytesToHumanReadable } from '@/utils/file/size';
import { logError } from '@/utils/sentry';

export async function getUint8ArrayView(file: Blob): Promise<Uint8Array> {
    try {
        return new Uint8Array(await file.arrayBuffer());
    } catch (e) {
        logError(e, 'reading file blob failed', {
            fileSize: convertBytesToHumanReadable(file.size),
        });
        throw e;
    }
}
