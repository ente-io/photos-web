import { Box } from '@mui/material';
import CollectionComponent from './Collection';
import { LockerDashboardContext } from '@/pages/locker';
import { useContext, useMemo } from 'react';
import { t } from 'i18next';

const CollectionsSection = () => {
    const { collections, uncategorizedCollection, nameSearchQuery } =
        useContext(LockerDashboardContext);

    const filteredCollections = useMemo(() => {
        if (nameSearchQuery.trim().length < 1) return collections;

        return collections.filter((collection) =>
            collection.name
                .toLowerCase()
                .includes(nameSearchQuery.toLowerCase())
        );
    }, [nameSearchQuery, collections]);

    return (
        <>
            <h3>{t('SUB_LOCKERS')}</h3>
            <Box gap="1rem" flexWrap="wrap" display="flex">
                {filteredCollections
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
