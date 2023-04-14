import { EnteMenuItem } from 'components/Menu/menuItem';
import { AppContext } from 'pages/_app';
import React, { useContext } from 'react';
import { Trans } from 'react-i18next';
import { t } from 'i18next';
import { PublicURL, Collection, UpdatePublicURL } from 'types/collection';
interface Iprops {
    publicShareProp: PublicURL;
    collection: Collection;
    updatePublicShareURLHelper: (req: UpdatePublicURL) => Promise<void>;
}

export function ManageDownloadAccess({
    publicShareProp,
    updatePublicShareURLHelper,
    collection,
}: Iprops) {
    const appContext = useContext(AppContext);

    const handleFileDownloadSetting = () => {
        if (publicShareProp.enableDownload) {
            disableFileDownload();
        } else {
            updatePublicShareURLHelper({
                collectionID: collection.id,
                enableDownload: true,
            });
        }
    };

    const disableFileDownload = () => {
        appContext.setDialogMessage({
            title: t('DISABLE_FILE_DOWNLOAD'),
            content: <Trans i18nKey={'DISABLE_FILE_DOWNLOAD_MESSAGE'} />,
            close: { text: t('CANCEL') },
            proceed: {
                text: t('DISABLE'),
                action: () =>
                    updatePublicShareURLHelper({
                        collectionID: collection.id,
                        enableDownload: false,
                    }),
                variant: 'danger',
            },
        });
    };
    return (
        <EnteMenuItem
            checked={publicShareProp?.enableDownload ?? true}
            onClick={handleFileDownloadSetting}
            hasSwitch>
            {t('FILE_DOWNLOAD')}
        </EnteMenuItem>
    );
}
