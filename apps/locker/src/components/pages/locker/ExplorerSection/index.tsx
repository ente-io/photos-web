import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
} from '@mui/material';
import { useContext, useEffect } from 'react';
import { LockerDashboardContext } from 'pages/locker';
import { FILE_SORT_DIRECTION, FILE_SORT_FIELD } from 'interfaces/sort';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ExplorerRow from './ExplorerRow';
import { Collection } from 'interfaces/collection';
import { t } from 'i18next';
import { visuallyHidden } from '@mui/utils';

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
        selectedExplorerItems,
        setSelectedExplorerItems,
        setCurrentCollection,
    } = useContext(LockerDashboardContext);

    const upKeyHandler = (currentSelectedIndex: number) => {
        if (currentSelectedIndex === 0) return;
        setSelectedExplorerItems([explorerItems[currentSelectedIndex - 1]]);
    };

    const downKeyHandler = (currentSelectedIndex: number) => {
        if (currentSelectedIndex === explorerItems.length - 1) return;
        setSelectedExplorerItems([explorerItems[currentSelectedIndex + 1]]);
    };

    const fileDataCategories = [
        {
            name: t('SORT_BY_NAME'),
            sortFieldEnum: FILE_SORT_FIELD.NAME,
        },
        {
            name: t('LAST_MODIFIED'),
            sortFieldEnum: FILE_SORT_FIELD.LAST_MODIFIED,
        },
        {
            name: t('SIZE'),
            sortFieldEnum: FILE_SORT_FIELD.SIZE,
        },
        {
            name: t('FILE_KIND'),
            sortFieldEnum: FILE_SORT_FIELD.FILE_TYPE,
        },
    ];

    useEffect(() => {
        const keydownHandler = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                if (selectedExplorerItems.length !== 1) return;

                if (selectedExplorerItems[0].type === 'collection') {
                    setCurrentCollection(
                        selectedExplorerItems[0].originalItem as Collection
                    );
                    return;
                }
            }

            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

            if (selectedExplorerItems.length !== 1) {
                if (explorerItems.length > 0) {
                    setSelectedExplorerItems([explorerItems[0]]);
                }
                return;
            }

            const currentSelectedIndex = explorerItems.findIndex(
                (item) => item.id === selectedExplorerItems[0].id
            );

            if (event.key === 'ArrowUp') {
                upKeyHandler(currentSelectedIndex);
            } else if (event.key === 'ArrowDown') {
                downKeyHandler(currentSelectedIndex);
            }
        };

        window.addEventListener('keydown', keydownHandler);

        return () => {
            window.removeEventListener('keydown', keydownHandler);
        };
    }, [explorerItems, selectedExplorerItems]);

    return (
        <>
            {/* <h3>
                {currentCollection?.id === uncategorizedCollection?.id &&
                    t('UNCATEGORIZED')}{' '}
                {t('FILES')}
            </h3> */}
            <TableContainer component={Paper}>
                <Table sx={{ width: '100%' }} size="medium">
                    <TableHead>
                        <TableRow>
                            {fileDataCategories.map((category) => (
                                <TableCell
                                    key={category.sortFieldEnum}
                                    align="left"
                                    sx={{
                                        cursor: 'pointer',
                                        fontWeight:
                                            sortField === category.sortFieldEnum
                                                ? 'bold'
                                                : 'normal',
                                    }}>
                                    <TableSortLabel
                                        active={
                                            sortField === category.sortFieldEnum
                                        }
                                        direction={
                                            sortDirection ===
                                            FILE_SORT_DIRECTION.DESC
                                                ? 'desc'
                                                : 'asc'
                                        }
                                        onClick={() => {
                                            setSortField(
                                                category.sortFieldEnum
                                            );
                                            setSortDirection(
                                                sortDirection ===
                                                    FILE_SORT_DIRECTION.ASC
                                                    ? FILE_SORT_DIRECTION.DESC
                                                    : FILE_SORT_DIRECTION.ASC
                                            );
                                        }}>
                                        {category.name}
                                        {sortField ===
                                        category.sortFieldEnum ? (
                                            <Box
                                                component="span"
                                                sx={visuallyHidden}>
                                                {sortDirection ===
                                                FILE_SORT_DIRECTION.DESC
                                                    ? 'sorted descending'
                                                    : 'sorted ascending'}
                                            </Box>
                                        ) : null}
                                    </TableSortLabel>
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
