import { TextField } from '@mui/material';
import { SearchBarWrapper, SearchInputWrapper } from './styledComponents';
import { useContext } from 'react';
import { LockerDashboardContext } from '@/pages/locker';

const SearchBar = () => {
    const { nameSearchQuery, setNameSearchQuery } = useContext(
        LockerDashboardContext
    );

    return (
        <>
            <TextField
                variant="outlined"
                value={nameSearchQuery}
                onChange={(e) => setNameSearchQuery(e.target.value)}
            />
            {/* <SearchBarWrapper>
                <SearchInputWrapper isOpen={true}>
                </SearchInputWrapper>
            </SearchBarWrapper> */}
        </>
    );
};

export default SearchBar;
