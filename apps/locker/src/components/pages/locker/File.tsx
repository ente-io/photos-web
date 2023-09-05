import { EnteFile } from '@/interfaces/file';
import { IconButton, TableRow, TableCell } from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useContext, useMemo } from 'react';
import { LockerDashboardContext } from '@/pages/locker';
import { getFriendlyHumanReadableDate } from '@/utils/time/format';
import { convertBytesToHumanReadable } from '../../../utils/file/size';
import { resolveFileType } from 'friendly-mimes';

const FileComponent = ({ file }: { file: EnteFile }) => {
    const { selectedFiles, setSelectedFiles } = useContext(
        LockerDashboardContext
    );

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
                '&:last-child td, &:last-child th': {
                    border: 0,
                },
            }}>
            <TableCell>
                <IconButton
                    onClick={() => {
                        if (isSelected) {
                            setSelectedFiles(
                                selectedFiles.filter(
                                    (selectedFile) =>
                                        selectedFile.id !== file.id
                                )
                            );
                        } else {
                            setSelectedFiles([...selectedFiles, file]);
                        }
                    }}
                    sx={{
                        padding: 0,
                        margin: 0,
                    }}>
                    {isSelected ? (
                        <CheckBoxIcon color="accent" />
                    ) : (
                        <CheckBoxOutlineBlankIcon />
                    )}
                </IconButton>
            </TableCell>
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
