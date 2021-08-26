import EXIF from 'exif-js';

import { logError } from 'utils/sentry';
import { NULL_LOCATION, Location } from './metadataService';
import { getUint8ArrayView } from './readFileService';

const SOUTH_DIRECTION = 'S';
const WEST_DIRECTION = 'W';
const CHUNK_SIZE_FOR_EXIF_READING = 4 * 1024 * 1024;
interface ParsedEXIFData {
    location: Location;
    creationTime: number;
}

export async function getExifData(
    reader: FileReader,
    receivedFile: globalThis.File
): Promise<ParsedEXIFData> {
    try {
        const fileChunk = await getUint8ArrayView(
            reader,
            receivedFile.slice(0, CHUNK_SIZE_FOR_EXIF_READING)
        );
        const exifData = EXIF.readFromBinaryFile(fileChunk.buffer);
        if (!exifData) {
            return { location: NULL_LOCATION, creationTime: null };
        }
        return {
            location: getEXIFLocation(exifData),
            creationTime: getUNIXTime(exifData),
        };
    } catch (e) {
        logError(e, 'error reading exif data');
        // ignore exif parsing errors
    }
}

function getUNIXTime(exifData: any) {
    const dateString: string = exifData.DateTimeOriginal || exifData.DateTime;
    if (!dateString || dateString === '0000:00:00 00:00:00') {
        return null;
    }
    const parts = dateString.split(' ')[0].split(':');
    const date = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );
    return date.getTime() * 1000;
}

function getEXIFLocation(exifData): Location {
    if (!exifData.GPSLatitude) {
        return NULL_LOCATION;
    }

    const latDegree = exifData.GPSLatitude[0];
    const latMinute = exifData.GPSLatitude[1];
    const latSecond = exifData.GPSLatitude[2];

    const lonDegree = exifData.GPSLongitude[0];
    const lonMinute = exifData.GPSLongitude[1];
    const lonSecond = exifData.GPSLongitude[2];

    const latDirection = exifData.GPSLatitudeRef;
    const lonDirection = exifData.GPSLongitudeRef;

    const latFinal = convertDMSToDD(
        latDegree,
        latMinute,
        latSecond,
        latDirection
    );

    const lonFinal = convertDMSToDD(
        lonDegree,
        lonMinute,
        lonSecond,
        lonDirection
    );
    return { latitude: latFinal * 1.0, longitude: lonFinal * 1.0 };
}

function convertDMSToDD(degrees, minutes, seconds, direction) {
    let dd = degrees + minutes / 60 + seconds / 3600;

    if (direction === SOUTH_DIRECTION || direction === WEST_DIRECTION) {
        dd = dd * -1;
    }

    return dd;
}
