import { Collection } from './collection';
import { EnteFile } from './file';

export interface ExplorerItem {
    id: number;
    name: string;
    type: 'collection' | 'file';
    creationTime: number;
    size?: number;
    originalItem: EnteFile | Collection;
}
