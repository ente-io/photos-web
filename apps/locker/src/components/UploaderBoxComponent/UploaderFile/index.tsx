import { Box, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { UploaderContext } from '..';
import { InProgressUpload } from '@/interfaces/upload/ui';
import { UPLOAD_RESULT, UPLOAD_STAGES } from '@/constants/upload';

interface IProps {
    localID: number;
    file: File;
}

const UploaderFile = (props: IProps) => {
    const { inProgressUploads, finishedUploads, uploadStage } =
        useContext(UploaderContext);

    const [currentInProgressUpload, setCurrentInProgressUpload] =
        useState<InProgressUpload | null>(null);

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const inProgressUpload = inProgressUploads.find(
            (upload) => upload.localFileID === props.localID
        );
        if (inProgressUpload) {
            setCurrentInProgressUpload(inProgressUpload);
        }
    }, [props.localID, inProgressUploads]);

    useEffect(() => {
        if (currentInProgressUpload) {
            if (uploadStage === UPLOAD_STAGES.FINISH) {
                setProgress(100);
                return;
            }

            if (finishedUploads?.get(UPLOAD_RESULT.UPLOADED)) {
                // if it's finished, set to 100
                if (
                    finishedUploads
                        .get(UPLOAD_RESULT.UPLOADED)
                        ?.includes(props.localID)
                ) {
                    setProgress(100);
                    return;
                }
            }

            setProgress(currentInProgressUpload.progress);
        }
    }, [currentInProgressUpload, finishedUploads, props.localID, uploadStage]);

    return (
        <>
            <Box width="100%">
                <Box
                    paddingLeft="1rem"
                    paddingRight="1rem"
                    boxSizing="border-box">
                    <Typography color="text.primary">
                        {props.file.name}
                    </Typography>
                </Box>
                <Box
                    width={`${progress}%`}
                    height="0.5rem"
                    borderBottom={`1px solid ${
                        progress === 100 ? '#2AB954' : '#42BDF2'
                    }`}
                />
            </Box>
        </>
    );
};

export default UploaderFile;
