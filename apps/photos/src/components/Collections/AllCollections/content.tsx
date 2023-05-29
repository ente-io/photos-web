import React, { useEffect, useRef, useState } from 'react';
import { DialogContent } from '@mui/material';
import { FlexWrapper } from 'components/Container';
import AllCollectionCard from './collectionCard';
import { CollectionSummary } from 'types/collection';
import {
    FixedSizeList as List,
    ListChildComponentProps,
    areEqual,
} from 'react-window';
import memoize from 'memoize-one';
import useWindowSize from 'hooks/useWindowSize';
import { AllCollectionMobileBreakpoint } from './dialog';

const MobileColumns = 2;
const DesktopColumns = 3;

interface Iprops {
    collectionSummaries: CollectionSummary[];
    onCollectionClick: (id?: number) => void;
}

interface ItemData {
    collectionRowList: CollectionSummary[][];
    onCollectionClick: (id?: number) => void;
}

// This helper function memoizes incoming props,
// To avoid causing unnecessary re-renders pure Row components.
// This is only needed since we are passing multiple props with a wrapper object.
// If we were only passing a single, stable value (e.g. items),
// We could just pass the value directly.
const createItemData = memoize((collectionRowList, onCollectionClick) => ({
    collectionRowList,
    onCollectionClick,
}));

//If list items are expensive to render,
// Consider using React.memo or shouldComponentUpdate to avoid unnecessary re-renders.
// https://reactjs.org/docs/react-api.html#reactmemo
// https://reactjs.org/docs/react-api.html#reactpurecomponent
const AllCollectionRow = React.memo(
    ({
        data,
        index,
        style,
        isScrolling,
    }: ListChildComponentProps<ItemData>) => {
        const { collectionRowList, onCollectionClick } = data;
        const collectionRow = collectionRowList[index];
        return (
            <div style={style}>
                <FlexWrapper gap={0.5}>
                    {collectionRow.map((item: any) => (
                        <AllCollectionCard
                            isScrolling={isScrolling}
                            onCollectionClick={onCollectionClick}
                            collectionSummary={item}
                            key={item.id}
                        />
                    ))}
                </FlexWrapper>
            </div>
        );
    },
    areEqual
);

export default function AllCollectionContent({
    collectionSummaries,
    onCollectionClick,
}: Iprops) {
    const refreshInProgress = useRef(false);
    const shouldRefresh = useRef(false);

    const [collectionRowList, setCollectionRowList] = useState([]);

    const windowSize = useWindowSize();

    useEffect(() => {
        if (!windowSize.width || !collectionSummaries) {
            return;
        }
        const main = async () => {
            if (refreshInProgress.current) {
                shouldRefresh.current = true;
                return;
            }
            refreshInProgress.current = true;

            const collectionRowList: CollectionSummary[][] = [];
            let index = 0;
            const columns =
                windowSize.width > AllCollectionMobileBreakpoint
                    ? DesktopColumns
                    : MobileColumns;
            while (index < collectionSummaries.length) {
                const collectionRow: CollectionSummary[] = [];
                for (
                    let i = 0;
                    i < columns && index < collectionSummaries.length;
                    i++
                ) {
                    collectionRow.push(collectionSummaries[index++]);
                }
                collectionRowList.push(collectionRow);
            }
            setCollectionRowList(collectionRowList);
            refreshInProgress.current = false;
            if (shouldRefresh.current) {
                shouldRefresh.current = false;
                setTimeout(main, 0);
            }
        };
        main();
    }, [collectionSummaries, windowSize]);

    // Bundle additional data to list items using the "itemData" prop.
    // It will be accessible to item renderers as props.data.
    // Memoize this data to avoid bypassing shouldComponentUpdate().
    const itemData = createItemData(collectionRowList, onCollectionClick);

    return (
        <DialogContent>
            <List
                height={windowSize.height ?? 0}
                width={'100%'}
                itemCount={collectionRowList.length}
                itemSize={154}
                itemData={itemData}>
                {AllCollectionRow}
            </List>
        </DialogContent>
    );
}
