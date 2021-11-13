export async function getUint8ArrayView(
    reader: FileReader,
    file: Blob
): Promise<Uint8Array> {
    return await new Promise((resolve, reject) => {
        reader.onabort = () => reject(Error('file reading was aborted'));
        reader.onerror = () => reject(Error('file reading has failed'));
        reader.onload = () => {
            // Do whatever you want with the file contents
            const result =
                typeof reader.result === 'string'
                    ? new TextEncoder().encode(reader.result)
                    : new Uint8Array(reader.result);
            resolve(result);
        };
        reader.readAsArrayBuffer(file);
    });
}

export function sanitizeName(name) {
    return name.replaceAll('/', '_').replaceAll(' ', '_');
}
