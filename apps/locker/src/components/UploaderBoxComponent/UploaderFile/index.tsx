import { Box, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { UploaderContext } from '..';
import { InProgressUpload } from 'interfaces/upload/ui';
import { UPLOAD_RESULT, UPLOAD_STAGES } from 'constants/upload';

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
            <Box
                width="100%"
                bgcolor="#3E3E3E"
                borderRadius="5px"
                paddingTop="0.5rem"
                boxSizing="border-box">
                <Box
                    paddingLeft="1rem"
                    paddingRight="1rem"
                    boxSizing="border-box"
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    gap="0.5rem">
                    <Typography
                        color="text.primary"
                        textOverflow="ellipsis"
                        overflow="hidden"
                        whiteSpace="nowrap">
                        {props.file.name}
                    </Typography>
                    <Typography
                        color="text.muted"
                        textAlign="right"
                        minWidth={'fit-content'}
                        fontStyle="italic">
                        {progress < 100 ? `${progress}%` : 'Complete (100%)'}
                    </Typography>
                </Box>
                <Box
                    width={`${progress}%`}
                    height="0.5rem"
                    borderBottom={`4px solid ${
                        progress === 100 ? '#2AB954' : '#42BDF2'
                    }`}
                    sx={{
                        borderBottomRightRadius: '5px',
                        borderBottomLeftRadius: '5px',
                    }}
                />
            </Box>
        </>
    );
};

export default UploaderFile;
