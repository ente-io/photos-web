import { FlexWrapper } from '@/components/Container';
import DialogBoxV2 from '@/components/DialogBoxV2';
import { Collection } from '@/interfaces/collection';
import { Box, Button, TextField, Typography } from '@mui/material';
import { Fragment, useContext, useEffect, useState } from 'react';
import EnteButton from '@/components/EnteButton';
import { LockerDashboardContext } from '@/pages/locker';
import {
    moveToCollection,
    restoreToCollection,
} from '@/services/collectionService';
import { t } from 'i18next';
import FolderIcon from '@mui/icons-material/Folder';

interface IProps {
    show: boolean;
    collections: Collection[];
    onHide: () => void;
}
const MoveFilesModal = (props: IProps) => {
    const [targetCollection, setTargetCollection] = useState<Collection | null>(
        null
    );

    const { selectedFiles, dashboardView } = useContext(LockerDashboardContext);

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
                collection.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                            {filteredCollections.map((collection) => {
                                return (
                                    <Fragment key={collection.id}>
                                        {(dashboardView === 'trash' ||
                                            collection.id !==
                                                selectedFiles[0]
                                                    .collectionID) && (
                                            <Box
                                                width="100%"
                                                height="3rem"
                                                borderRadius="10px"
                                                padding="1rem"
                                                boxSizing={'border-box'}
                                                display="flex"
                                                alignItems="center"
                                                gap=".5rem"
                                                onClick={() => {
                                                    setTargetCollection(
                                                        collection
                                                    );
                                                }}
                                                border="1px solid white"
                                                sx={{
                                                    cursor: 'pointer',
                                                    backgroundColor:
                                                        targetCollection?.id ===
                                                        collection?.id
                                                            ? '#1DB954'
                                                            : 'inherit',
                                                    userSelect: 'none',
                                                }}>
                                                <FolderIcon />

                                                <Typography
                                                    textOverflow="ellipsis"
                                                    overflow="hidden"
                                                    whiteSpace="nowrap">
                                                    {collection.name}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Fragment>
                                );
                            })}
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
                                if (dashboardView === 'trash') {
                                    await restoreToCollection(
                                        targetCollection,
                                        [file]
                                    );
                                } else {
                                    await moveToCollection(
                                        targetCollection,
                                        file.collectionID,
                                        [file]
                                    );
                                }
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
