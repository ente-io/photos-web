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
        // filteredFiles,
        // currentCollection,
        // uncategorizedCollection,
        // fileSortDirection,
        // fileSortField,
        // setFileSortDirection,
        // setFileSortField,
        sortField,
        sortDirection,
        setSortDirection,
        setSortField,
        // collections,
        explorerItems,
    } = useContext(LockerDashboardContext);

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
