import { TextField } from '@mui/material';
import { useContext } from 'react';
import { LockerDashboardContext } from 'pages/locker';
import { t } from 'i18next';

const SearchBar = () => {
    const { nameSearchQuery, setNameSearchQuery } = useContext(
        LockerDashboardContext
    );

    return (
        <>
            <TextField
                variant="outlined"
                value={nameSearchQuery}
                size="small"
                sx={{
                    width: '20rem',
                }}
                placeholder={t('LOCKER_SEARCH_HINT')}
                onChange={(e) => setNameSearchQuery(e.target.value)}
            />
        </>
    );
};

export default SearchBar;
