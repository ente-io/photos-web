import CollectionShare from 'components/CollectionShare';
import { SetDialogMessage } from 'components/MessageDialog';
import NavigationButton, {
    SCROLL_DIRECTION,
} from 'components/NavigationButton';
import React, { useEffect, useRef, useState } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
    Collection,
    CollectionAndItsLatestFile,
    CollectionType,
    COLLECTION_SORT_BY,
    sortCollections,
} from 'services/collectionService';
import { User } from 'services/userService';
import styled from 'styled-components';
import { IMAGE_CONTAINER_MAX_WIDTH } from 'types';
import { getSelectedCollection } from 'utils/collection';
import { sleep } from 'utils/common';
import { getData, LS_KEYS } from 'utils/storage/localStorage';
import constants from 'utils/strings/constants';
import { SetCollectionNamerAttributes } from './CollectionNamer';
import CollectionOptions from './CollectionOptions';
import CollectionSort from './CollectionSort';
import OptionIcon, { OptionIconWrapper } from './OptionIcon';

export const ARCHIVE_SECTION = -1;
export const ALL_SECTION = 0;

interface CollectionProps {
    collections: Collection[];
    collectionAndTheirLatestFile: CollectionAndItsLatestFile[];
    activeCollection?: number;
    setActiveCollection: (id?: number) => void;
    setDialogMessage: SetDialogMessage;
    syncWithRemote: () => Promise<void>;
    setCollectionNamerAttributes: SetCollectionNamerAttributes;
    startLoadingBar: () => void;
    isInSearchMode: boolean;
    collectionFilesCount: Map<number, number>;
}

const CollectionContainer = styled.div`
    overflow-y: hidden;
    height: 40px;
    display: flex;
    width: calc(100% - 80px);
    position: relative;
    padding: 0 24px;

    @media (max-width: ${IMAGE_CONTAINER_MAX_WIDTH * 4}px) {
        padding: 0 4px;
    }
`;

const Wrapper = styled.div`
    height: 70px;
    flex: 1;
    white-space: nowrap;
    overflow: auto;
    max-width: 100%;
    scroll-behavior: smooth;
`;

const CollectionBar = styled.div`
    width: 100%;
    margin: 10px auto;
    display: flex;
    align-items: center;
    justify-content: flex-start;
`;

const Chip = styled.button<{ active: boolean }>`
    border-radius: 8px;
    padding: 4px;
    padding-left: 24px;
    margin: 3px;
    border: none;
    background-color: ${(props) =>
        props.active ? '#fff' : 'rgba(255, 255, 255, 0.3)'};
    outline: none !important;
    &:hover {
        background-color: ${(props) => !props.active && '#bbbbbb'};
    }
    &:hover ${OptionIconWrapper} {
        opacity: 1;
        color: #000000;
    }
`;

const Hider = styled.div<{ hide: boolean }>`
    opacity: ${(props) => (props.hide ? '0' : '100')};
    height: ${(props) => (props.hide ? '0' : 'auto')};
`;

