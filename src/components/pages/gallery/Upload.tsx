import React, { useContext, useEffect, useState } from 'react';

import { syncCollections, createAlbum } from 'services/collectionService';
import constants from 'utils/strings/constants';
import { SetDialogMessage } from 'components/MessageDialog';
import UploadProgress from './UploadProgress';

import ChoiceModal from './ChoiceModal';
import { SetCollectionNamerAttributes } from './CollectionNamer';
import { SetCollectionSelectorAttributes } from './CollectionSelector';
import { GalleryContext } from 'pages/gallery';
import { AppContext } from 'pages/_app';
import { logError } from 'utils/sentry';
import { FileRejection } from 'react-dropzone';
import UploadManager from 'services/upload/uploadManager';
import uploadManager from 'services/upload/uploadManager';
import { METADATA_FOLDER_NAME } from 'constants/export';
import { getUserFacingErrorMessage } from 'utils/error';
import { Collection } from 'types/collection';
import { SetLoading, SetFiles } from 'types/gallery';
import { UPLOAD_STAGES } from 'constants/upload';
import { FileWithCollection } from 'types/upload';

const FIRST_ALBUM_NAME = 'My First Album';

interface Props {
    syncWithRemote: (force?: boolean, silent?: boolean) => Promise<void>;
    setBannerMessage: (message: string | JSX.Element) => void;
    acceptedFiles: File[];
    closeCollectionSelector: () => void;
    setCollectionSelectorAttributes: SetCollectionSelectorAttributes;
    setCollectionNamerAttributes: SetCollectionNamerAttributes;
    setLoading: SetLoading;
    setDialogMessage: SetDialogMessage;
    setUploadInProgress: any;
    showCollectionSelector: () => void;
    fileRejections: FileRejection[];
    setFiles: SetFiles;
    isFirstUpload: boolean;
}

enum UPLOAD_STRATEGY {
    SINGLE_COLLECTION,
    COLLECTION_PER_FOLDER,
}

interface AnalysisResult {
    suggestedCollectionName: string;
    multipleFolders: boolean;
}

