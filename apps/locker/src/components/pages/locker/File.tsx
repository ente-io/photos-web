import { EnteFile } from '@/interfaces/file';
import { downloadFile } from '@/utils/file';
import { Box, Typography, IconButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useContext } from 'react';
import { LockerDashboardContext } from '@/pages/locker';

const FileComponent = ({ file }: { file: EnteFile }) => {
    const { selectedFiles, setSelectedFiles } = useContext(
        LockerDashboardContext
    );

    return (
        <Box
            bgcolor="#201E1E"
            width="15rem"
            flexGrow={1}
            height="3rem"
            borderRadius="10px"
            boxSizing={'border-box'}
            display="flex"
            alignItems="center">
            <IconButton
                onClick={() => {
                    if (selectedFiles.includes(file)) {
                        setSelectedFiles(
                            selectedFiles.filter(
                                (selectedFile) => selectedFile !== file
                            )
                        );
                    } else {
                        setSelectedFiles([...selectedFiles, file]);
                    }
                }}>
                {selectedFiles.includes(file) ? (
                    <CheckBoxIcon />
                ) : (
                    <CheckBoxOutlineBlankIcon />
                )}
            </IconButton>
            <Typography
                textOverflow="ellipsis"
                overflow="hidden"
                whiteSpace="nowrap">
                {file.metadata.title}
            </Typography>
        </Box>
    );
};

export default FileComponent;
