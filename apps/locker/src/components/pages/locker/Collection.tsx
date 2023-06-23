import { Collection } from '@/interfaces/collection';
import { LockerDashboardContext } from '@/pages/locker';
import { Box, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import FolderIcon from '@mui/icons-material/Folder';

const CollectionComponent = ({
    collection,
    sx = '',
    focus = false,
    onClick,
}: {
    collection: Collection;
    sx?: any;
    focus?: boolean;
    onClick?: () => void;
}) => {
    const { setCurrentCollection } = useContext(LockerDashboardContext);

    const bgColor = `#1C1C1C`;
    const bgColorSelected = `#1DB954`;

    return (
        <button
            style={{ all: 'unset', cursor: 'pointer', width: 'fit-content' }}
            onDoubleClick={() => {
                setCurrentCollection(collection);
            }}
            onClick={onClick}>
            <Box
                bgcolor={focus ? bgColorSelected : bgColor}
                width="auto"
                height="3rem"
                borderRadius="10px"
                padding="1rem"
                boxSizing={'border-box'}
                display="flex"
                alignItems="center"
                flexGrow="1"
                gap=".5rem"
                sx={sx}>
                <FolderIcon />
                <Typography>{collection.name}</Typography>
            </Box>
        </button>
    );
};

export default CollectionComponent;
