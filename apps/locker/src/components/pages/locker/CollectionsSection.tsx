import { Box } from '@mui/material';
import CollectionComponent from './Collection';
import { LockerDashboardContext } from '@/pages/locker';
import { useContext } from 'react';

const CollectionsSection = () => {
    const { collections, uncategorizedCollection } = useContext(
        LockerDashboardContext
    );

    return (
        <>
            <h3>Collections</h3>
            <Box gap="1rem" flexWrap="wrap" display="flex">
                {collections
                    .filter((r) => r.id !== uncategorizedCollection?.id)
                    .map((collection) => (
                        <CollectionComponent
                            collection={collection}
                            key={collection.id}
                        />
                    ))}
            </Box>
        </>
    );
};

export default CollectionsSection;
