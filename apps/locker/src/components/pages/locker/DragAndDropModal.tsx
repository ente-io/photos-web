import DialogBoxV2 from '@/components/DialogBoxV2';
import { LockerUploaderContext } from '@/pages/locker';
import { Box, Typography } from '@mui/material';
import { t } from 'i18next';
import { useContext } from 'react';

interface IProps {
    show: boolean;
    onHide: () => void;
}

const DragAndDropModal = (props: IProps) => {
    const { setFilesToUpload } = useContext(LockerUploaderContext);

    return (
        <>
            <DialogBoxV2
                sx={{ zIndex: 1600 }}
                open={props.show}
                onClose={props.onHide}
                attributes={{
                    title: t('DRAG_AND_DROP'),
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                }}
                onDragEnter={(e) => {
                    e.preventDefault();
                }}
                onDragStart={(e) => {
                    e.preventDefault();
                }}
                onDrop={(e) => {
                    e.preventDefault();
                }}>
                <Box
                    width="100%"
                    height="10rem"
                    padding="1rem 0"
                    boxSizing="border-box"
                    border="3px dashed white"
                    borderRadius="0.5rem"
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        const fileList = e.dataTransfer.files;

                        const files = Array.from(fileList);

                        setFilesToUpload(files);

                        props.onHide();
                    }}>
                    <img
                        src={'/images/drag-and-drop/icon.webp'}
                        alt=""
                        style={{
                            height: '100%',
                            width: '100%',
                            objectFit: 'contain',
                        }}
                    />
                </Box>
                <Typography textAlign="center">
                    {t('DRAG_YOUR_FILES_HERE')}
                </Typography>
            </DialogBoxV2>
        </>
    );
};

export default DragAndDropModal;
