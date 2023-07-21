import { EnteFile } from '@/interfaces/file';
import { Box, Typography, IconButton } from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useContext, useMemo } from 'react';
import { LockerDashboardContext } from '@/pages/locker';

const FileComponent = ({ file }: { file: EnteFile }) => {
    const { selectedFiles, setSelectedFiles } = useContext(
        LockerDashboardContext
    );

    const isSelected = useMemo(() => {
        return selectedFiles.find(
            (selectedFile) => selectedFile.id === file.id
        );
    }, [selectedFiles, file]);

    return (
        <Box
            bgcolor="#201E1E"
            height="3rem"
            borderRadius="10px"
            boxSizing={'border-box'}
            display="flex"
            alignItems="center"
            paddingRight="1rem"
            sx={{
                userSelect: 'none',
            }}>
            <IconButton
                onClick={() => {
                    if (isSelected) {
                        setSelectedFiles(
                            selectedFiles.filter(
                                (selectedFile) => selectedFile.id !== file.id
                            )
                        );
                    } else {
                        setSelectedFiles([...selectedFiles, file]);
                    }
                }}>
                {isSelected ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
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
