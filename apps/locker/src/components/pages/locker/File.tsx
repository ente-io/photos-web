import { EnteFile } from '@/interfaces/file';
import { TableRow, TableCell } from '@mui/material';
import { useContext, useMemo } from 'react';
import { LockerDashboardContext } from '@/pages/locker';
import { getFriendlyHumanReadableDate } from '@/utils/time/format';
import { convertBytesToHumanReadable } from '../../../utils/file/size';
import { resolveFileType } from 'friendly-mimes';
import { AppContext } from '@/pages/_app';

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

    return (
        <TableRow
            sx={{
                border: 0,
                '&:nth-of-type(odd)': {
                    backgroundColor: '#232425',
                },
                backgroundColor: isSelected ? '#57B660 !important' : 'inherit',
                userSelect: 'none',
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
            <TableCell>{file.metadata.title}</TableCell>
            <TableCell>
                {getFriendlyHumanReadableDate(
                    new Date(file.metadata.creationTime / 1000)
                )}
            </TableCell>
            <TableCell>
                {convertBytesToHumanReadable(file.info.fileSize)}
            </TableCell>
            <TableCell>{friendlyMimeType}</TableCell>
        </TableRow>
    );
};

export default FileComponent;
