import { DrawerSidebar } from '@/components/Sidebar/drawer';
import { EnteFile } from '@/interfaces/file';
import { LockerDashboardContext } from '@/pages/locker';
import {
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    TextField,
    Typography,
} from '@mui/material';
import {
    ChangeEvent,
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from 'react';

import AddAlarmIcon from '@mui/icons-material/AddAlarm';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import SdStorageIcon from '@mui/icons-material/SdStorage';
import CloseIcon from '@mui/icons-material/Close';

import { convertBytesToHumanReadable } from '@/utils/file/size';
import { t } from 'i18next';
import { changeCaption, updateExistingFilePubMetadata } from '@/utils/file';
import EnteSpinner from '@/components/EnteSpinner';
import { updateFilePublicMagicMetadata } from '@/services/fileService';

const FileInfoDrawer = ({
    isOpen,
    setIsOpen,
}: {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}) => {
    const { selectedFiles, syncFiles } = useContext(LockerDashboardContext);

    const [selectedFile, setSelectedFile] = useState<EnteFile | null>(null);

    const [caption, setCaption] = useState<string>('');

    const [captionSaveInProgress, setCaptionSaveInProgress] =
        useState<boolean>(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            setCaptionSaveInProgress(true);
            // save value
            try {
                let updatedFile = await changeCaption(selectedFile, caption);
                updatedFile = (
                    await updateFilePublicMagicMetadata([updatedFile])
                )[0];
                updateExistingFilePubMetadata(selectedFile, updatedFile);
                selectedFile.title = selectedFile.pubMagicMetadata.data.caption;
            } catch (e: any) {
                console.error(e);
            } finally {
                setCaptionSaveInProgress(false);
                await syncFiles();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [caption]);

    const onCaptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setCaption(event.target.value || '');
    };

    useEffect(() => {
        if (selectedFiles.length === 1) {
            setSelectedFile(selectedFiles[0]);
        } else {
            setSelectedFile(null);
        }
    }, [selectedFiles]);

    useEffect(() => {
        setCaption(selectedFile?.pubMagicMetadata?.data.caption);
    }, [selectedFile]);

    return (
        <DrawerSidebar
            disablePortal
            anchor="right"
            open={isOpen}
            onClose={() => {
                setIsOpen(false);
            }}>
            <List>
                <ListItem
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        width: '100%',
                    }}>
                    <IconButton
                        onClick={() => {
                            setIsOpen(false);
                        }}>
                        <CloseIcon />
                    </IconButton>
                </ListItem>

                <ListItem>
                    <Typography fontWeight="bold" variant="h3">
                        File Info
                    </Typography>
                </ListItem>

                <ListItem>
                    <ListItemIcon>
                        <InsertDriveFileIcon />
                    </ListItemIcon>
                    <ListItemText>{selectedFile?.metadata.title}</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <SdStorageIcon />
                    </ListItemIcon>
                    <ListItemText>
                        {convertBytesToHumanReadable(
                            selectedFile?.info.fileSize
                        )}
                    </ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <AddAlarmIcon />
                    </ListItemIcon>
                    <ListItemText>
                        {new Date(
                            selectedFile?.metadata.creationTime
                        ).toLocaleString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                        })}
                    </ListItemText>
                </ListItem>

                <TextField
                    hiddenLabel
                    fullWidth
                    id="caption"
                    name="caption"
                    type="text"
                    multiline
                    value={caption}
                    onChange={onCaptionChange}
                    placeholder={t('CAPTION_PLACEHOLDER')}
                    disabled={!selectedFile}
                />
                {captionSaveInProgress && <EnteSpinner />}
            </List>
        </DrawerSidebar>
    );
};

export default FileInfoDrawer;
