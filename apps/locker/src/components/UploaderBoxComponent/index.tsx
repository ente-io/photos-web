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
import { LockerDashboardContext } from '@/pages/locker';
import { addLogLine } from '@/utils/logging';
import MinimizeIcon from '@mui/icons-material/Minimize';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

export const UploaderContext = createContext(
    {} as {
        inProgressUploads: InProgressUpload[];
        finishedUploads: SegregatedFinishedUploads;
    }
);

interface IProps {
    filesToUpload: File[];
}

const UploaderBoxComponent = (props: IProps) => {
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

    const [uploadingFiles, setUploadingFiles] = useState<FileWithCollection[]>(
        []
    );

    const [showUploadingFiles, setShowUploadingFiles] = useState(true);

    const initUploadManager = async () => {
        // Initialize the upload manager
        await uploadManager.init(
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

    const { currentCollection } = useContext(LockerDashboardContext);

    const handleFileUpload = async () => {
        if (!currentCollection) {
            addLogLine('No collection selected');
            return;
        }

        const fileWithCollections: FileWithCollection[] = [];

        for (const file of props.filesToUpload) {
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

        for await (const fileWithCollection of fileWithCollections) {
            uploadManager.prepareForNewUpload();
            await uploadManager.queueFilesForUpload(
                [fileWithCollection],
                [currentCollection]
            );
        }
    };

    useEffect(() => {
        if (!props.filesToUpload) return;
        addLogLine(`Files selected`);
        handleFileUpload();
    }, [props.filesToUpload]);

    return (
        <>
            <UploaderContext.Provider
                value={{
                    inProgressUploads,
                    finishedUploads,
                }}>
                <Box
                    sx={{
                        width: '40rem',
                        position: 'fixed',
                        bottom: '1rem',
                        right: '1rem',
                        borderRadius: '10px',
                        backgroundColor: '#141414',
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
                                    setShowUploadingFiles(!showUploadingFiles);
                                }}>
                                {showUploadingFiles ? (
                                    <MinimizeIcon />
                                ) : (
                                    <OpenInFullIcon />
                                )}
                            </IconButton>
                            <IconButton size="small">
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                    {showUploadingFiles && (
                        <>
                            {uploadingFiles.map((file, index) => (
                                <UploaderFile
                                    key={index}
                                    localID={file.localID}
                                    file={file.file}
                                />
                            ))}
                            {uploadingFiles.length < 1 && (
                                <Typography textAlign="center" margin="1rem">
                                    No files selected for upload
                                </Typography>
                            )}
                        </>
                    )}
                </Box>
            </UploaderContext.Provider>
        </>
    );
};

export default UploaderBoxComponent;
