import {
    Box,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
} from '@mui/material';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import {
    useContext,
    useEffect,
    useRef,
    useState,
    MouseEvent,
    useMemo,
} from 'react';
import { UPLOAD_STAGES } from '@/constants/upload';
import { LockerDashboardContext, LockerUploaderContext } from '@/pages/locker';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import DownloadIcon from '@mui/icons-material/Download';
import { downloadFile, downloadFilesAsZip } from '@/utils/file';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import UploaderBoxComponent from '@/components/UploaderBoxComponent';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { isMobileDisplay } from '@/utils/resolution/isMobile';
import dynamic from 'next/dynamic';
import InfoIcon from '@mui/icons-material/Info';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import { EnteFile } from '@/interfaces/file';
const NewCollectionModal = dynamic(() => import('../NewCollectionModal'));
const TrashFilesModal = dynamic(() => import('../TrashFilesModal'));
const RenameFileModal = dynamic(() => import('../RenameFileModal'));
const MoveFilesModal = dynamic(() => import('../MoveFilesModal'));
const PermanentlyDeleteFilesModal = dynamic(
    () => import('../PermanentlyDeleteFilesModal')
);
const DeleteCollectionsModal = dynamic(
    () => import('../DeleteCollectionsModal')
);
const RenameCollectionModal = dynamic(() => import('../RenameCollectionModal'));

const FileInfoDrawer = dynamic(() => import('../FileInfoDrawer'));

