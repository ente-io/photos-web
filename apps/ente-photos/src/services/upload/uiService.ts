import { Canceler } from 'axios';
import {
    UPLOAD_RESULT,
    RANDOM_PERCENTAGE_PROGRESS_FOR_PUT,
    UPLOAD_STAGES,
} from 'constants/upload';
import {
    FinishedUploads,
    InProgressUpload,
    InProgressUploads,
    ProgressUpdater,
    SegregatedFinishedUploads,
} from 'types/upload/ui';
import { CustomError } from 'utils/error';
import uploadCancelService from './uploadCancelService';

const REQUEST_TIMEOUT_TIME = 30 * 1000; // 30 sec;
class UIService {
    private perFileProgress: number;
    private filesUploaded: number;
    private totalFileCount: number;
    private inProgressUploads: InProgressUploads;
    private finishedUploads: FinishedUploads;
    private progressUpdater: ProgressUpdater;

    init(progressUpdater: ProgressUpdater) {
        this.progressUpdater = progressUpdater;
    }

    reset(count = 0) {
        this.setTotalFileCount(count);
        this.filesUploaded = 0;
        this.inProgressUploads = new Map<number, number>();
        this.finishedUploads = new Map<number, UPLOAD_RESULT>();
        this.updateProgressBarUI();
    }

    setTotalFileCount(count: number) {
        this.totalFileCount = count;
        if (count > 0) {
            this.perFileProgress = 100 / this.totalFileCount;
        } else {
            this.perFileProgress = 0;
        }
    }

    setFileProgress(key: number, progress: number) {
        this.inProgressUploads.set(key, progress);
        this.updateProgressBarUI();
    }

    setUploadStage(stage: UPLOAD_STAGES) {
        this.progressUpdater.setUploadStage(stage);
    }

    setPercentComplete(percent: number) {
        this.progressUpdater.setPercentComplete(percent);
    }

    setFilenames(filenames: Map<number, string>) {
        this.progressUpdater.setUploadFilenames(filenames);
    }

    setHasLivePhoto(hasLivePhoto: boolean) {
        this.progressUpdater.setHasLivePhotos(hasLivePhoto);
    }

    increaseFileUploaded() {
        this.filesUploaded++;
        this.updateProgressBarUI();
    }

    removeFromInProgressList(key: number) {
        this.inProgressUploads.delete(key);
    }

    moveFileToResultList(key: number, uploadResult: UPLOAD_RESULT) {
        this.finishedUploads.set(key, uploadResult);
        this.inProgressUploads.delete(key);
        this.updateProgressBarUI();
    }

    hasFilesInResultList() {
        const finishedUploadsList = segregatedFinishedUploadsToList(
            this.finishedUploads
        );
        for (const x of finishedUploadsList.values()) {
            if (x.length > 0) {
                return true;
            }
        }
        return false;
    }

    private updateProgressBarUI() {
        const {
            setPercentComplete,
            setUploadCounter,
            setInProgressUploads,
            setFinishedUploads,
        } = this.progressUpdater;
        setUploadCounter({
            finished: this.filesUploaded,
            total: this.totalFileCount,
        });
        let percentComplete =
            this.perFileProgress *
            (this.finishedUploads.size || this.filesUploaded);
        if (this.inProgressUploads) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [_, progress] of this.inProgressUploads) {
                // filter  negative indicator values during percentComplete calculation
                if (progress < 0) {
                    continue;
                }
                percentComplete += (this.perFileProgress * progress) / 100;
            }
        }

        setPercentComplete(percentComplete);
        setInProgressUploads(
            convertInProgressUploadsToList(this.inProgressUploads)
        );
        setFinishedUploads(
            segregatedFinishedUploadsToList(this.finishedUploads)
        );
    }

    trackUploadProgress(
        fileLocalID: number,
        percentPerPart = RANDOM_PERCENTAGE_PROGRESS_FOR_PUT(),
        index = 0
    ) {
        const cancel: { exec: Canceler } = { exec: () => {} };
        const cancelTimedOutRequest = () =>
            cancel.exec(CustomError.REQUEST_TIMEOUT);

        const cancelCancelledUploadRequest = () =>
            cancel.exec(CustomError.UPLOAD_CANCELLED);

        let timeout = null;
        const resetTimeout = () => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(cancelTimedOutRequest, REQUEST_TIMEOUT_TIME);
        };
        return {
            cancel,
            onUploadProgress: (event) => {
                this.inProgressUploads.set(
                    fileLocalID,
                    Math.min(
                        Math.round(
                            percentPerPart * index +
                                (percentPerPart * event.loaded) / event.total
                        ),
                        98
                    )
                );
                this.updateProgressBarUI();
                if (event.loaded === event.total) {
                    clearTimeout(timeout);
                } else {
                    resetTimeout();
                }
                if (uploadCancelService.isUploadCancelationRequested()) {
                    cancelCancelledUploadRequest();
                }
            },
        };
    }
}

export default new UIService();

function convertInProgressUploadsToList(inProgressUploads) {
    return [...inProgressUploads.entries()].map(
        ([localFileID, progress]) =>
            ({
                localFileID,
                progress,
            } as InProgressUpload)
    );
}

function segregatedFinishedUploadsToList(finishedUploads: FinishedUploads) {
    const segregatedFinishedUploads = new Map() as SegregatedFinishedUploads;
    for (const [localID, result] of finishedUploads) {
        if (!segregatedFinishedUploads.has(result)) {
            segregatedFinishedUploads.set(result, []);
        }
        segregatedFinishedUploads.get(result).push(localID);
    }
    return segregatedFinishedUploads;
}
