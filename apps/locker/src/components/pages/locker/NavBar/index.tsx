import { Box } from '@mui/material';
import { borderProperty } from '@/constants/ui/locker/border';
import NavBarLeft from './NavBarLeft';
import NavBarRight from './NavBarRight';
const NavBar = () => {
    return (
        <>
            <Box
                sx={{
                    padding: '1rem',
                    borderBottom: borderProperty,
                    display: 'flex',
                    justifyContent: 'space-between',
                }}>
                <NavBarLeft />
                <NavBarRight />
            </Box>
        </>
    );
};

export default NavBar;
