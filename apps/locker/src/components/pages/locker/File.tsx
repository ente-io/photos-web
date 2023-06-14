import { EnteFile } from '@/interfaces/file';
import { downloadFile } from '@/utils/file';
import { Box, Typography, IconButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

const FileComponent = ({ file }: { file: EnteFile }) => {
    return (
        <Box
            bgcolor="#201E1E"
            width="15rem"
            height="3rem"
            borderRadius="10px"
            padding="1rem"
            boxSizing={'border-box'}
            display="flex"
            alignItems="center"
            justifyContent="space-between">
            <Typography
                textOverflow="ellipsis"
                overflow="hidden"
                whiteSpace="nowrap">
                {file.metadata.title}
            </Typography>
            <IconButton
                onClick={() => {
                    downloadFile(file, false);
                }}>
                <DownloadIcon />
            </IconButton>
        </Box>
    );
};

export default FileComponent;
