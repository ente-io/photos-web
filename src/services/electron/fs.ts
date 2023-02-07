import { ElectronAPIs } from 'types/electron';
import { runningInBrowser } from 'utils/common';
import { logError } from 'utils/sentry';

class ElectronFSService {
    private electronAPIs: ElectronAPIs;

    constructor() {
        this.electronAPIs = runningInBrowser() && window['ElectronAPIs'];
    }

    getDirFiles(dirPath: string) {
        if (this.electronAPIs.getDirFiles) {
            return this.electronAPIs.getDirFiles(dirPath);
        }
    }

    async isFolder(folderPath: string) {
        try {
            return await this.electronAPIs.isFolder(folderPath);
        } catch (e) {
            logError(e, 'error while checking if is Folder');
            throw e;
        }
    }
}

export default new ElectronFSService();
