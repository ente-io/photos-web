import { PICKED_UPLOAD_TYPE } from 'constants/upload';
// import { Collection } from 'types/collection';
import { ElectronAPIs } from 'types/electron';
import { ElectronFile } from 'types/upload';
import { runningInBrowser } from 'utils/common';
import { logError } from 'utils/sentry';

interface PendingUploads {
    files: ElectronFile[];
    collectionName: string;
    type: PICKED_UPLOAD_TYPE;
}

interface selectZipResult {
    files: ElectronFile[];
    zipPaths: string[];
}
class ImportService {
    electronAPIs: ElectronAPIs;
    private allElectronAPIsExist: boolean = false;

    constructor() {
        this.electronAPIs = runningInBrowser() && window['ElectronAPIs'];
        this.allElectronAPIsExist = !!this.electronAPIs?.getPendingUploads;
    }

    async getElectronFilesFromGoogleZip(
        zipPath: string
    ): Promise<ElectronFile[]> {
        if (this.allElectronAPIsExist) {
            return this.electronAPIs.getElectronFilesFromGoogleZip(zipPath);
        }
    }

    checkAllElectronAPIsExists = () => this.allElectronAPIsExist;

    async showUploadFilesDialog(): Promise<ElectronFile[]> {
        if (this.allElectronAPIsExist) {
            return this.electronAPIs.showUploadFilesDialog();
        }
    }

    async showUploadDirsDialog(): Promise<ElectronFile[]> {
        if (this.allElectronAPIsExist) {
            return this.electronAPIs.showUploadDirsDialog();
        }
    }

    async showUploadZipDialog(): Promise<selectZipResult> {
        if (this.allElectronAPIsExist) {
            return this.electronAPIs.showUploadZipDialog();
        }
    }
    async getPendingUploads(): Promise<PendingUploads> {
        try {
            if (this.allElectronAPIsExist) {
                const pendingUploads =
                    (await this.electronAPIs.getPendingUploads()) as PendingUploads;
                return pendingUploads;
            }
        } catch (e) {
            if (e?.message?.includes('ENOENT: no such file or directory')) {
                // ignore
            } else {
                logError(e, 'failed to getPendingUploads ');
            }
            return { files: [], collectionName: null, type: null };
        }
    }

    async setToUploadCollection(collectionName: string) {
        if (this.allElectronAPIsExist) {
            this.electronAPIs.setToUploadCollection(collectionName);
        }
    }

    async setToUploadFiles(
        type: PICKED_UPLOAD_TYPE.FILES | PICKED_UPLOAD_TYPE.ZIPS,
        filePaths: string[]
    ) {
        if (this.allElectronAPIsExist) {
            this.electronAPIs.setToUploadFiles(type, filePaths);
        }
    }

    // updatePendingUploads(files: FileWithCollection[]) {
    //     if (this.allElectronAPIsExist) {
    //         const filePaths = [];
    //         for (const { uploadAsset } of files) {
    //             if (uploadAsset.isLivePhoto) {
    //                 filePaths.push(
    //                     (uploadAsset.livePhotoAssets.image as ElectronFile)
    //                         .path,
    //                     (uploadAsset.livePhotoAssets.video as ElectronFile).path
    //                 );
    //             } else {
    //                 filePaths.push((uploadAsset.file as ElectronFile).path);
    //             }
    //         }
    //         this.setToUploadFiles(PICKED_UPLOAD_TYPE.FILES, filePaths);
    //     }
    // }
    cancelRemainingUploads() {
        if (this.allElectronAPIsExist) {
            this.electronAPIs.setToUploadCollection(null);
            this.electronAPIs.setToUploadFiles(PICKED_UPLOAD_TYPE.ZIPS, []);
            this.electronAPIs.setToUploadFiles(PICKED_UPLOAD_TYPE.FILES, []);
        }
    }
}

export default new ImportService();
