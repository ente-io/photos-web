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
import FileComponent from './File';
import { useContext } from 'react';
import { LockerDashboardContext } from '@/pages/locker';
import { t } from 'i18next';
import { FILE_SORT_DIRECTION, FILE_SORT_FIELD } from '@/interfaces/sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

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

const FilesSection = () => {
    const {
        filteredFiles,
        currentCollection,
        uncategorizedCollection,
        fileSortDirection,
        fileSortField,
        setFileSortDirection,
        setFileSortField,
    } = useContext(LockerDashboardContext);

    return (
        <>
            <h3>
                {currentCollection?.id === uncategorizedCollection?.id &&
                    t('UNCATEGORIZED')}{' '}
                {t('FILES')}
            </h3>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} size="medium">
                    <TableHead>
                        <TableRow>
                            {fileDataCategories.map((category) => (
                                <TableCell
                                    key={category.sortFieldEnum}
                                    align="left"
                                    onClick={() => {
                                        setFileSortField(
                                            category.sortFieldEnum
                                        );
                                        setFileSortDirection(
                                            fileSortDirection ===
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
                                    {fileSortField === category.sortFieldEnum &&
                                        ((fileSortDirection ===
                                            FILE_SORT_DIRECTION.ASC && (
                                            <ArrowUpwardIcon />
                                        )) ||
                                            (fileSortDirection ===
                                                FILE_SORT_DIRECTION.DESC && (
                                                <ArrowDownwardIcon />
                                            )))}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredFiles.map((file, index) => (
                            <FileComponent
                                file={file}
                                key={file.id}
                                index={index}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

export default FilesSection;
