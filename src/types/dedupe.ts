import { EnteFile } from './file';

export interface DuplicatesResponse {
    duplicates: Array<{
        fileIDs: number[];
        size: number;
    }>;
}

export interface DuplicateFiles {
    files: EnteFile[];
    size: number;
}
