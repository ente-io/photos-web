import { Box, IconButton } from '@mui/material';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { syncCollections } from '@/services/collectionService';
import { useContext, useEffect, useRef, useState } from 'react';
import NewCollectionModal from '../NewCollectionModal';
import { UPLOAD_STAGES } from '@/constants/upload';
import { FileWithCollection } from '@/interfaces/upload';
import {
    UploadCounter,
    InProgressUpload,
    SegregatedFinishedUploads,
    UploadFileNames,
} from '@/interfaces/upload/ui';
import { LockerDashboardContext } from '@/pages/locker';
import uploadManager from '@/services/uploadManager';
import { addLogLine } from '@/utils/logging';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import TrashFilesModal from '../TrashFilesModal';
import DownloadIcon from '@mui/icons-material/Download';
import { downloadFile, downloadFilesAsZip } from '@/utils/file';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import RenameFileModal from '../RenameFileModal';
import MoveFilesModal from '../MoveFilesModal';
import PermanentlyDeleteFilesModal from '../PermanentlyDeleteFilesModal';

const NavBarRight = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);

    const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
    const [showTrashFilesModal, setShowTrashFilesModal] = useState(false);
    const [showFileRenameModal, setShowFileRenameModal] = useState(false);
    const [showMoveFilesModal, setShowMoveFilesModal] = useState(false);
    const [
        showPermanentlyDeleteFilesModal,
        setShowPermanentlyDeleteFilesModal,
    ] = useState(false);

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
    const [files, setFiles] = useState([]);

    const {
        currentCollection,
        syncCollections,
        syncFiles,
        selectedFiles,
        setSelectedFiles,
        collections,
        dashboardView,
        selectedCollections,
        setSelectedCollections,
    } = useContext(LockerDashboardContext);

    useEffect(() => {
        if (uploadStage === UPLOAD_STAGES.FINISH) {
            syncFiles();
        }
    }, [uploadStage]);

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
            setFiles,
            {
                token: null,
                passwordToken: null,
                accessedThroughSharedURL: false,
                // photoListHeader: null,
                // photoListFooter: null,
            }
        );
    };

    const handleFileUpload = async () => {
        uploadManager.prepareForNewUpload();

        if (!currentCollection) {
            addLogLine('No collection selected');
            return;
        }

        const localID = localIDCounter.current++;

        // Add files to be uploaded
        const fileWithCollection: FileWithCollection = {
            file,
            collection: currentCollection,
            localID,
            collectionID: currentCollection.id,
        };
        await uploadManager.queueFilesForUpload(
            [fileWithCollection],
            [currentCollection]
        );
    };

    useEffect(() => {
        initUploadManager();
    }, []);

    useEffect(() => {
        if (!file) return;
        addLogLine(`File selected`);
        handleFileUpload();
    }, [file, currentCollection]);

    return (
        <>
            <Box>
                {selectedFiles.length > 0 ? (
                    <>
                        <IconButton
                            onClick={() => {
                                setShowMoveFilesModal(true);
                            }}>
                            <DriveFileMoveIcon />
                        </IconButton>
                        {selectedFiles.length === 1 && (
                            <IconButton
                                onClick={() => {
                                    setShowFileRenameModal(true);
                                }}>
                                <DriveFileRenameOutlineIcon />
                            </IconButton>
                        )}
                        <IconButton
                            onClick={() => {
                                if (dashboardView === 'trash') {
                                    setShowPermanentlyDeleteFilesModal(true);
                                } else {
                                    setShowTrashFilesModal(true);
                                }
                            }}>
                            <DeleteIcon />
                        </IconButton>
                        <IconButton
                            onClick={async () => {
                                if (selectedFiles.length > 1) {
                                    await downloadFilesAsZip(selectedFiles);
                                    return;
                                }

                                await downloadFile(selectedFiles[0]);
                            }}>
                            <DownloadIcon />
                        </IconButton>
                    </>
                ) : (
                    <>
                        <IconButton
                            onClick={() => {
                                setShowNewCollectionModal(true);
                            }}>
                            <CreateNewFolderIcon />
                        </IconButton>
                        <IconButton
                            onClick={() => {
                                fileInputRef.current?.click();
                            }}>
                            <FileUploadIcon />
                        </IconButton>
                    </>
                )}
            </Box>
            <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{
                    display: 'none',
                }}
                onChange={(e) => {
                    setFile(e.target.files[0]);
                }}
            />
            <NewCollectionModal
                show={showNewCollectionModal}
                onHide={() => {
                    setShowNewCollectionModal(false);
                    syncCollections();
                }}
            />
            <TrashFilesModal
                show={showTrashFilesModal}
                onHide={() => {
                    setShowTrashFilesModal(false);
                    syncFiles();
                }}
            />
            <RenameFileModal
                show={showFileRenameModal}
                onHide={() => {
                    setShowFileRenameModal(false);
                    syncFiles();
                }}
            />
            <MoveFilesModal
                show={showMoveFilesModal}
                collections={collections}
                onHide={() => {
                    setShowMoveFilesModal(false);
                    setSelectedFiles([]);
                    syncFiles();
                }}
            />
            <PermanentlyDeleteFilesModal
                show={showPermanentlyDeleteFilesModal}
                onHide={() => {
                    setShowPermanentlyDeleteFilesModal(false);
                    setSelectedFiles([]);
                    syncFiles();
                }}
            />
        </>
    );
};

export default NavBarRight;
