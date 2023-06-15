import { EncryptedEnteFile, EnteFile } from '@/interfaces/file';

export interface TrashItem extends Omit<EncryptedTrashItem, 'file'> {
    file: EnteFile;
}

export interface EncryptedTrashItem {
    file: EncryptedEnteFile;
    isDeleted: boolean;
    isRestored: boolean;
    deleteBy: number;
    createdAt: number;
    updatedAt: number;
}

export type Trash = TrashItem[];