const NavBarRight = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    const [showFileInfoDrawer, setShowFileInfoDrawer] = useState(false);

    const [uploadStage, setUploadStage] = useState<UPLOAD_STAGES>(
        UPLOAD_STAGES.START
    );

    const [showMobileLayout, setShowMobileLayout] = useState(false);

    const [overflowMenuAnchorEl, setOverflowMenuAnchorEl] =
        useState<null | HTMLElement>(null);

    const open = Boolean(overflowMenuAnchorEl);

    const handleMobileDotsMenuClick = (
        event: MouseEvent<HTMLButtonElement>
    ) => {
        setOverflowMenuAnchorEl(event.currentTarget);
    };
    const handleMobileDotsMenuClose = () => {
        setOverflowMenuAnchorEl(null);
    };

    const { filesToUpload, setFilesToUpload } = useContext(
        LockerUploaderContext
    );

    const {
        syncCollections,
        syncFiles,
        // selectedFiles,
        // setSelectedFiles,
        collections,
        dashboardView,
        // selectedCollections,
        // setSelectedCollections,
        selectedExplorerItems,
        setSelectedExplorerItems,
        explorerItems,
        syncTrash,
        showUploaderBoxComponent,
        setShowUploaderBoxComponent,
        // filteredFiles,
    } = useContext(LockerDashboardContext);

    useEffect(() => {
        if (uploadStage === UPLOAD_STAGES.FINISH) {
            syncFiles();
        }
    }, [uploadStage]);

    useEffect(() => {
        if (filesToUpload.length > 0) {
            setShowUploaderBoxComponent(true);
        }
    }, [filesToUpload]);

    const checkIsMobile = () => {
        const isMobileDisplay_ = isMobileDisplay();
        setShowMobileLayout(isMobileDisplay_);
    };

    useEffect(() => {
        checkIsMobile();

        window.onresize = checkIsMobile;

        return () => {
            window.onresize = null;
        };
    }, []);

    const selectAllHandler = () => {
        if (selectedExplorerItems.length === explorerItems.length) {
            setSelectedExplorerItems([]);
            return;
        }

        setSelectedExplorerItems(explorerItems);
    };

    const moveFilesHandler = () => {
        setShowMoveFilesModal(true);
    };

    const renameFileHandler = () => {
        if (selectedExplorerItems[0].type === 'file') {
            setShowFileRenameModal(true);
        } else {
            setShowRenameCollectionModal(true);
        }
    };

    const renameCollectionHandler = () => {
        setShowRenameCollectionModal(true);
    };

    const trashAndDeleteFilesHandler = () => {
        if (dashboardView === 'trash') {
            setShowPermanentlyDeleteFilesModal(true);
        } else {
            setShowTrashFilesModal(true);
        }
    };

    const downloadFilesHandler = async () => {
        const files = selectedExplorerItems.map((item) => {
            return item.originalItem as EnteFile;
        });

        if (files.length > 1) {
            await downloadFilesAsZip(files);
            return;
        }
        await downloadFile(files[0]);
    };

    const deleteCollectionHandler = () => {
        setShowDeleteCollectionsModal(true);
    };

    const createCollectionHandler = () => {
        setShowNewCollectionModal(true);
    };

    const fileInfoHandler = () => {
        setShowFileInfoDrawer(true);
    };

    const allSelectedAreFiles = useMemo(() => {
        return (
            selectedExplorerItems.filter((item) => item.type === 'file')
                .length === selectedExplorerItems.length
        );
    }, [selectedExplorerItems]);

    const allSelectedAreCollections = useMemo(() => {
        return (
            selectedExplorerItems.filter((item) => item.type === 'collection')
                .length === selectedExplorerItems.length
        );
    }, [selectedExplorerItems]);

    return (
        <>
            <Box>
                {selectedExplorerItems.length === 0 ? (
                    <IconButton onClick={selectAllHandler}>
                        <CheckBoxOutlineBlankIcon />
                    </IconButton>
                ) : (
                    <IconButton onClick={selectAllHandler}>
                        {selectedExplorerItems.length ===
                        explorerItems.length ? (
                            <CheckBoxIcon />
                        ) : (
                            <IndeterminateCheckBoxIcon />
                        )}
                    </IconButton>
                )}

                {selectedExplorerItems.length > 0 ? (
                    <>
                        {allSelectedAreFiles ? (
                            <>
                                <IconButton onClick={moveFilesHandler}>
                                    {dashboardView === 'trash' ? (
                                        <RestoreFromTrashIcon />
                                    ) : (
                                        <DriveFileMoveIcon />
                                    )}
                                </IconButton>
                                {selectedExplorerItems.length === 1 && (
                                    <>
                                        <IconButton onClick={renameFileHandler}>
                                            <DriveFileRenameOutlineIcon />
                                        </IconButton>

                                        {allSelectedAreFiles && (
                                            <IconButton
                                                onClick={fileInfoHandler}>
                                                <InfoIcon />
                                            </IconButton>
                                        )}
                                    </>
                                )}
                                <IconButton
                                    onClick={trashAndDeleteFilesHandler}>
                                    <DeleteIcon />
                                </IconButton>
                            </>
                        ) : (
                            <>
                                {selectedExplorerItems.length === 1 && (
                                    <IconButton
                                        onClick={renameCollectionHandler}>
                                        <DriveFileRenameOutlineIcon />
                                    </IconButton>
                                )}

                                <IconButton onClick={deleteCollectionHandler}>
                                    <DeleteIcon />
                                </IconButton>
                            </>
                        )}

                        {allSelectedAreFiles && (
                            <IconButton onClick={downloadFilesHandler}>
                                <DownloadIcon />
                            </IconButton>
                        )}
                    </>
                ) : (
                    <>
                        <IconButton onClick={createCollectionHandler}>
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
                    setFilesToUpload(files);
                }}
            />
            <NewCollectionModal
                show={showNewCollectionModal}
                onHide={() => {
                    setShowNewCollectionModal(false);
                    syncCollections();
                }}
            />
            {allSelectedAreFiles && (
                <>
                    <TrashFilesModal
                        show={showTrashFilesModal}
                        onHide={() => {
                            setSelectedExplorerItems([]);
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
                            setSelectedExplorerItems([]);
                            if (dashboardView === 'locker') {
                                syncFiles();
                            } else if (dashboardView === 'trash') {
                                syncTrash();
                            }
                        }}
                    />
                    <PermanentlyDeleteFilesModal
                        show={showPermanentlyDeleteFilesModal}
                        onHide={() => {
                            setShowPermanentlyDeleteFilesModal(false);
                            setSelectedExplorerItems([]);
                            syncTrash();
                        }}
                    />
                    <FileInfoDrawer
                        isOpen={showFileInfoDrawer}
                        setIsOpen={setShowFileInfoDrawer}
                    />
                </>
            )}
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
                    setSelectedExplorerItems([]);
                    syncCollections();
                }}
            />
            {showUploaderBoxComponent && <UploaderBoxComponent />}
        </>
    );
};

export default NavBarRight;
