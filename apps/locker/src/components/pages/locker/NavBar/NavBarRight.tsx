import {
    Box,
    Icon,
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
import { isMobileDisplay } from '@/utils/resolution/isMobile';
import dynamic from 'next/dynamic';
import InfoIcon from '@mui/icons-material/Info';
import RestoreIcon from '@mui/icons-material/Restore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
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
        currentCollection,
        uncategorizedCollection,
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
        if (!selectedExplorerItems.length) return false;

        return (
            selectedExplorerItems.filter((item) => item.type === 'file')
                .length === selectedExplorerItems.length
        );
    }, [selectedExplorerItems]);

    const allSelectedAreCollections = useMemo(() => {
        if (!selectedExplorerItems.length) return false;

        return (
            selectedExplorerItems.filter((item) => item.type === 'collection')
                .length === selectedExplorerItems.length
        );
    }, [selectedExplorerItems]);

    const menuItems = [
        {
            label: 'Select All',
            icon:
                selectedExplorerItems.length === 0 ? (
                    <CheckBoxOutlineBlankIcon />
                ) : selectedExplorerItems.length === explorerItems.length ? (
                    <CheckBoxIcon />
                ) : (
                    <IndeterminateCheckBoxIcon />
                ),
            onClick: selectAllHandler,
        },
        {
            label: 'Move',
            icon:
                dashboardView === 'trash' ? (
                    <RestoreIcon />
                ) : (
                    <DriveFileMoveIcon />
                ),
            onClick: moveFilesHandler,
            condition: selectedExplorerItems.length > 0 && allSelectedAreFiles,
        },
        {
            label: 'Rename',
            icon: <DriveFileRenameOutlineIcon />,
            onClick: renameFileHandler,
            condition:
                selectedExplorerItems.length === 1 && allSelectedAreFiles,
        },
        {
            label: 'File Info',
            icon: <InfoIcon />,
            onClick: fileInfoHandler,
            condition: allSelectedAreFiles,
        },
        {
            label: dashboardView === 'trash' ? 'Permanently Delete' : 'Delete',
            icon: <DeleteIcon />,
            onClick: trashAndDeleteFilesHandler,
            condition: selectedExplorerItems.length > 0 && allSelectedAreFiles,
        },
        {
            label: 'Download',
            icon: <DownloadIcon />,
            onClick: downloadFilesHandler,
            condition: allSelectedAreFiles,
        },
        {
            label: 'Rename Collection',
            icon: <DriveFileRenameOutlineIcon />,
            onClick: renameCollectionHandler,
            condition:
                selectedExplorerItems.length === 1 && !allSelectedAreFiles,
        },
        {
            label: 'Delete Collection',
            icon: <DeleteIcon />,
            onClick: deleteCollectionHandler,
            condition:
                selectedExplorerItems.length === 1 && allSelectedAreCollections,
        },
        {
            label: 'Create Collection',
            icon: <CreateNewFolderIcon />,
            onClick: createCollectionHandler,
            condition:
                selectedExplorerItems.length === 0 &&
                currentCollection?.id === uncategorizedCollection?.id,
        },
        {
            label: 'Upload File',
            icon: <FileUploadIcon />,
            onClick: () => {
                fileInputRef.current?.click();
            },
            condition: selectedExplorerItems.length === 0,
        },
    ];

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Box>
                <Box
                    sx={{
                        '@media only screen and (max-width: 800px)': {
                            display: 'none',
                        },
                    }}>
                    {menuItems.map((menuItem, index) =>
                        menuItem.condition === undefined ||
                        menuItem.condition ? (
                            <IconButton key={index} onClick={menuItem.onClick}>
                                {menuItem.icon}
                            </IconButton>
                        ) : null
                    )}
                </Box>
                <Box
                    sx={{
                        '@media only screen and (min-width: 800px)': {
                            display: 'none',
                        },
                    }}>
                    <IconButton
                        onClick={handleMenuOpen}
                        sx={{
                            color: '#fff',
                        }}>
                        <MoreVertIcon />
                    </IconButton>
                </Box>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}>
                    {menuItems.map((menuItem, index) =>
                        menuItem.condition === undefined ||
                        menuItem.condition ? (
                            <MenuItem
                                key={index}
                                onClick={() => {
                                    handleMenuClose();
                                    menuItem.onClick();
                                }}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}>
                                {menuItem.icon}
                                {menuItem.label}
                            </MenuItem>
                        ) : null
                    )}
                </Menu>
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
