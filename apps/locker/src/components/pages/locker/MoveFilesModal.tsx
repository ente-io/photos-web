import { FlexWrapper } from '@/components/Container';
import DialogBoxV2 from '@/components/DialogBoxV2';
import { Collection } from '@/interfaces/collection';
import { Button, TextField } from '@mui/material';
import { Fragment, useContext, useEffect, useState } from 'react';
import CollectionComponent from './Collection';
import EnteButton from '@/components/EnteButton';
import { LockerDashboardContext } from '@/pages/locker';
import { moveToCollection } from '@/services/collectionService';
import { t } from 'i18next';

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

    const [filteredCollections, setFilteredCollections] = useState<
        Collection[]
    >([]);

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (searchTerm.length === 0) {
            setFilteredCollections(props.collections);
            return;
        }

        setFilteredCollections(
            props.collections.filter((collection) =>
                collection.name.toLowerCase().includes(searchTerm)
            )
        );
    }, [searchTerm, props.collections]);

    return (
        <>
            <DialogBoxV2
                sx={{ zIndex: 1600 }}
                open={props.show}
                onClose={props.onHide}
                attributes={{
                    title: `${t('MOVE')} ${selectedFiles.length} ${
                        selectedFiles.length > 1
                            ? t('FILES')
                            : t('UPLOAD_FILES')
                    }`,
                }}>
                <TextField
                    sx={{ width: '100%' }}
                    label="Collection name"
                    variant="outlined"
                    placeholder="Collection name"
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                    }}
                />
                <FlexWrapper flexDirection="column" width="100%" gap=".5rem">
                    {selectedFiles.length > 0 && (
                        <>
                            {filteredCollections.map((collection) => (
                                <Fragment key={collection.id}>
                                    {collection.id !==
                                        selectedFiles[0].collectionID && (
                                        <CollectionComponent
                                            collection={collection}
                                            sx={{
                                                width: '100%',
                                                border: '1px solid #b1b1b1',
                                            }}
                                            focus={
                                                targetCollection?.id ===
                                                collection.id
                                            }
                                            onClick={() => {
                                                setTargetCollection(collection);
                                            }}
                                        />
                                    )}
                                </Fragment>
                            ))}
                        </>
                    )}
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
                        {t('MOVE')}
                    </EnteButton>
                )}
                <Button size="large" color="secondary" onClick={props.onHide}>
                    {t('CANCEL')}
                </Button>
            </DialogBoxV2>
        </>
    );
};

export default MoveFilesModal;
