import { UPLOAD_STAGES } from '@/constants/upload';
import {
    UploadCounter,
    InProgressUpload,
    SegregatedFinishedUploads,
    UploadFileNames,
} from '@/interfaces/upload/ui';
import uploadManager from '@/services/uploadManager';
import { Box, IconButton, Typography } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import { createContext } from 'react';
import UploaderFile from './UploaderFile';
import { FileWithCollection } from '@/interfaces/upload';
import { LockerDashboardContext, LockerUploaderContext } from '@/pages/locker';
import { addLogLine } from '@/utils/logging';
import MinimizeIcon from '@mui/icons-material/Minimize';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { t } from 'i18next';
import CancelUploadsDialog from './CancelUploadsDialog';
import uploadCancelService from '@/services/upload/uploadCancelService';

export const UploaderContext = createContext(
    {} as {
        inProgressUploads: InProgressUpload[];
        finishedUploads: SegregatedFinishedUploads;
        uploadStage: UPLOAD_STAGES;
    }
);

// interface IProps {
//     filesToUpload: File[];
// }

const UploaderBoxComponent = () =>
    // props: IProps
    {
        const { filesToUpload } = useContext(LockerUploaderContext);

        const localIDCounter = useRef(0);

        const [percentComplete, setPercentComplete] = useState(0);
        const [uploadCounter, setUploadCounter] = useState({} as UploadCounter);
        const [inProgressUploads, setInProgressUploads] = useState<
            InProgressUpload[]
        >([]);
        const [finishedUploads, setFinishedUploads] = useState(
            {} as SegregatedFinishedUploads
        );
        const [uploadStage, setUploadStage] = useState<UPLOAD_STAGES>(
            UPLOAD_STAGES.START
        );
        const [uploadFileNames, setUploadFileNames] = useState(
            {} as UploadFileNames
        );
        const [hasLivePhotos, setHasLivePhotos] = useState(false);

        const [uploadingFiles, setUploadingFiles] = useState<
            FileWithCollection[]
        >([]);

        const [showUploadingFiles, setShowUploadingFiles] = useState(true);

        const { syncFiles, setShowUploaderBoxComponent } = useContext(
            LockerDashboardContext
        );

        const [
            showCancelInProgressUploadsDialog,
            setShowCancelInProgressUploadsDialog,
        ] = useState(false);

        const initUploadManager = () => {
            // Initialize the upload manager
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
                () => {},
                {
                    token: null,
                    passwordToken: null,
                    accessedThroughSharedURL: false,
                    // photoListHeader: null,
                    // photoListFooter: null,
                }
            );
        };

        useEffect(() => {
            initUploadManager();
        }, []);

        useEffect(() => {
            if (uploadStage === UPLOAD_STAGES.FINISH) {
                syncFiles();
            }
        }, [uploadStage]);

        const { currentCollection } = useContext(LockerDashboardContext);

        const handleFileUpload = async () => {
            if (!currentCollection) {
                addLogLine('No collection selected');
                return;
            }

            const fileWithCollections: FileWithCollection[] = [];

            for (const file of filesToUpload) {
                const localID = localIDCounter.current++;

                // Add files to be uploaded
                const fileWithCollection: FileWithCollection = {
                    file,
                    collection: currentCollection,
                    localID,
                    collectionID: currentCollection.id,
                };
                fileWithCollections.push(fileWithCollection);
            }

            setUploadingFiles(fileWithCollections);

            uploadManager.prepareForNewUpload();
            await uploadManager.queueFilesForUpload(fileWithCollections, [
                currentCollection,
            ]);
        };

        useEffect(() => {
            if (!filesToUpload) return;
            addLogLine(`Files selected`);
            handleFileUpload();
        }, [filesToUpload]);

        return (
            <>
                <UploaderContext.Provider
                    value={{
                        inProgressUploads,
                        finishedUploads,
                        uploadStage,
                    }}>
                    <Box
                        sx={{
                            width: '40rem',
                            position: 'fixed',
                            zIndex: 100,
                            bottom: '1rem',
                            right: '1rem',
                            borderRadius: '10px',
                            backgroundColor: '#141414',
                            boxShadow: '0px 0px 10px 0px rgba(0,0,0,0.75)',
                            '@media only screen and (max-width: 800px)': {
                                width: '90%',
                            },
                        }}>
                        <Box
                            width="100%"
                            bgcolor="#423e3e"
                            height="fit-content"
                            sx={{
                                borderTopRightRadius: '10px',
                                borderTopLeftRadius: '10px',
                            }}
                            padding=".5rem"
                            boxSizing="border-box"
                            display="flex"
                            justifyContent="flex-end"
                            alignItems="center">
                            <Box display="flex" gap=".5rem">
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setShowUploadingFiles(
                                            !showUploadingFiles
                                        );
                                    }}>
                                    {showUploadingFiles ? (
                                        <MinimizeIcon />
                                    ) : (
                                        <OpenInFullIcon />
                                    )}
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        if (
                                            ![
                                                UPLOAD_STAGES.FINISH,
                                                UPLOAD_STAGES.START,
                                            ].includes(uploadStage)
                                        ) {
                                            setShowCancelInProgressUploadsDialog(
                                                true
                                            );
                                            return;
                                        }
                                        setShowUploaderBoxComponent(false);
                                    }}>
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        </Box>
                        <Box
                            display={showUploadingFiles ? 'flex' : 'none'}
                            flexDirection="column"
                            gap="0.5rem"
                            paddingTop="0.5rem"
                            paddingBottom="0.5rem"
                            maxHeight="20vh"
                            sx={{
                                overflowY: 'auto',
                            }}>
                            {uploadingFiles.map((file, index) => (
                                <UploaderFile
                                    key={index}
                                    localID={file.localID}
                                    file={file.file}
                                />
                            ))}
                            {uploadingFiles.length < 1 && (
                                <Typography textAlign="center" margin="1rem">
                                    {t('NO_FILES_SELECTED_FOR_UPLOAD')}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    <CancelUploadsDialog
                        show={showCancelInProgressUploadsDialog}
                        onHide={() => {
                            setShowCancelInProgressUploadsDialog(false);
                        }}
                        clearUploads={async () => {
                            uploadCancelService.requestUploadCancelation();
                            setInProgressUploads([]);
                            setUploadStage(UPLOAD_STAGES.START);
                            setShowUploaderBoxComponent(false);
                        }}
                    />
                </UploaderContext.Provider>
            </>
        );
    };

export default UploaderBoxComponent;
