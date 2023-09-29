import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { useContext, useMemo, useState } from 'react';
import { LockerDashboardContext } from '@/pages/locker';
import { t } from 'i18next';
import { FILE_SORT_DIRECTION, FILE_SORT_FIELD } from '@/interfaces/sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { ExplorerItem } from '@/interfaces/explorer';
import ExplorerRow from './ExplorerRow';

const fileDataCategories = [
    {
        name: 'Name',
        sortFieldEnum: FILE_SORT_FIELD.NAME,
    },
    {
        name: 'Date Added',
        sortFieldEnum: FILE_SORT_FIELD.DATE_ADDED,
    },
    {
        name: 'Size',
        sortFieldEnum: FILE_SORT_FIELD.SIZE,
    },
    {
        name: 'Kind',
        sortFieldEnum: FILE_SORT_FIELD.FILE_TYPE,
    },
];

const ExplorerSection = () => {
    const {
        filteredFiles,
        currentCollection,
        uncategorizedCollection,
        // fileSortDirection,
        // fileSortField,
        // setFileSortDirection,
        // setFileSortField,
        collections,
    } = useContext(LockerDashboardContext);

    const [sortField, setSortField] = useState<FILE_SORT_FIELD>(
        FILE_SORT_FIELD.DATE_ADDED
    );
    const [sortDirection, setSortDirection] = useState<FILE_SORT_DIRECTION>(
        FILE_SORT_DIRECTION.DESC
    );

    const explorerItems = useMemo(() => {
        let explorerItems: ExplorerItem[] = [];

        for (const file of filteredFiles) {
            let newExplorerItem: ExplorerItem = {
                name: file.metadata.title,
                id: file.id,
                type: 'file',
                creationTime: file.metadata.creationTime,
                size: file.info.fileSize,
                originalItem: file,
            };

            explorerItems.push(newExplorerItem);
        }

        if (currentCollection?.id === uncategorizedCollection?.id) {
            for (const collection of collections) {
                let newExplorerItem: ExplorerItem = {
                    name: collection.name,
                    id: collection.id,
                    type: 'collection',
                    creationTime: collection.updationTime,
                    size: 0,
                    originalItem: collection,
                };

                explorerItems.push(newExplorerItem);
            }
        }

        switch (sortField) {
            case FILE_SORT_FIELD.SIZE:
                explorerItems = explorerItems.sort((a, b) => {
                    return a.size - b.size;
                });
                break;
            case FILE_SORT_FIELD.NAME:
                explorerItems = explorerItems.sort((a, b) => {
                    return a.name.localeCompare(b.name);
                });
                break;
            case FILE_SORT_FIELD.DATE_ADDED:
                explorerItems = explorerItems.sort((a, b) => {
                    return a.creationTime - b.creationTime;
                });
            default:
                break;
        }

        if (sortDirection === FILE_SORT_DIRECTION.DESC) {
            explorerItems.reverse();
        }

        return explorerItems;
    }, [filteredFiles, collections, sortField, sortDirection]);

    return (
        <>
            {/* <h3>
                {currentCollection?.id === uncategorizedCollection?.id &&
                    t('UNCATEGORIZED')}{' '}
                {t('FILES')}
            </h3> */}
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} size="medium">
                    <TableHead>
                        <TableRow>
                            {fileDataCategories.map((category) => (
                                <TableCell
                                    key={category.sortFieldEnum}
                                    align="left"
                                    onClick={() => {
                                        setSortField(category.sortFieldEnum);
                                        setSortDirection(
                                            sortDirection ===
                                                FILE_SORT_DIRECTION.ASC
                                                ? FILE_SORT_DIRECTION.DESC
                                                : FILE_SORT_DIRECTION.ASC
                                        );
                                    }}
                                    sx={{
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                    }}>
                                    {category.name}
                                    {sortField === category.sortFieldEnum &&
                                        ((sortDirection ===
                                            FILE_SORT_DIRECTION.ASC && (
                                            <ArrowUpwardIcon />
                                        )) ||
                                            (sortDirection ===
                                                FILE_SORT_DIRECTION.DESC && (
                                                <ArrowDownwardIcon />
                                            )))}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {explorerItems.map((item, index) => (
                            <ExplorerRow
                                item={item}
                                key={item.id}
                                index={index}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

export default ExplorerSection;
