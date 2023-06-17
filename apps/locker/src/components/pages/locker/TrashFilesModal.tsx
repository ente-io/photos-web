import { FlexWrapper } from '@/components/Container';
import DialogTitleWithCloseButton from '@/components/DialogBox/TitleWithCloseButton';
import { CollectionType } from '@/constants/collection';
import { LockerDashboardContext } from '@/pages/locker';
import { createCollection } from '@/services/collectionService';
import { trashFiles } from '@/services/fileService';
import {
    Button,
    Dialog,
    DialogContent,
    Input,
    Typography,
} from '@mui/material';
import { useContext, useState } from 'react';

interface IProps {
    show: boolean;
    onHide: () => void;
}

const TrashFilesModal = (props: IProps) => {
    const { selectedFiles, setSelectedFiles } = useContext(
        LockerDashboardContext
    );
    return (
        <Dialog open={props.show} onClose={props.onHide} maxWidth="xs">
            <DialogTitleWithCloseButton onClose={props.onHide}>
                Trash {selectedFiles.length} Files?
            </DialogTitleWithCloseButton>
            <DialogContent>
                <FlexWrapper flexDirection={'column'}>
                    <Typography>
                        Are you sure you want to trash {selectedFiles.length}{' '}
                        files? They will be recoverable within 30 days.
                    </Typography>
                    <Button
                        variant="text"
                        onClick={async () => {
                            trashFiles(selectedFiles).then(() => {
                                setSelectedFiles([]);
                                props.onHide();
                            });
                        }}>
                        Trash
                    </Button>
                </FlexWrapper>
            </DialogContent>
        </Dialog>
    );
};

export default TrashFilesModal;
