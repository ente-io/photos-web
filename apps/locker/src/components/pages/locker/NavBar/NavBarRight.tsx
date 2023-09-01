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
import { useContext, useEffect, useRef, useState, MouseEvent } from 'react';
import { UPLOAD_STAGES } from '@/constants/upload';
import { LockerDashboardContext } from '@/pages/locker';
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
        if (selectedFiles.length === filteredFiles.length) {
            setSelectedFiles([]);
            setSelectedCollections([]);
            return;
        }

        setSelectedFiles(filteredFiles);
    };

    const moveFilesHandler = () => {
        setShowMoveFilesModal(true);
    };

    const renameFileHandler = () => {
        setShowFileRenameModal(true);
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
        if (selectedFiles.length > 1) {
            await downloadFilesAsZip(selectedFiles);
            return;
        }

        await downloadFile(selectedFiles[0]);
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

    return (
        <>
            <Box>
                {showMobileLayout ? (
                    <>
                        <IconButton onClick={handleMobileDotsMenuClick}>
                            <MoreHorizIcon />
                        </IconButton>
                        <Menu
                            open={open}
                            onClose={handleMobileDotsMenuClose}
                            anchorEl={overflowMenuAnchorEl}>
                            {selectedFiles.length === 0
                                ? [
                                      <MenuItem
                                          key="select-all"
                                          onClick={selectAllHandler}>
                                          <ListItemIcon>
                                              <CheckBoxOutlineBlankIcon />
                                          </ListItemIcon>
                                          <ListItemText>
                                              Select All
                                          </ListItemText>
                                      </MenuItem>,
                                  ]
                                : [
                                      <MenuItem
                                          key="deselect-all"
                                          onClick={selectAllHandler}>
                                          <ListItemIcon>
                                              {selectedFiles.length ===
                                              filteredFiles.length ? (
                                                  <CheckBoxIcon />
                                              ) : (
                                                  <IndeterminateCheckBoxIcon />
                                              )}
                                          </ListItemIcon>
                                          <ListItemText>
                                              De-select All
                                          </ListItemText>
                                      </MenuItem>,
                                      selectedFiles.length === 1 && [
                                          <MenuItem
                                              key="rename-file"
                                              onClick={renameFileHandler}>
                                              <ListItemIcon>
                                                  <DriveFileRenameOutlineIcon />
                                              </ListItemIcon>
                                              <ListItemText>
                                                  Rename
                                              </ListItemText>
                                          </MenuItem>,
                                          <MenuItem
                                              key="file-info"
                                              onClick={fileInfoHandler}>
                                              <ListItemIcon>
                                                  <InfoIcon />
                                              </ListItemIcon>
                                              <ListItemText>
                                                  File Info
                                              </ListItemText>
                                          </MenuItem>,
                                      ],
                                      <MenuItem
                                          key="move-files"
                                          onClick={moveFilesHandler}>
                                          <ListItemIcon>
                                              <DriveFileMoveIcon />
                                          </ListItemIcon>
                                          <ListItemText>Move</ListItemText>
                                      </MenuItem>,
                                      <MenuItem
                                          key="trash-files"
                                          onClick={trashAndDeleteFilesHandler}>
                                          <ListItemIcon>
                                              <DeleteIcon />
                                          </ListItemIcon>
                                          <ListItemText>Trash</ListItemText>
                                      </MenuItem>,
                                      <MenuItem
                                          key="download-files"
                                          onClick={downloadFilesHandler}>
                                          <ListItemIcon>
                                              <DownloadIcon />
                                          </ListItemIcon>
                                          <ListItemText>Download</ListItemText>
                                      </MenuItem>,
                                  ]}
                            {selectedCollections.length === 1 && (
                                <MenuItem
                                    key="rename-collection"
                                    onClick={renameCollectionHandler}>
                                    <ListItemIcon>
                                        <DriveFileRenameOutlineIcon />
                                    </ListItemIcon>
                                    <ListItemText>Rename</ListItemText>
                                </MenuItem>
                            )}
                            {selectedCollections.length > 0 && (
                                <MenuItem
                                    key="delete-collection"
                                    onClick={deleteCollectionHandler}>
                                    <ListItemIcon>
                                        <DeleteIcon />
                                    </ListItemIcon>
                                    <ListItemText>Delete</ListItemText>
                                </MenuItem>
                            )}
                            {selectedFiles.length === 0 && [
                                <MenuItem
                                    key="create-collection"
                                    onClick={createCollectionHandler}>
                                    <ListItemIcon>
                                        <CreateNewFolderIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        Create New Collection
                                    </ListItemText>
                                </MenuItem>,
                                <MenuItem
                                    key="upload-files"
                                    onClick={() => {
                                        fileInputRef.current?.click();
                                    }}>
                                    <ListItemIcon>
                                        <FileUploadIcon />
                                    </ListItemIcon>
                                    <ListItemText>Upload Files</ListItemText>
                                </MenuItem>,
                            ]}
                        </Menu>
                    </>
                ) : (
                    <>
                        {selectedFiles.length === 0 ? (
                            <IconButton onClick={selectAllHandler}>
                                <CheckBoxOutlineBlankIcon />
                            </IconButton>
                        ) : (
                            <IconButton onClick={selectAllHandler}>
                                {selectedFiles.length ===
                                filteredFiles.length ? (
                                    <CheckBoxIcon />
                                ) : (
                                    <IndeterminateCheckBoxIcon />
                                )}
                            </IconButton>
                        )}

                        {selectedFiles.length > 0 ||
                        selectedCollections.length > 0 ? (
                            <>
                                {selectedFiles.length > 0 ? (
                                    <>
                                        <IconButton onClick={moveFilesHandler}>
                                            {dashboardView === 'trash' ? (
                                                <RestoreFromTrashIcon />
                                            ) : (
                                                <DriveFileMoveIcon />
                                            )}
                                        </IconButton>
                                        {selectedFiles.length === 1 && (
                                            <>
                                                <IconButton
                                                    onClick={renameFileHandler}>
                                                    <DriveFileRenameOutlineIcon />
                                                </IconButton>

                                                <IconButton
                                                    onClick={fileInfoHandler}>
                                                    <InfoIcon />
                                                </IconButton>
                                            </>
                                        )}
                                        <IconButton
                                            onClick={
                                                trashAndDeleteFilesHandler
                                            }>
                                            <DeleteIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={downloadFilesHandler}>
                                            <DownloadIcon />
                                        </IconButton>
                                    </>
                                ) : (
                                    <>
                                        {selectedCollections.length === 1 && (
                                            <IconButton
                                                onClick={
                                                    renameCollectionHandler
                                                }>
                                                <DriveFileRenameOutlineIcon />
                                            </IconButton>
                                        )}

                                        <IconButton
                                            onClick={deleteCollectionHandler}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </>
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
            <FileInfoDrawer
                isOpen={showFileInfoDrawer}
                setIsOpen={setShowFileInfoDrawer}
            />
            {showUploaderBoxComponent && (
                <UploaderBoxComponent filesToUpload={files} />
            )}
        </>
    );
};

export default NavBarRight;
