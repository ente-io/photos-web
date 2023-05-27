import { Box, IconButton } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import { borderProperty } from '@/constants/ui/locker/border';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import FileUploadIcon from '@mui/icons-material/FileUpload';

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
                <Link href="/locker">
                    <Image
                        src="/locker.svg"
                        alt="ente Locker logo"
                        width={200}
                        height={50}
                    />
                </Link>
                <Box>
                    <IconButton>
                        <CreateNewFolderIcon />
                    </IconButton>
                    <IconButton>
                        <FileUploadIcon />
                    </IconButton>
                </Box>
            </Box>
        </>
    );
};

export default NavBar;
