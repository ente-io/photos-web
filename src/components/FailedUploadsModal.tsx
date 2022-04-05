import { FileUploadResults } from 'constants/upload';
import React, { useEffect, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import ImportService from 'services/importService';
import constants from 'utils/strings/constants';
import {
    NotUploadSectionHeader,
    ResultSection,
} from './pages/gallery/UploadProgress';

export default function FailedUploadsModal({
    failedUploadsView,
    setFailedUploadsView,
    isPendingDesktopUpload,
    setElectronFiles,
}) {
    const [files, setFiles] = useState([]);
    const [fileUploadResultMap, setFileUploadResultMap] = useState<
        Map<FileUploadResults, number[]>
    >(new Map());
    const [fileNames, setFileNames] = useState<Map<number, string>>(new Map());

    useEffect(() => {
        const main = async () => {
            const filesWithResults = await ImportService.getFailedFiles();
            const failedFiles = filesWithResults.map(
                (fileWithResult) => fileWithResult.file
            );
            if (failedFiles?.length > 0) {
                setFiles(failedFiles);
                const newFileNames = new Map<number, string>();
                const newFileUploadResultMap = new Map<
                    FileUploadResults,
                    number[]
                >();
                let index = 0;
                for (const fileWithResult of filesWithResults) {
                    const file = fileWithResult.file;
                    const fileUploadResult = fileWithResult.fileUploadResult;
                    const fileIndex = index++;
                    if (newFileUploadResultMap.has(fileUploadResult)) {
                        newFileUploadResultMap
                            .get(fileUploadResult)
                            .push(fileIndex);
                    } else {
                        newFileUploadResultMap.set(fileUploadResult, [
                            fileIndex,
                        ]);
                    }
                    newFileNames.set(fileIndex, file.name);
                }
                setFileNames(newFileNames);
                setFileUploadResultMap(newFileUploadResultMap);
            } else {
                setFiles([]);
                setFileNames(new Map());
                setFileUploadResultMap(new Map());
            }
        };
        if (failedUploadsView) {
            main();
        }
    }, [failedUploadsView]);

    return (
        <Modal
            show={failedUploadsView}
            onHide={() => setFailedUploadsView(false)}
            aria-labelledby="contained-modal-title-vcenter"
            centered
            backdrop={true}>
            <Modal.Header
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    textAlign: 'center',
                    borderBottom: 'none',
                    paddingTop: '30px',
                    paddingBottom: '0px',
                }}
                closeButton>
                <h4 style={{ width: '100%' }}>
                    <b>{constants.FAILED_UPLOADS_HEADING}</b>
                </h4>
            </Modal.Header>
            <Modal.Body>
                {files.length > 0 ? (
                    <>
                        <NotUploadSectionHeader>
                            {constants.PREVIOUSLY_NOT_UPLOADED_FILES}
                        </NotUploadSectionHeader>
                        <ResultSection
                            filenames={fileNames}
                            fileUploadResultMap={fileUploadResultMap}
                            fileUploadResult={FileUploadResults.FAILED}
                            sectionTitle={
                                constants.FAILED_UPLOADS +
                                ' (' +
                                (fileUploadResultMap.get(
                                    FileUploadResults.FAILED
                                )?.length ?? 0) +
                                ')'
                            }
                        />
                        <ResultSection
                            filenames={fileNames}
                            fileUploadResultMap={fileUploadResultMap}
                            fileUploadResult={FileUploadResults.BLOCKED}
                            sectionTitle={
                                constants.BLOCKED_UPLOADS +
                                ' (' +
                                (fileUploadResultMap.get(
                                    FileUploadResults.BLOCKED
                                )?.length ?? 0) +
                                ')'
                            }
                        />
                        <Button
                            variant="outline-success"
                            style={{ width: '100%' }}
                            onClick={() => {
                                if (files.length > 0) {
                                    isPendingDesktopUpload.current = true;
                                    setElectronFiles(files);
                                    setFailedUploadsView(false);
                                }
                            }}>
                            {constants.RETRY_FAILED}
                        </Button>
                    </>
                ) : (
                    <div
                        style={{
                            width: '90%',
                            textAlign: 'center',
                            marginBottom: '1em',
                            fontSize: '1.3em',
                        }}>
                        {constants.NO_FAILED_UPLOADS}
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
}
