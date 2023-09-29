import { Box } from '@mui/material';
import { borderProperty } from '@/constants/ui/locker/border';
import NavBarLeft from './NavBarLeft';
import NavBarRight from './NavBarRight';
import NavBarMiddle from './NavBarMiddle';
const NavBar = () => {
    return (
        <>
            <Box
                sx={{
                    padding: '0.5rem',
                    borderBottom: borderProperty,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    backgroundColor: 'rgb(0,0,0, 0.75)',
                    position: 'fixed',
                    backdropFilter: 'blur(5px)',
                    width: '100%',
                    boxSizing: 'border-box',
                    '@media only screen and (max-width: 800px)': {
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                    },
                }}>
                <NavBarLeft />
                <NavBarMiddle />
                <NavBarRight />
            </Box>
        </>
    );
};

export default NavBar;
