import { EnteFile } from '@/interfaces/file';
import { TableRow, TableCell, styled } from '@mui/material';
import { useContext, useMemo } from 'react';
import { LockerDashboardContext } from '@/pages/locker';
import { getFriendlyHumanReadableDate } from '@/utils/time/format';
import { convertBytesToHumanReadable } from '../../../utils/file/size';
import { resolveFileType } from 'friendly-mimes';
import { AppContext } from '@/pages/_app';
import InventoryIcon from '@mui/icons-material/Inventory';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
const TableRowBorderControlled = styled(TableCell)`
    border: none;
`;

const FileComponent = ({ file, index }: { file: EnteFile; index: number }) => {
    const { selectedFiles, setSelectedFiles, filteredFiles } = useContext(
        LockerDashboardContext
    );

    const { shiftKeyHeld, ctrlCmdKeyHeld } = useContext(AppContext);

    const isSelected = useMemo(() => {
        return selectedFiles.find(
            (selectedFile) => selectedFile.id === file.id
        );
    }, [selectedFiles, file]);

    const friendlyMimeType = useMemo(() => {
        // check if it has an extension
        const extension = '.' + file.metadata.title.split('.').pop();

        if (!extension) return 'File';

        let fileTypeObj: any = {};

        try {
            fileTypeObj = resolveFileType(extension);
        } catch (e) {
            return 'File';
        }

        return fileTypeObj.name;
    }, [file.metadata.title]);

    const fileTypeIcon = useMemo(() => {
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
            onClick={() => {
                if (selectedFiles.length > 0) {
                    if (shiftKeyHeld) {
                        // if there is at least one selected file and the shift key is held down, select all within the range of the two files
                        // get the index of the first selected file
                        const firstSelectedFileIndex = selectedFiles.findIndex(
                            (selectedFile) =>
                                selectedFile.id === selectedFiles[0].id
                        );

                        const filesInBetween = filteredFiles.slice(
                            firstSelectedFileIndex,
                            index + 1
                        );

                        setSelectedFiles(filesInBetween);
                        return;
                    }

                    if (ctrlCmdKeyHeld) {
                        // if the ctrl/cmd key is held down:
                        // if the file clicked is not selected, add it to the selected files
                        // otherwise, remove it.
                        if (!isSelected) {
                            setSelectedFiles([...selectedFiles, file]);
                        } else {
                            setSelectedFiles(
                                selectedFiles.filter(
                                    (selectedFile) =>
                                        selectedFile.id !== file.id
                                )
                            );
                        }
                        return;
                    }
                }

                if (isSelected) {
                    setSelectedFiles(
                        selectedFiles.filter(
                            (selectedFile) => selectedFile.id !== file.id
                        )
                    );
                } else {
                    setSelectedFiles([file]);
                }
            }}>
            <TableRowBorderControlled
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                }}>
                {fileTypeIcon} {file.metadata.title}
            </TableRowBorderControlled>
            <TableRowBorderControlled>
                {getFriendlyHumanReadableDate(
                    new Date(file.metadata.creationTime / 1000)
                )}
            </TableRowBorderControlled>
            <TableRowBorderControlled>
                {convertBytesToHumanReadable(file?.info?.fileSize)}
            </TableRowBorderControlled>
            <TableRowBorderControlled>
                {friendlyMimeType}
            </TableRowBorderControlled>
        </TableRow>
    );
};

export default FileComponent;
