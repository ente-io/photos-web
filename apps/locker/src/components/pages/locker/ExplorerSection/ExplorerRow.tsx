import { EnteFile } from '@/interfaces/file';
import { TableRow, TableCell, styled, useTheme } from '@mui/material';
import { useContext, useMemo } from 'react';
import { LockerDashboardContext } from '@/pages/locker';
import { getFriendlyHumanReadableDate } from '@/utils/time/format';
import { convertBytesToHumanReadable } from '../../../../utils/file/size';
import { resolveFileType } from 'friendly-mimes';
import { AppContext } from '@/pages/_app';
import InventoryIcon from '@mui/icons-material/Inventory';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { ExplorerItem } from '@/interfaces/explorer';
import Folder from '@mui/icons-material/Folder';
import { Collection } from '@/interfaces/collection';
const TableRowBorderControlled = styled(TableCell)`
    border: none;
`;

const ExplorerRow = ({
    item,
    index,
}: {
    item: ExplorerItem;
    index: number;
}) => {
    const {
        // selectedFiles,
        // setSelectedFiles,
        // filteredFiles,
        // selectedCollections,
        // setSelectedCollections,
        explorerItems,
        selectedExplorerItems,
        setSelectedExplorerItems,
        setCurrentCollection,
    } = useContext(LockerDashboardContext);

    const { shiftKeyHeld, ctrlCmdKeyHeld } = useContext(AppContext);

    const isSelected = useMemo(() => {
        return selectedExplorerItems.find(
            (selectedFile) => selectedFile.id === item.id
        );
    }, [selectedExplorerItems, item]);

    const friendlyMimeType = useMemo(() => {
        // check if it has an extension
        const extension = '.' + item.name.split('.').pop();

        if (!extension) return 'File';

        let fileTypeObj: any = {};

        try {
            fileTypeObj = resolveFileType(extension);
        } catch (e) {
            return 'File';
        }

        return fileTypeObj.name;
    }, [item.name]);

    const fileTypeIcon = useMemo(() => {
        if (item.type === 'collection') {
            return null;
        }

        if (friendlyMimeType.includes('Video')) {
            return <SlideshowIcon />;
        } else if (friendlyMimeType.includes('Image')) {
            return <ImageIcon />;
        }

        switch (friendlyMimeType) {
            case 'Text File':
                return <TextSnippetIcon />;
            case 'Zip Archive':
                return <InventoryIcon />;
            case 'Adobe Portable Document Format':
                return <PictureAsPdfIcon />;
            default:
                return <CloudDoneIcon />;
        }
    }, [friendlyMimeType]);

    return (
        <TableRow
            sx={{
                border: 0,
                '&:nth-of-type(odd)': {
                    backgroundColor: '#232425',
                },
                backgroundColor: isSelected ? '#57B660 !important' : 'inherit',
                userSelect: 'none',
                whiteSpace: 'nowrap',
            }}
            onDoubleClick={() => {
                if (item.type !== 'collection') return;

                setCurrentCollection(item.originalItem as Collection);
            }}
            onClick={() => {
                if (selectedExplorerItems.length > 0) {
                    if (shiftKeyHeld) {
                        // if there is at least one selected item and the shift key is held down, select all within the range of the two items
                        // get the index of the first selected item
                        const firstSelectedItemIndex = explorerItems.findIndex(
                            (selectedItem) =>
                                selectedItem.id === selectedExplorerItems[0].id
                        );
                        const itemsInBetween = explorerItems.slice(
                            firstSelectedItemIndex,
                            index + 1
                        );
                        setSelectedExplorerItems(itemsInBetween);
                        return;
                    }
                    if (ctrlCmdKeyHeld) {
                        // if the ctrl/cmd key is held down:
                        // if the file clicked is not selected, add it to the selected files
                        // otherwise, remove it.
                        if (!isSelected) {
                            setSelectedExplorerItems([
                                ...selectedExplorerItems,
                                item,
                            ]);
                        } else {
                            setSelectedExplorerItems(
                                selectedExplorerItems.filter(
                                    (selectedFile) =>
                                        selectedFile.id !== item.id
                                )
                            );
                        }
                        return;
                    }
                }
                if (isSelected) {
                    setSelectedExplorerItems(
                        selectedExplorerItems.filter(
                            (selectedFile) => selectedFile.id !== item.id
                        )
                    );
                } else {
                    setSelectedExplorerItems([item]);
                }
            }}>
            <TableRowBorderControlled
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                }}>
                {item.type === 'collection' ? (
                    <Folder color={isSelected ? 'primary' : 'accent'} />
                ) : (
                    fileTypeIcon
                )}
                {item.name}
            </TableRowBorderControlled>
            <TableRowBorderControlled>
                {getFriendlyHumanReadableDate(
                    new Date(item.creationTime / 1000)
                )}
            </TableRowBorderControlled>
            <TableRowBorderControlled>
                {convertBytesToHumanReadable(item.size || 0)}
            </TableRowBorderControlled>
            <TableRowBorderControlled>
                {friendlyMimeType}
            </TableRowBorderControlled>
        </TableRow>
    );
};

export default ExplorerRow;
