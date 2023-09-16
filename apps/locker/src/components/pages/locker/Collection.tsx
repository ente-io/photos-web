import { Collection } from '@/interfaces/collection';
import { LockerDashboardContext } from '@/pages/locker';
import { Box, Typography } from '@mui/material';
import { useContext, useMemo, useState } from 'react';
import FolderIcon from '@mui/icons-material/Folder';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

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
    const {
        setCurrentCollection,
        selectedCollections,
        setSelectedCollections,
        selectedFiles,
        setSelectedFiles,
    } = useContext(LockerDashboardContext);

    const [isHover, setIsHover] = useState(false);

    const bgColor = `#1C1C1C`;
    const bgColorHover = `#282828`;
    const bgColorSelected = `#1DB954`;

    const isSelected = useMemo(() => {
        return selectedCollections.find(
            (selectedCollection) => selectedCollection.id === collection.id
        );
    }, [selectedCollections, collection]);

    return (
        <Box
            bgcolor={focus ? bgColorSelected : bgColor}
            width="auto"
            height="3rem"
            borderRadius="10px"
            padding="1rem"
            boxSizing={'border-box'}
            display="flex"
            alignItems="center"
            gap=".5rem"
            sx={{
                ...sx,
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: bgColorHover,
                },
                userSelect: 'none',
            }}
            onMouseEnter={() => {
                setIsHover(true);
            }}
            onMouseLeave={() => {
                setIsHover(false);
            }}
            onDoubleClick={() => {
                setCurrentCollection(collection);
            }}
            onClick={() => {
                if (onClick) {
                    onClick();
                    return;
                }
                if (selectedFiles.length > 0) {
                    setSelectedFiles([]);
                }
                if (isSelected) {
                    setSelectedCollections(
                        selectedCollections.filter(
                            (selectedCollection) =>
                                selectedCollection.id !== collection.id
                        )
                    );
                } else {
                    setSelectedCollections([
                        ...selectedCollections,
                        collection,
                    ]);
                }
            }}>
            {isHover || selectedCollections.length > 0 ? (
                <>
                    {isSelected ? (
                        <CheckBoxIcon color="accent" />
                    ) : (
                        <CheckBoxOutlineBlankIcon />
                    )}
                </>
            ) : (
                <FolderIcon />
            )}
            <Typography>{collection.name}</Typography>
        </Box>
    );
};

export default CollectionComponent;
