import React, {
    forwardRef,
    Ref,
    useContext,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';

import constants from 'utils/strings/constants';
import UploadProgress from './UploadProgress';

import UploadStrategyChoiceModal, {
    IUploadStrategyChoiceModal,
} from './UploadStrategyChoiceModal';
import { ICollectionNamer } from '../Collections/CollectionNamer';
import { SetCollections, UploadTypeSelectorIntent } from 'types/gallery';
import { GalleryContext } from 'pages/gallery';
import { AppContext } from 'pages/_app';
import uploadManager from 'services/upload/uploadManager';
import ImportService from 'services/importService';
import isElectron from 'is-electron';
import { CustomError } from 'utils/error';
import { SetLoading, SetFiles } from 'types/gallery';
import watchFolderService from 'services/watchFolder/watchFolderService';
import DiscFullIcon from '@mui/icons-material/DiscFull';
import { NotificationAttributes } from 'types/Notification';
import {
    UploadFileNames,
    UploadCounter,
    SegregatedFinishedUploads,
    InProgressUpload,
} from 'types/upload/ui';
import { UPLOAD_STAGES, PICKED_UPLOAD_TYPE } from 'constants/upload';
import UploadTypeSelector, { IUploadTypeSelector } from './UploadTypeSelector';
import billingService from 'services/billingService';
import { addLogLine } from 'utils/logging';
import { PublicCollectionGalleryContext } from 'utils/publicCollectionGallery';
import UserNameInputDialog, {
    IUserNameInputDialog,
} from 'components/UserNameInputDialog';
import useFileInput from 'hooks/useFileInput';
import UploadSelectorInputs from 'components/UploadSelectorInputs';
import UploadController from 'services/upload/uploadController';
import { ICollectionSelector } from 'components/Collections/CollectionSelector';
import uploadController from 'services/upload/uploadController';

interface Props {
    syncWithRemote: (force?: boolean, silent?: boolean) => Promise<void>;
    collectionNamer?: ICollectionNamer;
    setLoading: SetLoading;
    setShouldDisableDropzone: (value: boolean) => void;
    setFiles: SetFiles;
    setCollections?: SetCollections;
    isFirstUpload?: boolean;
    showSessionExpiredMessage: () => void;
    collectionSelector?: ICollectionSelector;
    dragAndDropFiles: File[];
}

export interface IUploader {
    openUploader: (
        intent: UploadTypeSelectorIntent,
        isFirstUpload?: boolean
    ) => void;
}

function Uploader(props: Props, ref: Ref<IUploader>) {
    const appContext = useContext(AppContext);
    const galleryContext = useContext(GalleryContext);
    const publicCollectionGalleryContext = useContext(
        PublicCollectionGalleryContext
    );

    const [uploadProgressView, setUploadProgressView] = useState(false);
    const [uploadStage, setUploadStage] = useState<UPLOAD_STAGES>(
        UPLOAD_STAGES.START
    );
    const [uploadFileNames, setUploadFileNames] = useState<UploadFileNames>();
    const [uploadCounter, setUploadCounter] = useState<UploadCounter>({
        finished: 0,
        total: 0,
    });
    const [inProgressUploads, setInProgressUploads] = useState<
        InProgressUpload[]
    >([]);
    const [finishedUploads, setFinishedUploads] =
        useState<SegregatedFinishedUploads>(new Map());
    const [percentComplete, setPercentComplete] = useState(0);
    const [hasLivePhotos, setHasLivePhotos] = useState(false);

    // This is set when the user choses a type to upload from the upload type selector dialog
    const { open: openFileSelector, getInputProps: getFileSelectorInputProps } =
        useFileInput({
            directory: false,
        });
    const {
        open: openFolderSelector,
        getInputProps: getFolderSelectorInputProps,
    } = useFileInput({
        directory: true,
    });

    const uploadTypeSelectorRef = useRef<IUploadTypeSelector>(null);
    const userNameInputDialogRef = useRef<IUserNameInputDialog>(null);
    const uploadStrategyChoiceModalRef =
        useRef<IUploadStrategyChoiceModal>(null);

    const closeUploadProgress = () => setUploadProgressView(false);

    useImperativeHandle(
        ref,
        () => ({
            openUploader: UploadController.openUploader.bind(UploadController),
        }),
        []
    );

    useEffect(() => {
        UploadController.init(
            uploadTypeSelectorRef.current,
            openFileSelector,
            openFolderSelector,
            appContext.setDialogMessage,
            userNameInputDialogRef.current,
            props.collectionSelector,
            uploadStrategyChoiceModalRef.current,
            props.setCollections,
            setUploadProgressView,
            props.setShouldDisableDropzone,
            props.collectionNamer,
            props.syncWithRemote,
            showUserFacingError,
            props.setLoading
        );
        uploadManager.init(
            {
                setPercentComplete,
                setUploadCounter,
                setInProgressUploads,
                setFinishedUploads,
                setUploadStage,
                setUploadFilenames: setUploadFileNames,
                setHasLivePhotos,
            },
            props.setFiles,
            publicCollectionGalleryContext
        );

        if (isElectron() && ImportService.checkAllElectronAPIsExists()) {
            ImportService.getPendingUploads().then(
                ({ files: electronFiles, collectionName, type }) => {
                    addLogLine(
                        `found pending desktop upload, resuming uploads`
                    );
                    uploadController.resumeDesktopUpload(
                        type,
                        electronFiles,
                        collectionName
                    );
                }
            );
            watchFolderService.init(
                props.syncWithRemote,
                appContext.setIsFolderSyncRunning
            );
        }
    }, [
        publicCollectionGalleryContext.accessedThroughSharedURL,
        publicCollectionGalleryContext.token,
        publicCollectionGalleryContext.passwordToken,
    ]);

    // this handles the change of selectorFiles changes on web when user selects
    // files for upload through the opened file/folder selector or dragAndDrop them
    //  the webFiles state is update which triggers the upload of those files
    useEffect(() => {
        if (appContext.watchFolderView) {
            // if watch folder dialog is open don't catch the dropped file
            // as they are folder being dropped for watching
            return;
        }
        if (props.dragAndDropFiles?.length > 0) {
            addLogLine(`received drag and drop upload request`);
            UploadController.preprocessAndUploadFiles(
                props.dragAndDropFiles,
                PICKED_UPLOAD_TYPE.FILES
            );
        }
        if (appContext.sharedFiles?.length > 0) {
            addLogLine(`received shared files upload request`);
            UploadController.preprocessAndUploadFiles(
                appContext.sharedFiles,
                PICKED_UPLOAD_TYPE.FILES
            );
        }
    }, [props.dragAndDropFiles, appContext.sharedFiles]);

    function showUserFacingError(err: string) {
        let notification: NotificationAttributes;
        switch (err) {
            case CustomError.SESSION_EXPIRED:
                return props.showSessionExpiredMessage();
            case CustomError.SUBSCRIPTION_EXPIRED:
                notification = {
                    variant: 'danger',
                    subtext: constants.SUBSCRIPTION_EXPIRED,
                    message: constants.RENEW_NOW,
                    onClick: () => billingService.redirectToCustomerPortal(),
                };
                break;
            case CustomError.STORAGE_QUOTA_EXCEEDED:
                notification = {
                    variant: 'danger',
                    subtext: constants.STORAGE_QUOTA_EXCEEDED,
                    message: constants.UPGRADE_NOW,
                    onClick: () => galleryContext.showPlanSelectorModal(),
                    startIcon: <DiscFullIcon />,
                };
                break;
            default:
                notification = {
                    variant: 'danger',
                    message: constants.UNKNOWN_ERROR,
                    onClick: () => null,
                };
        }
        appContext.setNotificationAttributes(notification);
    }

    return (
        <>
            <UploadSelectorInputs
                getFileSelectorInputProps={getFileSelectorInputProps}
                getFolderSelectorInputProps={getFolderSelectorInputProps}
            />
            <UploadStrategyChoiceModal ref={uploadStrategyChoiceModalRef} />
            <UploadTypeSelector ref={uploadTypeSelectorRef} />
            <UploadProgress
                open={uploadProgressView}
                onClose={closeUploadProgress}
                percentComplete={percentComplete}
                uploadFileNames={uploadFileNames}
                uploadCounter={uploadCounter}
                uploadStage={uploadStage}
                inProgressUploads={inProgressUploads}
                hasLivePhotos={hasLivePhotos}
                retryFailed={uploadController.retryFailed.bind(
                    uploadController
                )}
                finishedUploads={finishedUploads}
                cancelUploads={uploadController.cancelUploads.bind(
                    uploadController
                )}
            />
            <UserNameInputDialog ref={userNameInputDialogRef} />
        </>
    );
}

export default forwardRef(Uploader);
