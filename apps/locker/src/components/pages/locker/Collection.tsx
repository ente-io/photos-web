import { Collection } from '@/interfaces/collection';
import { LockerDashboardContext } from '@/pages/locker';
import { Box, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import FolderIcon from '@mui/icons-material/Folder';

const CollectionComponent = ({ collection }: { collection: Collection }) => {
    const { setCurrentCollection } = useContext(LockerDashboardContext);

    const [bgColor, setBgColor] = useState<string>('#201E1E');

    return (
        <button
            style={{ all: 'unset', cursor: 'pointer' }}
            onClick={() => {
                setBgColor('#1DB954');
                // in 1 second, set the color back to the original
                setTimeout(() => {
                    setBgColor('#201E1E');
                }, 1000);
            }}
            onDoubleClick={() => {
                setCurrentCollection(collection);
            }}>
            <Box
                bgcolor={bgColor}
                width="auto"
                height="3rem"
                borderRadius="10px"
                padding="1rem"
                boxSizing={'border-box'}
                display="flex"
                alignItems="center"
                flexGrow="1"
                gap=".5rem">
                <FolderIcon />
                <Typography>{collection.name}</Typography>
            </Box>
        </button>
    );
};

export default CollectionComponent;
