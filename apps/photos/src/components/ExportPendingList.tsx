import { EnteFile } from 'types/file';
import ItemList from 'components/ItemList';
import DialogBoxV2 from './DialogBoxV2';
import { t } from 'i18next';
import { FlexWrapper } from './Container';
import CollectionCard from './Collections/CollectionCard';
import { ResultPreviewTile } from './Collections/styledComponents';
import { Box, styled } from '@mui/material';

interface Iprops {
    isOpen: boolean;
    onClose: () => void;
    collectionNameMap: Map<number, string>;
    pendingExports: EnteFile[];
}

export const ItemContainer = styled('div')`
    position: relative;
    top: 5px;
    display: inline-block;
    max-width: 394px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;

const ExportPendingList = (props: Iprops) => {
    const renderListItem = (file: EnteFile) => {
        return (
            <FlexWrapper>
                <Box sx={{ marginRight: '8px' }}>
                    <CollectionCard
                        key={file.id}
                        coverFile={file}
                        onClick={() => null}
                        collectionTile={ResultPreviewTile}
                    />
                </Box>
                <ItemContainer>
                    {`${props.collectionNameMap.get(file.collectionID)} / ${
                        file.metadata.title
                    }`}
                </ItemContainer>
            </FlexWrapper>
        );
    };

    const getItemTitle = (file: EnteFile) => {
        return `${props.collectionNameMap.get(file.collectionID)} / ${
            file.metadata.title
        }`;
    };

    const generateItemKey = (file: EnteFile) => {
        return `${file.collectionID}-${file.id}`;
    };

    return (
        <DialogBoxV2
            open={props.isOpen}
            onClose={props.onClose}
            PaperProps={{
                sx: { maxWidth: '444px' },
            }}
            attributes={{
                title: t('PENDING_ITEMS'),
                close: {
                    action: props.onClose,
                    text: t('CLOSE'),
                },
            }}>
            <ItemList
                maxHeight={240}
                itemSize={50}
                items={props.pendingExports}
                renderListItem={renderListItem}
                getItemTitle={getItemTitle}
                generateItemKey={generateItemKey}
            />
        </DialogBoxV2>
    );
};

export default ExportPendingList;
