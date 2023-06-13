import { Box, IconButton } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import { borderProperty } from '@/constants/ui/locker/border';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { useContext, useEffect, useRef, useState } from 'react';
import uploadManager from '@/services/uploadManager';
import {
    InProgressUpload,
    SegregatedFinishedUploads,
    UploadCounter,
    UploadFileNames,
} from '@/interfaces/upload/ui';
import { UPLOAD_STAGES } from '@/constants/upload';
import { LockerDashboardContext } from '@/pages/locker';
import { FileWithCollection } from '@/interfaces/upload';
import { addLogLine } from '@/utils/logging';
import NewCollectionModal from './NewCollectionModal';
import MenuIcon from '@mui/icons-material/Menu';

const NavBar = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);

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
        setCurrentCollection,
        uncategorizedCollection,
        syncFiles,
        setLeftDrawerOpened,
    } = useContext(LockerDashboardContext);

    const localIDCounter = useRef(0);

    const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);

    useEffect(() => {
        console.log('Syncing files');
        syncFiles();
    }, [finishedUploads]);

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
            <Box
                sx={{
                    padding: '1rem',
                    borderBottom: borderProperty,
                    display: 'flex',
                    justifyContent: 'space-between',
                }}>
                <Box
                    height="inherit"
                    display="flex"
                    alignItems="center"
                    gap="1rem">
                    <IconButton
                        onClick={() => {
                            setLeftDrawerOpened(true);
                        }}>
                        <MenuIcon />
                    </IconButton>
                    <Image
                        src="/locker.svg"
                        alt="ente Locker logo"
                        width={200}
                        height={50}
                        onClick={() => {
                            setCurrentCollection(uncategorizedCollection);
                        }}
                    />
                </Box>
                <Box>
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
                </Box>
            </Box>
            <input
                ref={fileInputRef}
                type="file"
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
        </>
    );
};

export default NavBar;
