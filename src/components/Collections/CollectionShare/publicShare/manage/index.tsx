import { ManageLinkPassword } from './linkPassword';
import { ManageDeviceLimit } from './deviceLimit';
import { ManageLinkExpiry } from './linkExpiry';
import { PublicLinkSetPassword } from '../setPassword';
import { Stack, Typography } from '@mui/material';
import { GalleryContext } from 'pages/gallery';
import React, { useContext, useState } from 'react';
import { updateShareableURL } from 'services/collectionService';
import { UpdatePublicURL } from 'types/collection';
import { sleep } from 'utils/common';
import constants from 'utils/strings/constants';
import {
    ManageSectionLabel,
    ManageSectionOptions,
} from '../../styledComponents';
import { ManageDownloadAccess } from './downloadAccess';
import { handleSharingErrors } from 'utils/error/ui';

export default function PublicShareManage({
    publicShareProp,
    collection,
    setPublicShareProp,
}) {
    const galleryContext = useContext(GalleryContext);

    const [changePasswordView, setChangePasswordView] = useState(false);
    const [sharableLinkError, setSharableLinkError] = useState(null);

    const closeConfigurePassword = () => setChangePasswordView(false);

    const updatePublicShareURLHelper = async (req: UpdatePublicURL) => {
        try {
            galleryContext.setBlockingLoad(true);
            const response = await updateShareableURL(req);
            setPublicShareProp(response);
        } catch (e) {
            const errorMessage = handleSharingErrors(e);
            setSharableLinkError(errorMessage);
        } finally {
            galleryContext.setBlockingLoad(false);
        }
    };

    const scrollToEnd = (e) => {
        const lastOptionRow: Element =
            e.currentTarget.nextElementSibling.lastElementChild;
        const main = async (lastOptionRow: Element) => {
            await sleep(0);
            lastOptionRow.scrollIntoView(true);
        };
        main(lastOptionRow);
    };

    return (
        <>
            <details>
                <ManageSectionLabel onClick={scrollToEnd}>
                    {constants.MANAGE_LINK}
                </ManageSectionLabel>
                <ManageSectionOptions>
                    <Stack spacing={1.5}>
                        <ManageLinkExpiry
                            collection={collection}
                            publicShareProp={publicShareProp}
                            updatePublicShareURLHelper={
                                updatePublicShareURLHelper
                            }
                        />
                        <ManageDeviceLimit
                            collection={collection}
                            publicShareProp={publicShareProp}
                            updatePublicShareURLHelper={
                                updatePublicShareURLHelper
                            }
                        />
                        <ManageDownloadAccess
                            collection={collection}
                            publicShareProp={publicShareProp}
                            updatePublicShareURLHelper={
                                updatePublicShareURLHelper
                            }
                        />
                        <ManageLinkPassword
                            setChangePasswordView={setChangePasswordView}
                            collection={collection}
                            publicShareProp={publicShareProp}
                            updatePublicShareURLHelper={
                                updatePublicShareURLHelper
                            }
                        />
                    </Stack>
                    {sharableLinkError && (
                        <Typography
                            textAlign={'center'}
                            variant="body2"
                            sx={{
                                color: (theme) => theme.palette.danger.main,
                                mt: 0.5,
                            }}>
                            {sharableLinkError}
                        </Typography>
                    )}
                </ManageSectionOptions>
            </details>
            <PublicLinkSetPassword
                open={changePasswordView}
                onClose={closeConfigurePassword}
                collection={collection}
                publicShareProp={publicShareProp}
                updatePublicShareURLHelper={updatePublicShareURLHelper}
                setChangePasswordView={setChangePasswordView}
            />
        </>
    );
}
