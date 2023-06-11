import { FlexWrapper } from '@/components/Container';
import DialogTitleWithCloseButton from '@/components/DialogBox/TitleWithCloseButton';
import { CollectionType } from '@/constants/collection';
import { createCollection } from '@/services/collectionService';
import { Button, Dialog, DialogContent, Input } from '@mui/material';
import { useState } from 'react';

interface IProps {
    show: boolean;
    onHide: () => void;
}

const NewCollectionModal = (props: IProps) => {
    const [newName, setNewName] = useState('');

    return (
        <Dialog open={props.show} onClose={props.onHide} maxWidth="xs">
            <DialogTitleWithCloseButton onClose={props.onHide}>
                New Collection
            </DialogTitleWithCloseButton>
            <DialogContent>
                <FlexWrapper flexDirection={'column'}>
                    <Input
                        placeholder="Collection Name"
                        onChange={(e) => {
                            setNewName(e.target.value);
                        }}
                    />
                    <Button
                        variant="text"
                        onClick={async () => {
                            await createCollection(
                                newName,
                                CollectionType.folder
                            );
                            props.onHide();
                        }}>
                        Create
                    </Button>
                </FlexWrapper>
            </DialogContent>
        </Dialog>
    );
};

export default NewCollectionModal;
