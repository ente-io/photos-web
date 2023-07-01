import { Box, IconButton } from '@mui/material';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { useContext, useEffect, useRef, useState } from 'react';
import NewCollectionModal from '../NewCollectionModal';
import { UPLOAD_STAGES } from '@/constants/upload';
import {
    UploadCounter,
    InProgressUpload,
    SegregatedFinishedUploads,
    UploadFileNames,
} from '@/interfaces/upload/ui';
import { LockerDashboardContext } from '@/pages/locker';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import TrashFilesModal from '../TrashFilesModal';
import DownloadIcon from '@mui/icons-material/Download';
import { downloadFile, downloadFilesAsZip } from '@/utils/file';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import RenameFileModal from '../RenameFileModal';
import MoveFilesModal from '../MoveFilesModal';
import PermanentlyDeleteFilesModal from '../PermanentlyDeleteFilesModal';
import DeleteCollectionsModal from '../DeleteCollectionsModal';
import RenameCollectionModal from '../RenameCollectionModal';
import UploaderBoxComponent from '@/components/UploaderBoxComponent';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';

const NavBarRight = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [files, setFiles] = useState<File[]>([]);

    const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
    const [showTrashFilesModal, setShowTrashFilesModal] = useState(false);
    const [showFileRenameModal, setShowFileRenameModal] = useState(false);
    const [showMoveFilesModal, setShowMoveFilesModal] = useState(false);
    const [
        showPermanentlyDeleteFilesModal,
        setShowPermanentlyDeleteFilesModal,
    ] = useState(false);
    const [showDeleteCollectionsModal, setShowDeleteCollectionsModal] =
        useState(false);
    const [showRenameCollectionModal, setShowRenameCollectionModal] =
        useState(false);

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

    const {
        syncCollections,
        syncFiles,
        selectedFiles,
        setSelectedFiles,
        collections,
        dashboardView,
        selectedCollections,
        setSelectedCollections,
        syncTrash,
        showUploaderBoxComponent,
        setShowUploaderBoxComponent,
        filteredFiles,
    } = useContext(LockerDashboardContext);

    useEffect(() => {
        if (uploadStage === UPLOAD_STAGES.FINISH) {
            syncFiles();
        }
    }, [uploadStage]);

    useEffect(() => {
        if (files.length > 0) {
            setShowUploaderBoxComponent(true);
        }
    }, [files]);

    return (
        <>
            <Box>
                {selectedFiles.length === 0 ? (
                    <IconButton
                        onClick={() => {
                            setSelectedFiles(filteredFiles);
                            // setSelectedCollections(collections);
                        }}>
                        <CheckBoxOutlineBlankIcon />
                    </IconButton>
                ) : (
                    <IconButton
                        onClick={() => {
                            setSelectedFiles([]);
                            setSelectedCollections([]);
                        }}>
                        {selectedFiles.length === filteredFiles.length ? (
                            <CheckBoxIcon />
                        ) : (
                            <IndeterminateCheckBoxIcon />
                        )}
                    </IconButton>
                )}

                {selectedFiles.length > 0 || selectedCollections.length > 0 ? (
                    <>
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
                                            setShowPermanentlyDeleteFilesModal(
                                                true
                                            );
                                        } else {
                                            setShowTrashFilesModal(true);
                                        }
                                    }}>
                                    <DeleteIcon />
                                </IconButton>
                                <IconButton
                                    onClick={async () => {
                                        if (selectedFiles.length > 1) {
                                            await downloadFilesAsZip(
                                                selectedFiles
                                            );
                                            return;
                                        }

                                        await downloadFile(selectedFiles[0]);
                                    }}>
                                    <DownloadIcon />
                                </IconButton>
                            </>
                        ) : (
                            <>
                                {selectedCollections.length === 1 && (
                                    <IconButton
                                        onClick={() => {
                                            setShowRenameCollectionModal(true);
                                        }}>
                                        <DriveFileRenameOutlineIcon />
                                    </IconButton>
                                )}

                                <IconButton
                                    onClick={() => {
                                        setShowDeleteCollectionsModal(true);
                                    }}>
                                    <DeleteIcon />
                                </IconButton>
                            </>
                        )}
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
                    // get files as File[]
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    setFiles(files);
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
                    setSelectedFiles([]);
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
                    syncTrash();
                }}
            />
            <DeleteCollectionsModal
                show={showDeleteCollectionsModal}
                onHide={() => {
                    setShowDeleteCollectionsModal(false);
                    syncCollections();
                }}
            />
            <RenameCollectionModal
                show={showRenameCollectionModal}
                onHide={() => {
                    setShowRenameCollectionModal(false);
                    setSelectedCollections([]);
                    syncCollections();
                }}
            />
            {showUploaderBoxComponent && (
                <UploaderBoxComponent filesToUpload={files} />
            )}
        </>
    );
};

export default NavBarRight;
