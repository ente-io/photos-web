import { Box } from '@mui/material';
import FileComponent from './File';
import { useContext } from 'react';
import { LockerDashboardContext } from '@/pages/locker';

const FilesSection = () => {
    const { filteredFiles } = useContext(LockerDashboardContext);

    return (
        <>
            <h3>Files</h3>
            <Box
                display="grid"
                gridTemplateColumns={'repeat(auto-fill, minmax(200px, 1fr))'}
                gap="1rem"
                width="100%">
                {filteredFiles.map((file) => (
                    <FileComponent file={file} key={file.id} />
                ))}
            </Box>
        </>
    );
};

export default FilesSection;