export default function Upload(props: Props) {
    const [progressView, setProgressView] = useState(false);
    const [uploadStage, setUploadStage] = useState<UPLOAD_STAGES>(
        UPLOAD_STAGES.START
    );
    const [fileCounter, setFileCounter] = useState({ finished: 0, total: 0 });
    const [fileProgress, setFileProgress] = useState(new Map<string, number>());
    const [uploadResult, setUploadResult] = useState(new Map<string, number>());
    const [percentComplete, setPercentComplete] = useState(0);
    const [choiceModalView, setChoiceModalView] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult>({
        suggestedCollectionName: '',
        multipleFolders: false,
    });
    const appContext = useContext(AppContext);
    const galleryContext = useContext(GalleryContext);

    useEffect(() => {
        UploadManager.initUploader(
            {
                setPercentComplete,
                setFileCounter,
                setFileProgress,
                setUploadResult,
                setUploadStage,
            },
            props.setFiles
        );
    }, []);

    useEffect(() => {
        if (
            props.acceptedFiles?.length > 0 ||
            appContext.sharedFiles?.length > 0
        ) {
            props.setLoading(true);

            let analysisResult: AnalysisResult;
            if (props.acceptedFiles?.length > 0) {
                // File selection by drag and drop or selection of file.
                analysisResult = analyseUploadFiles();
                if (analysisResult) {
                    setAnalysisResult(analysisResult);
                }
            } else {
                props.acceptedFiles = appContext.sharedFiles;
            }
            handleCollectionCreationAndUpload(
                analysisResult,
                props.isFirstUpload
            );
            props.setLoading(false);
        }
    }, [props.acceptedFiles, appContext.sharedFiles]);

    const uploadInit = function () {
        setUploadStage(UPLOAD_STAGES.START);
        setFileCounter({ finished: 0, total: 0 });
        setFileProgress(new Map<string, number>());
        setUploadResult(new Map<string, number>());
        setPercentComplete(0);
        props.closeCollectionSelector();
        setProgressView(true);
    };

    function analyseUploadFiles(): AnalysisResult {
        if (props.acceptedFiles.length === 0) {
            return null;
        }
        const paths: string[] = props.acceptedFiles.map((file) => file['path']);
        const getCharCount = (str: string) => (str.match(/\//g) ?? []).length;
        paths.sort((path1, path2) => getCharCount(path1) - getCharCount(path2));
        const firstPath = paths[0];
        const lastPath = paths[paths.length - 1];
        const L = firstPath.length;
        let i = 0;
        const firstFileFolder = firstPath.substr(0, firstPath.lastIndexOf('/'));
        const lastFileFolder = lastPath.substr(0, lastPath.lastIndexOf('/'));
        while (i < L && firstPath.charAt(i) === lastPath.charAt(i)) i++;
        let commonPathPrefix = firstPath.substring(0, i);
        if (commonPathPrefix) {
            commonPathPrefix = commonPathPrefix.substr(
                1,
                commonPathPrefix.lastIndexOf('/') - 1
            );
            if (commonPathPrefix) {
                commonPathPrefix = commonPathPrefix.substr(
                    commonPathPrefix.lastIndexOf('/') + 1
                );
            }
        }
        return {
            suggestedCollectionName: commonPathPrefix,
            multipleFolders: firstFileFolder !== lastFileFolder,
        };
    }
    function getCollectionWiseFiles() {
        const collectionWiseFiles = new Map<string, File[]>();
        for (const file of props.acceptedFiles) {
            const filePath = file['path'] as string;

            let folderPath = filePath.substr(0, filePath.lastIndexOf('/'));
            if (folderPath.endsWith(METADATA_FOLDER_NAME)) {
                folderPath = folderPath.substr(0, folderPath.lastIndexOf('/'));
            }
            const folderName = folderPath.substr(
                folderPath.lastIndexOf('/') + 1
            );
            if (!collectionWiseFiles.has(folderName)) {
                collectionWiseFiles.set(folderName, []);
            }
            collectionWiseFiles.get(folderName).push(file);
        }
        return collectionWiseFiles;
    }

    const uploadFilesToExistingCollection = async (collection) => {
        try {
            uploadInit();
            const filesWithCollectionToUpload: FileWithCollection[] =
                props.acceptedFiles.map((file) => ({
                    file,
                    collectionID: collection.id,
                }));
            await uploadFiles(filesWithCollectionToUpload);
        } catch (e) {
            logError(e, 'Failed to upload files to existing collections');
        }
    };

    const uploadFilesToNewCollections = async (
        strategy: UPLOAD_STRATEGY,
        collectionName?: string
    ) => {
        try {
            uploadInit();

            const filesWithCollectionToUpload: FileWithCollection[] = [];
            const collections: Collection[] = [];
            let collectionWiseFiles = new Map<string, File[]>();
            if (strategy === UPLOAD_STRATEGY.SINGLE_COLLECTION) {
                collectionWiseFiles.set(collectionName, props.acceptedFiles);
            } else {
                collectionWiseFiles = getCollectionWiseFiles();
            }
            try {
                const existingCollection = await syncCollections();
                for (const [collectionName, files] of collectionWiseFiles) {
                    const collection = await createAlbum(
                        collectionName,
                        existingCollection
                    );
                    collections.push(collection);
                    for (const file of files) {
                        filesWithCollectionToUpload.push({
                            collectionID: collection.id,
                            file,
                        });
                    }
                }
            } catch (e) {
                setProgressView(false);
                logError(e, 'Failed to create album');
                props.setDialogMessage({
                    title: constants.ERROR,
                    staticBackdrop: true,
                    close: { variant: 'danger' },
                    content: constants.CREATE_ALBUM_FAILED,
                });
                throw e;
            }
            await uploadFiles(filesWithCollectionToUpload, collections);
        } catch (e) {
            logError(e, 'Failed to upload files to new collections');
        }
    };

    const uploadFiles = async (
        filesWithCollectionToUpload: FileWithCollection[],
        collections?: Collection[]
    ) => {
        try {
            props.setUploadInProgress(true);
            props.closeCollectionSelector();
            await props.syncWithRemote(true, true);
            await uploadManager.queueFilesForUpload(
                filesWithCollectionToUpload,
                collections
            );
        } catch (err) {
            const message = getUserFacingErrorMessage(
                err.message,
                galleryContext.showPlanSelectorModal
            );
            props.setBannerMessage(message);
            setProgressView(false);
            throw err;
        } finally {
            appContext.resetSharedFiles();
            props.setUploadInProgress(false);
            props.syncWithRemote();
        }
    };
    const retryFailed = async () => {
        try {
            props.setUploadInProgress(true);
            uploadInit();
            await props.syncWithRemote(true, true);
            await uploadManager.retryFailedFiles();
        } catch (err) {
            const message = getUserFacingErrorMessage(
                err.message,
                galleryContext.showPlanSelectorModal
            );
            appContext.resetSharedFiles();
            props.setBannerMessage(message);
            setProgressView(false);
        } finally {
            props.setUploadInProgress(false);
            props.syncWithRemote();
        }
    };

    const uploadToSingleNewCollection = (collectionName: string) => {
        if (collectionName) {
            uploadFilesToNewCollections(
                UPLOAD_STRATEGY.SINGLE_COLLECTION,
                collectionName
            );
        } else {
            showCollectionCreateModal(analysisResult);
        }
    };
    const showCollectionCreateModal = (analysisResult: AnalysisResult) => {
        props.setCollectionNamerAttributes({
            title: constants.CREATE_COLLECTION,
            buttonText: constants.CREATE,
            autoFilledName: analysisResult?.suggestedCollectionName,
            callback: uploadToSingleNewCollection,
        });
    };

    const handleCollectionCreationAndUpload = (
        analysisResult: AnalysisResult,
        isFirstUpload: boolean
    ) => {
        if (isFirstUpload) {
            uploadToSingleNewCollection(FIRST_ALBUM_NAME);
        } else {
            let showNextModal = () => {};
            if (analysisResult.multipleFolders) {
                showNextModal = () => setChoiceModalView(true);
            } else {
                showNextModal = () =>
                    uploadToSingleNewCollection(
                        analysisResult.suggestedCollectionName
                    );
            }
            props.setCollectionSelectorAttributes({
                callback: uploadFilesToExistingCollection,
                showNextModal,
                title: constants.UPLOAD_TO_COLLECTION,
            });
        }
    };

    return (
        <>
            <ChoiceModal
                show={choiceModalView}
                onHide={() => setChoiceModalView(false)}
                uploadToSingleCollection={() =>
                    uploadToSingleNewCollection(
                        analysisResult.suggestedCollectionName
                    )
                }
                uploadToMultipleCollection={() =>
                    uploadFilesToNewCollections(
                        UPLOAD_STRATEGY.COLLECTION_PER_FOLDER
                    )
                }
            />
            <UploadProgress
                now={percentComplete}
                fileCounter={fileCounter}
                uploadStage={uploadStage}
                fileProgress={fileProgress}
                show={progressView}
                closeModal={() => setProgressView(false)}
                retryFailed={retryFailed}
                fileRejections={props.fileRejections}
                uploadResult={uploadResult}
            />
        </>
    );
}
