import { Dialog, DialogContent, Link } from '@mui/material';
import { t } from 'i18next';

import { UPLOAD_STAGES, UPLOAD_RESULT } from 'constants/upload';
import React, { useContext, useEffect, useState } from 'react';
import { UploadProgressFooter } from './footer';
import { UploadProgressHeader } from './header';
import { InProgressSection } from './inProgressSection';
import { ResultSection } from './resultSection';
import { NotUploadSectionHeader } from './styledComponents';
import UploadProgressContext from 'contexts/uploadProgress';
import { dialogCloseHandler } from 'components/DialogBox/TitleWithCloseButton';
import { APP_DOWNLOAD_URL } from 'constants/urls';
import { Trans } from 'react-i18next';

export function UploadProgressDialog() {
    const { open, onClose, uploadStage, finishedUploads } = useContext(
        UploadProgressContext
    );

    const [hasUnUploadedFiles, setHasUnUploadedFiles] = useState(false);

    useEffect(() => {
        if (
            finishedUploads.get(UPLOAD_RESULT.ALREADY_UPLOADED)?.length > 0 ||
            finishedUploads.get(UPLOAD_RESULT.BLOCKED)?.length > 0 ||
            finishedUploads.get(UPLOAD_RESULT.FAILED)?.length > 0 ||
            finishedUploads.get(UPLOAD_RESULT.LARGER_THAN_AVAILABLE_STORAGE)
                ?.length > 0 ||
            finishedUploads.get(UPLOAD_RESULT.TOO_LARGE)?.length > 0 ||
            finishedUploads.get(UPLOAD_RESULT.UNSUPPORTED)?.length > 0
        ) {
            setHasUnUploadedFiles(true);
        } else {
            setHasUnUploadedFiles(false);
        }
    }, [finishedUploads]);

    const handleClose = dialogCloseHandler({ staticBackdrop: true, onClose });

    return (
        <Dialog maxWidth="xs" open={open} onClose={handleClose}>
            <UploadProgressHeader />
            {(uploadStage === UPLOAD_STAGES.UPLOADING ||
                uploadStage === UPLOAD_STAGES.FINISH ||
                uploadStage === UPLOAD_STAGES.EXTRACTING_METADATA) && (
                <DialogContent sx={{ '&&&': { px: 0 } }}>
                    {(uploadStage === UPLOAD_STAGES.UPLOADING ||
                        uploadStage === UPLOAD_STAGES.EXTRACTING_METADATA) && (
                        <InProgressSection />
                    )}
                    {(uploadStage === UPLOAD_STAGES.UPLOADING ||
                        uploadStage === UPLOAD_STAGES.FINISH) && (
                        <>
                            <ResultSection
                                uploadResult={UPLOAD_RESULT.UPLOADED}
                                sectionTitle={t('SUCCESSFUL_UPLOADS')}
                            />
                            <ResultSection
                                uploadResult={
                                    UPLOAD_RESULT.UPLOADED_WITH_STATIC_THUMBNAIL
                                }
                                sectionTitle={t(
                                    'THUMBNAIL_GENERATION_FAILED_UPLOADS'
                                )}
                                sectionInfo={t(
                                    'THUMBNAIL_GENERATION_FAILED_INFO'
                                )}
                            />

                            {uploadStage === UPLOAD_STAGES.FINISH &&
                                hasUnUploadedFiles && (
                                    <NotUploadSectionHeader>
                                        {t('FILE_NOT_UPLOADED_LIST')}
                                    </NotUploadSectionHeader>
                                )}

                            <ResultSection
                                uploadResult={UPLOAD_RESULT.BLOCKED}
                                sectionTitle={t('BLOCKED_UPLOADS')}
                                sectionInfo={
                                    <Trans
                                        i18nKey={'ETAGS_BLOCKED'}
                                        components={{
                                            a: (
                                                <Link
                                                    href={APP_DOWNLOAD_URL}
                                                    target="_blank"
                                                />
                                            ),
                                        }}
                                    />
                                }
                            />
                            <ResultSection
                                uploadResult={UPLOAD_RESULT.FAILED}
                                sectionTitle={t('FAILED_UPLOADS')}
                            />
                            <ResultSection
                                uploadResult={UPLOAD_RESULT.ALREADY_UPLOADED}
                                sectionTitle={t('SKIPPED_FILES')}
                                sectionInfo={t('SKIPPED_INFO')}
                            />
                            <ResultSection
                                uploadResult={
                                    UPLOAD_RESULT.LARGER_THAN_AVAILABLE_STORAGE
                                }
                                sectionTitle={t(
                                    'LARGER_THAN_AVAILABLE_STORAGE_UPLOADS'
                                )}
                                sectionInfo={t(
                                    'LARGER_THAN_AVAILABLE_STORAGE_INFO'
                                )}
                            />
                            <ResultSection
                                uploadResult={UPLOAD_RESULT.UNSUPPORTED}
                                sectionTitle={t('UNSUPPORTED_FILES')}
                                sectionInfo={t('UNSUPPORTED_INFO')}
                            />
                            <ResultSection
                                uploadResult={UPLOAD_RESULT.TOO_LARGE}
                                sectionTitle={t('TOO_LARGE_UPLOADS')}
                                sectionInfo={t('TOO_LARGE_INFO')}
                            />
                        </>
                    )}
                </DialogContent>
            )}
            {uploadStage === UPLOAD_STAGES.FINISH && <UploadProgressFooter />}
        </Dialog>
    );
}
