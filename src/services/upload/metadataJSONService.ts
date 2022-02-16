import { NULL_LOCATION } from 'constants/upload';
import { FileWithCollection, ParsedMetadataJSON } from 'types/upload';
import { logError } from 'utils/sentry';
import { Location } from 'types/upload';

const TYPE_JSON = 'json';

const NULL_PARSED_METADATA_JSON: ParsedMetadataJSON = {
    creationTime: null,
    modificationTime: null,
    ...NULL_LOCATION,
};

interface ParsedMetadataJSONWithTitle {
    title: string;
    parsedMetadataJSON: ParsedMetadataJSON;
}

export function segregateMetadataAndMediaFiles(
    filesWithCollectionToUpload: FileWithCollection[]
) {
    const metadataJSONFiles: FileWithCollection[] = [];
    const mediaFiles: FileWithCollection[] = [];
    filesWithCollectionToUpload.forEach((fileWithCollection) => {
        const file = fileWithCollection.file;
        if (file.name.startsWith('.')) {
            // ignore files with name starting with . (hidden files)
            return;
        }
        if (file.name.toLowerCase().endsWith(TYPE_JSON)) {
            metadataJSONFiles.push(fileWithCollection);
        } else {
            mediaFiles.push(fileWithCollection);
        }
    });
    return { mediaFiles, metadataJSONFiles };
}

export async function parseMetadataJSONFiles(
    metadataJSONFiles: FileWithCollection[],
    increaseFileUploaded: () => void
) {
    try {
        const reader = new FileReader();
        for (const { file, collectionID } of metadataJSONFiles) {
            const parsedMetadataJSONWithTitle = await parseMetadataJSON(
                reader,
                file
            );
            if (parsedMetadataJSONWithTitle) {
                const { title, parsedMetadataJSON } =
                    parsedMetadataJSONWithTitle;
                this.parsedMetadataJSONMap.set(
                    getMetadataJSONMapKey(collectionID, title),
                    parsedMetadataJSON && { ...parsedMetadataJSON }
                );
                increaseFileUploaded();
            }
        }
    } catch (e) {
        logError(e, 'error seeding MetadataMap');
        // silently ignore the error
    }
}

export async function parseMetadataJSON(
    reader: FileReader,
    receivedFile: File
) {
    try {
        const metadataJSON: object = await new Promise((resolve, reject) => {
            reader.onabort = () => reject(Error('file reading was aborted'));
            reader.onerror = () => reject(Error('file reading has failed'));
            reader.onload = () => {
                const result =
                    typeof reader.result !== 'string'
                        ? new TextDecoder().decode(reader.result)
                        : reader.result;
                resolve(JSON.parse(result));
            };
            reader.readAsText(receivedFile);
        });

        const parsedMetadataJSON: ParsedMetadataJSON =
            NULL_PARSED_METADATA_JSON;
        if (!metadataJSON || !metadataJSON['title']) {
            return;
        }

        const title = metadataJSON['title'];
        if (
            metadataJSON['photoTakenTime'] &&
            metadataJSON['photoTakenTime']['timestamp']
        ) {
            parsedMetadataJSON.creationTime =
                metadataJSON['photoTakenTime']['timestamp'] * 1000000;
        } else if (
            metadataJSON['creationTime'] &&
            metadataJSON['creationTime']['timestamp']
        ) {
            parsedMetadataJSON.creationTime =
                metadataJSON['creationTime']['timestamp'] * 1000000;
        }
        if (
            metadataJSON['modificationTime'] &&
            metadataJSON['modificationTime']['timestamp']
        ) {
            parsedMetadataJSON.modificationTime =
                metadataJSON['modificationTime']['timestamp'] * 1000000;
        }
        let locationData: Location = NULL_LOCATION;
        if (
            metadataJSON['geoData'] &&
            (metadataJSON['geoData']['latitude'] !== 0.0 ||
                metadataJSON['geoData']['longitude'] !== 0.0)
        ) {
            locationData = metadataJSON['geoData'];
        } else if (
            metadataJSON['geoDataExif'] &&
            (metadataJSON['geoDataExif']['latitude'] !== 0.0 ||
                metadataJSON['geoDataExif']['longitude'] !== 0.0)
        ) {
            locationData = metadataJSON['geoDataExif'];
        }
        if (locationData !== null) {
            parsedMetadataJSON.latitude = locationData.latitude;
            parsedMetadataJSON.longitude = locationData.longitude;
        }
        return { title, parsedMetadataJSON } as ParsedMetadataJSONWithTitle;
    } catch (e) {
        logError(e, 'parseMetadataJSON failed');
        // ignore
    }
}

export const getMetadataJSONMapKey = (
    collectionID: number,

    title: string
) => `${collectionID}-${title}`;
