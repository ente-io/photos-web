import { FlexWrapper } from '@/components/Container';
import DialogBoxV2 from '@/components/DialogBoxV2';
import { Collection } from '@/interfaces/collection';
import { Button, TextField } from '@mui/material';
import { useContext, useState } from 'react';
import CollectionComponent from './Collection';
import EnteButton from '@/components/EnteButton';
import { LockerDashboardContext } from '@/pages/locker';
import { moveToCollection } from '@/services/collectionService';

interface IProps {
    show: boolean;
    collections: Collection[];
    onHide: () => void;
}
const MoveFilesModal = (props: IProps) => {
    const [targetCollection, setTargetCollection] = useState<Collection | null>(
        null
    );

    const { selectedFiles } = useContext(LockerDashboardContext);

    return (
        <>
            <DialogBoxV2
                sx={{ zIndex: 1600 }}
                open={props.show}
                onClose={props.onHide}
                attributes={{
                    title: `Move ${selectedFiles.length} ${
                        selectedFiles.length > 1 ? 'files' : 'file'
                    }`,
                }}>
                <TextField
                    sx={{ width: '100%' }}
                    label="Collection name"
                    variant="outlined"
                    placeholder="Collection name"
                />
                <FlexWrapper flexDirection="column" width="100%" gap=".5rem">
                    {props.collections.map((collection) => (
                        <CollectionComponent
                            key={collection.id}
                            collection={collection}
                            sx={{
                                width: '100%',
                                border: '1px solid #b1b1b1',
                            }}
                            focus={targetCollection?.id === collection.id}
                            onClick={() => {
                                setTargetCollection(collection);
                            }}
                        />
                    ))}
                </FlexWrapper>
                {targetCollection && (
                    <EnteButton
                        type="submit"
                        size="large"
                        color={'accent'}
                        onClick={async () => {
                            for (const file of selectedFiles) {
                                await moveToCollection(
                                    targetCollection,
                                    file.collectionID,
                                    [file]
                                );
                            }
                            props.onHide();
                        }}>
                        Move
                    </EnteButton>
                )}
                <Button size="large" color="secondary" onClick={props.onHide}>
                    Cancel
                </Button>
            </DialogBoxV2>
        </>
    );
};

export default MoveFilesModal;
