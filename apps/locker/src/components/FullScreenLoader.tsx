import { Box } from '@mui/material';
import EnteSpinner from './EnteSpinner';

const FullScreenLoader = () => {
    return (
        <>
            <Box
                width="100%"
                height="100%"
                position="fixed"
                top={0}
                right={0}
                zIndex="9999 !important"
                bgcolor="black"
                display="flex"
                justifyContent="center"
                alignItems="center">
                <EnteSpinner />
            </Box>
        </>
    );
};

export default FullScreenLoader;
