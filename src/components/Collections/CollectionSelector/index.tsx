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

export interface CollectionSelectorAttributes {
    showNextModal: () => void;
    title: string;
    fromCollection?: number;
}

interface Props {
    collections: Collection[];
    collectionSummaries: CollectionSummaries;
}

export type ICollectionSelector = ImperativeDialog<
    CollectionSelectorAttributes,
    Collection
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
            onClose();
            attributes.showNextModal();
        }
    }, [collectionToShow, attributes, isOpen]);

    if (!attributes) {
        return <></>;
    }

    const handleCollectionClick = (collectionID: number) => {
        const collection = collections.find((c) => c.id === collectionID);
        onClickHandler(collection)();
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
                        showNextModal={attributes.showNextModal}
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
