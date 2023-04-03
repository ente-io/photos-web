import EmailShare from './emailShare';
import React from 'react';
import { Collection } from 'types/collection';
import { EnteDrawer } from 'components/EnteDrawer';
import PublicShare from './publicShare';
import { t } from 'i18next';
import { DialogProps, Stack } from '@mui/material';
import Titlebar from 'components/Titlebar';

interface Props {
    open: boolean;
    onClose: () => void;
    collection: Collection;
}

function CollectionShare(props: Props) {
    const handleRootClose = () => {
        props.onClose();
    };
    const handleDrawerClose: DialogProps['onClose'] = (_, reason) => {
        if (reason === 'backdropClick') {
            handleRootClose();
        } else {
            props.onClose();
        }
    };
    if (!props.collection) {
        return <></>;
    }

    return (
        <>
            <EnteDrawer
                anchor="right"
                open={props.open}
                onClose={handleDrawerClose}
                BackdropProps={{
                    sx: { '&&&': { backgroundColor: 'transparent' } },
                }}>
                <Stack spacing={'4px'} py={'12px'}>
                    <Titlebar
                        onClose={props.onClose}
                        title={t('SHARE_COLLECTION')}
                        onRootClose={handleRootClose}
                    />
                    <Stack spacing={'24px'} py={'20px'} px={'8px'}>
                        <EmailShare
                            collection={props.collection}
                            onRootClose={handleRootClose}
                        />
                        <PublicShare
                            collection={props.collection}
                            onRootClose={handleRootClose}
                        />
                    </Stack>
                </Stack>
            </EnteDrawer>
        </>
    );
}
export default CollectionShare;