export default function Collections(props: CollectionProps) {
    const { activeCollection, collections, setActiveCollection } = props;
    const [selectedCollectionID, setSelectedCollectionID] =
        useState<number>(null);
    const collectionWrapperRef = useRef<HTMLDivElement>(null);
    const [collectionChipsRef, setCollectionChipsRef] = useState({});
    const [collectionShareModalView, setCollectionShareModalView] =
        useState(false);
    const [scrollObj, setScrollObj] = useState<{
        scrollLeft?: number;
        scrollWidth?: number;
        clientWidth?: number;
    }>({});
    const [collectionSortBy, setCollectionSortBy] =
        useState<COLLECTION_SORT_BY>(COLLECTION_SORT_BY.LATEST_FILE);

    const updateScrollObj = () => {
        if (collectionWrapperRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } =
                collectionWrapperRef.current;
            setScrollObj({ scrollLeft, scrollWidth, clientWidth });
        }
    };

    useEffect(() => {
        updateScrollObj();
    }, [collectionWrapperRef.current, props.isInSearchMode]);

    useEffect(() => {
        if (!collectionWrapperRef?.current) {
            return;
        }
        collectionWrapperRef.current.scrollLeft = 0;
    }, [collections]);

    const scrollToCollection = async (collectionID: number) => {
        await sleep(200);
        collectionChipsRef[collectionID]?.scrollIntoView({
            inline: 'center',
        });
    };

    const updateRef = (collectionID: number, ref: HTMLButtonElement) =>
        setCollectionChipsRef((collectionChipsRef) => {
            if (!collectionChipsRef[collectionID]) {
                collectionChipsRef[collectionID] = ref;
            }
            return collectionChipsRef;
        });

    useEffect(() => {
        scrollToCollection(activeCollection);
    }, [activeCollection]);

    const clickHandler = (collectionID?: number) => () => {
        setSelectedCollectionID(collectionID);
        setActiveCollection(collectionID ?? ALL_SECTION);
    };

    const user: User = getData(LS_KEYS.USER);

    if (!collections || collections.length === 0) {
        return null;
    }

    const collectionOptions = CollectionOptions({
        syncWithRemote: props.syncWithRemote,
        setCollectionNamerAttributes: props.setCollectionNamerAttributes,
        collections: props.collections,
        selectedCollectionID,
        setDialogMessage: props.setDialogMessage,
        startLoadingBar: props.startLoadingBar,
        showCollectionShareModal: setCollectionShareModalView.bind(null, true),
        redirectToAll: setActiveCollection.bind(null, ALL_SECTION),
    });

    const scrollCollection = (direction: SCROLL_DIRECTION) => () => {
        collectionWrapperRef.current.scrollBy(250 * direction, 0);
    };
    const renderTooltip = (collectionID: number) => {
        const fileCount = props.collectionFilesCount?.get(collectionID) ?? 0;
        return (
            <Tooltip
                style={{
                    padding: '0',
                    paddingBottom: '5px',
                }}
                id="button-tooltip">
                <div
                    style={{
                        backgroundColor: '#282828',
                        padding: '2px 10px',
                        margin: 0,
                        color: '#ddd',
                        borderRadius: 3,
                        fontSize: '12px',
                    }}>
                    {fileCount} {fileCount > 1 ? 'items' : 'item'}
                </div>
            </Tooltip>
        );
    };

    return (
        <Hider hide={props.isInSearchMode}>
            <CollectionShare
                show={collectionShareModalView}
                onHide={() => setCollectionShareModalView(false)}
                collection={getSelectedCollection(
                    selectedCollectionID,
                    props.collections
                )}
                syncWithRemote={props.syncWithRemote}
            />
            <CollectionBar>
                <CollectionContainer>
                    {scrollObj.scrollLeft > 0 && (
                        <NavigationButton
                            scrollDirection={SCROLL_DIRECTION.LEFT}
                            onClick={scrollCollection(SCROLL_DIRECTION.LEFT)}
                        />
                    )}
                    <Wrapper
                        ref={collectionWrapperRef}
                        onScroll={updateScrollObj}>
                        <Chip
                            ref={(ref) => updateRef(ALL_SECTION, ref)}
                            active={activeCollection === ALL_SECTION}
                            onClick={clickHandler(ALL_SECTION)}>
                            {constants.ALL}
                            <div
                                style={{
                                    display: 'inline-block',
                                    width: '24px',
                                }}
                            />
                        </Chip>
                        {sortCollections(
                            collections,
                            props.collectionAndTheirLatestFile,
                            collectionSortBy
                        ).map((item) => (
                            <OverlayTrigger
                                key={item.id}
                                placement="top"
                                delay={{ show: 250, hide: 400 }}
                                overlay={renderTooltip(item.id)}>
                                <Chip
                                    ref={(ref) => updateRef(item.id, ref)}
                                    active={activeCollection === item.id}
                                    onClick={clickHandler(item.id)}>
                                    {item.name}
                                    {item.type !== CollectionType.favorites &&
                                    item.owner.id === user?.id ? (
                                        <OverlayTrigger
                                            rootClose
                                            trigger="click"
                                            placement="bottom"
                                            overlay={collectionOptions}>
                                            <OptionIcon
                                                onClick={() =>
                                                    setSelectedCollectionID(
                                                        item.id
                                                    )
                                                }
                                            />
                                        </OverlayTrigger>
                                    ) : (
                                        <div
                                            style={{
                                                display: 'inline-block',
                                                width: '24px',
                                            }}
                                        />
                                    )}
                                </Chip>
                            </OverlayTrigger>
                        ))}
                        <Chip
                            active={activeCollection === ARCHIVE_SECTION}
                            ref={(ref) => updateRef(ARCHIVE_SECTION, ref)}
                            onClick={clickHandler(ARCHIVE_SECTION)}>
                            {constants.ARCHIVE}
                            <div
                                style={{
                                    display: 'inline-block',
                                    width: '24px',
                                }}
                            />
                        </Chip>
                    </Wrapper>
                    {scrollObj.scrollLeft <
                        scrollObj.scrollWidth - scrollObj.clientWidth && (
                        <NavigationButton
                            scrollDirection={SCROLL_DIRECTION.RIGHT}
                            onClick={scrollCollection(SCROLL_DIRECTION.RIGHT)}
                        />
                    )}
                </CollectionContainer>
                <CollectionSort
                    setCollectionSortBy={setCollectionSortBy}
                    activeSortBy={collectionSortBy}
                />
            </CollectionBar>
        </Hider>
    );
}
