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

const FilesSection = () => {
    const { filteredFiles, currentCollection, uncategorizedCollection } =
        useContext(LockerDashboardContext);

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
                            <TableCell> </TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Date Added</TableCell>
                            <TableCell>Size</TableCell>
                            <TableCell>Kind</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredFiles.map((file) => (
                            <FileComponent file={file} key={file.id} />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

export default FilesSection;
