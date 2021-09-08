import * as HeicConvert from 'heic-convert';

export async function convertHEIC2JPEG(fileBlob: Blob): Promise<Blob> {
    const t1 = Date.now();
    const filedata = new Uint8Array(await fileBlob.arrayBuffer());
    const result = await HeicConvert({ buffer: filedata, format: 'JPEG' });
    const convertedFileData = new Uint8Array(result);
    const convertedFileBlob = new Blob([convertedFileData]);
    console.log(Date.now() - t1);
    return convertedFileBlob;
}
