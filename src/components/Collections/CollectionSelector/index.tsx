import React, { forwardRef, Ref, useContext, useEffect, useMemo } from 'react';
import { Collection, CollectionSummaries } from 'types/collection';
import DialogTitleWithCloseButton from 'components/DialogBox/TitleWithCloseButton';
import { isUploadAllowedCollection } from 'utils/collection';
import { AppContext } from 'pages/_app';
import { AllCollectionDialog } from 'components/Collections/AllCollections/dialog';
import { DialogContent } from '@mui/material';
import { FlexWrapper } from 'components/Container';
import CollectionSelectorCard from './CollectionCard';
import AddCollectionButton from './AddCollectionButton';
import {
    ImperativeDialog,
    useImperativeDialog,
} from 'hooks/useImperativeDialog';
import { CustomError } from 'utils/error';
import { logError } from 'utils/sentry';
import { UPLOAD_STRATEGY } from 'constants/upload';

export interface CollectionSelectorAttributes {
    showNextModal: () => Promise<string | UPLOAD_STRATEGY | Collection>;
    title: string;
    fromCollection?: number;
}

interface Props {
    collections: Collection[];
    collectionSummaries: CollectionSummaries;
}

export type ICollectionSelector = ImperativeDialog<
    CollectionSelectorAttributes,
    string | Collection | UPLOAD_STRATEGY
>;

function CollectionSelector(
    { collectionSummaries, collections }: Props,
    ref: Ref<ICollectionSelector>
) {
    const appContext = useContext(AppContext);

    const { isOpen, onClickHandler, onClose, attributes } =
        useImperativeDialog(ref);

    const collectionToShow = useMemo(() => {
        const personalCollectionsOtherThanFrom = [
            ...collectionSummaries.values(),
        ]?.filter(
            ({ type, id }) =>
                id !== attributes?.fromCollection &&
                isUploadAllowedCollection(type)
        );
        return personalCollectionsOtherThanFrom;
    }, [collectionSummaries, attributes]);

    useEffect(() => {
        if (!attributes || !isOpen) {
            return;
        }
        if (collectionToShow.length === 0) {
            handleAddCollectionClick();
        }
    }, [collectionToShow, attributes, isOpen]);

    if (!attributes) {
        return <></>;
    }

    const handleCollectionClick = (collectionID: number) => {
        const collection = collections.find((c) => c.id === collectionID);
        onClickHandler(collection)();
    };

    const handleAddCollectionClick = async () => {
        try {
            const response = await attributes.showNextModal();
            onClickHandler(response)();
        } catch (e) {
            if (e.message !== CustomError.REQUEST_CANCELLED) {
                logError(e, 'handle add collection click failed');
                throw e;
            }
        }
    };

    return (
        <AllCollectionDialog
            onClose={onClose}
            open={isOpen}
            position="center"
            fullScreen={appContext.isMobile}>
            <DialogTitleWithCloseButton onClose={onClose}>
                {attributes.title}
            </DialogTitleWithCloseButton>
            <DialogContent>
                <FlexWrapper flexWrap="wrap" gap={0.5}>
                    <AddCollectionButton
                        showNextModal={handleAddCollectionClick}
                    />
                    {collectionToShow.map((collectionSummary) => (
                        <CollectionSelectorCard
                            onCollectionClick={handleCollectionClick}
                            collectionSummary={collectionSummary}
                            key={collectionSummary.id}
                        />
                    ))}
                </FlexWrapper>
            </DialogContent>
        </AllCollectionDialog>
    );
}

export default forwardRef(CollectionSelector);
