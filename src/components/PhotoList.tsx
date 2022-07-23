import React, { useRef, useEffect, useContext } from 'react';
import { VariableSizeList as List } from 'react-window';
import { Box, styled } from '@mui/material';
import { EnteFile } from 'types/file';
import {
    IMAGE_CONTAINER_MAX_HEIGHT,
    MIN_COLUMNS,
    DATE_CONTAINER_HEIGHT,
    GAP_BTW_TILES,
    SPACE_BTW_DATES,
    SIZE_AND_COUNT_CONTAINER_HEIGHT,
    SPACE_BTW_DATES_TO_IMAGE_CONTAINER_WIDTH_RATIO,
    IMAGE_CONTAINER_MAX_WIDTH,
} from 'constants/gallery';
import constants from 'utils/strings/constants';
import { PublicCollectionGalleryContext } from 'utils/publicCollectionGallery';
import { ENTE_WEBSITE_LINK } from 'constants/urls';
import { getVariantColor, ButtonVariant } from './pages/gallery/LinkButton';
import { convertBytesToHumanReadable } from 'utils/billing';
import { DeduplicateContext } from 'pages/deduplicate';
import { FlexWrapper } from './Container';
import { Typography } from '@mui/material';
import { GalleryContext } from 'pages/gallery';
import { SpecialPadding } from 'styles/SpecialPadding';

const A_DAY = 24 * 60 * 60 * 1000;
const NO_OF_PAGES = 2;
const FOOTER_HEIGHT = 90;

export enum ITEM_TYPE {
    TIME = 'TIME',
    FILE = 'FILE',
    SIZE_AND_COUNT = 'SIZE_AND_COUNT',
    OTHER = 'OTHER',
}

export interface TimeStampListItem {
    itemType: ITEM_TYPE;
    items?: EnteFile[];
    itemStartIndex?: number;
    date?: string;
    dates?: {
        date: string;
        span: number;
    }[];
    groups?: number[];
    item?: any;
    id?: string;
    height?: number;
    fileSize?: number;
    fileCount?: number;
}

const ListItem = styled('div')`
    display: flex;
    justify-content: center;
`;

const getTemplateColumns = (
    columns: number,
    shrinkRatio: number,
    groups?: number[]
): string => {
    if (groups) {
        // need to confirm why this was there
        // const sum = groups.reduce((acc, item) => acc + item, 0);
        // if (sum < columns) {
        //     groups[groups.length - 1] += columns - sum;
        // }
        return groups
            .map(
                (x) =>
                    `repeat(${x}, ${IMAGE_CONTAINER_MAX_WIDTH * shrinkRatio}px)`
            )
            .join(` ${SPACE_BTW_DATES}px `);
    } else {
        return `repeat(${columns},${
            IMAGE_CONTAINER_MAX_WIDTH * shrinkRatio
        }px)`;
    }
};

function getFractionFittableColumns(width: number): number {
    return (
        (width - 2 * getGapFromScreenEdge(width) + GAP_BTW_TILES) /
        (IMAGE_CONTAINER_MAX_WIDTH + GAP_BTW_TILES)
    );
}

function getGapFromScreenEdge(width: number) {
    if (width > MIN_COLUMNS * IMAGE_CONTAINER_MAX_WIDTH) {
        return 24;
    } else {
        return 4;
    }
}

const ListContainer = styled(Box)<{
    columns: number;
    shrinkRatio: number;
    groups?: number[];
}>`
    user-select: none;
    display: grid;
    grid-template-columns: ${({ columns, shrinkRatio, groups }) =>
        getTemplateColumns(columns, shrinkRatio, groups)};
    grid-column-gap: ${GAP_BTW_TILES}px;
    width: 100%;
    color: #fff;
    ${SpecialPadding}
`;

const ListItemContainer = styled(FlexWrapper)<{ span: number }>`
    grid-column: span ${(props) => props.span};
    user-select: none;
`;

const DateContainer = styled(ListItemContainer)`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    height: ${DATE_CONTAINER_HEIGHT}px;
    color: ${({ theme }) => theme.palette.text.secondary};
`;

const SizeAndCountContainer = styled(DateContainer)`
    margin-top: 1rem;
    height: ${SIZE_AND_COUNT_CONTAINER_HEIGHT}px;
`;

const FooterContainer = styled(ListItemContainer)`
    font-size: 14px;
    margin-bottom: 0.75rem;
    @media (max-width: 540px) {
        font-size: 12px;
        margin-bottom: 0.5rem;
    }
    color: #979797;
    text-align: center;
    justify-content: center;
    align-items: flex-end;
    margin-top: calc(2rem + 20px);
`;

const NothingContainer = styled(ListItemContainer)`
    color: #979797;
    text-align: center;
    justify-content: center;
`;

interface Props {
    height: number;
    width: number;
    filteredData: EnteFile[];
    showAppDownloadBanner: boolean;
    getThumbnail: (files: EnteFile[], index: number) => JSX.Element;
    activeCollection: number;
    resetFetching: () => void;
}

export function PhotoList({
    height,
    width,
    filteredData,
    showAppDownloadBanner,
    getThumbnail,
    activeCollection,
    resetFetching,
}: Props) {
    const galleryContext = useContext(GalleryContext);

    const timeStampListRef = useRef([]);
    const timeStampList = timeStampListRef?.current ?? [];
    const filteredDataCopyRef = useRef([]);
    const filteredDataCopy = filteredDataCopyRef.current ?? [];
    const listRef = useRef(null);
    const publicCollectionGalleryContext = useContext(
        PublicCollectionGalleryContext
    );
    const deduplicateContext = useContext(DeduplicateContext);

    const fittableColumns = getFractionFittableColumns(width);
    let columns = Math.ceil(fittableColumns);

    let skipMerge = false;
    if (columns < MIN_COLUMNS) {
        columns = MIN_COLUMNS - 1;
        skipMerge = true;
    }
    const shrinkRatio = fittableColumns / columns;
    const listItemHeight =
        IMAGE_CONTAINER_MAX_HEIGHT * shrinkRatio + GAP_BTW_TILES;

    const refreshList = () => {
        listRef.current?.resetAfterIndex(0);
        resetFetching();
    };

    useEffect(() => {
        let timeStampList: TimeStampListItem[] = [];

        if (galleryContext.photoListHeader) {
            timeStampList.push(
                getPhotoListHeader(galleryContext.photoListHeader)
            );
        } else if (publicCollectionGalleryContext.photoListHeader) {
            timeStampList.push(
                getPhotoListHeader(
                    publicCollectionGalleryContext.photoListHeader
                )
            );
        }
        if (deduplicateContext.isOnDeduplicatePage) {
            skipMerge = true;
            groupByFileSize(timeStampList);
        } else {
            groupByTime(timeStampList);
        }

        if (!skipMerge) {
            timeStampList = mergeTimeStampList(timeStampList, columns);
        }
        if (timeStampList.length === 0) {
            timeStampList.push(getEmptyListItem());
        }
        if (
            showAppDownloadBanner ||
            publicCollectionGalleryContext.accessedThroughSharedURL
        ) {
            timeStampList.push(getVacuumItem(timeStampList));
            if (publicCollectionGalleryContext.accessedThroughSharedURL) {
                timeStampList.push(getAlbumsFooter());
            } else {
                timeStampList.push(getAppDownloadFooter());
            }
        }

        timeStampListRef.current = timeStampList;
        filteredDataCopyRef.current = filteredData;
        refreshList();
    }, [
        width,
        height,
        filteredData,
        showAppDownloadBanner,
        publicCollectionGalleryContext.accessedThroughSharedURL,
    ]);

    const groupByFileSize = (timeStampList: TimeStampListItem[]) => {
        let index = 0;
        while (index < filteredData.length) {
            const file = filteredData[index];
            const currentFileSize = deduplicateContext.fileSizeMap.get(file.id);
            const currentCreationTime = file.metadata.creationTime;
            let lastFileIndex = index;

            while (lastFileIndex < filteredData.length) {
                if (
                    deduplicateContext.fileSizeMap.get(
                        filteredData[lastFileIndex].id
                    ) !== currentFileSize ||
                    (deduplicateContext.clubSameTimeFilesOnly &&
                        filteredData[lastFileIndex].metadata.creationTime !==
                            currentCreationTime)
                ) {
                    break;
                }
                lastFileIndex++;
            }
            lastFileIndex--;
            timeStampList.push({
                itemType: ITEM_TYPE.SIZE_AND_COUNT,
                fileSize: currentFileSize,
                fileCount: lastFileIndex - index + 1,
            });

            while (index <= lastFileIndex) {
                const tileSize = Math.min(columns, lastFileIndex - index + 1);
                timeStampList.push({
                    itemType: ITEM_TYPE.FILE,
                    items: filteredData.slice(index, index + tileSize),
                    itemStartIndex: index,
                });
                index += tileSize;
            }
        }
    };

    const groupByTime = (timeStampList: TimeStampListItem[]) => {
        let listItemIndex = 0;
        let currentDate = -1;

        filteredData.forEach((item, index) => {
            if (
                !isSameDay(
                    new Date(item.metadata.creationTime / 1000),
                    new Date(currentDate)
                )
            ) {
                currentDate = item.metadata.creationTime / 1000;
                const dateTimeFormat = new Intl.DateTimeFormat('en-IN', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                });
                timeStampList.push({
                    itemType: ITEM_TYPE.TIME,
                    date: isSameDay(new Date(currentDate), new Date())
                        ? 'Today'
                        : isSameDay(
                              new Date(currentDate),
                              new Date(Date.now() - A_DAY)
                          )
                        ? 'Yesterday'
                        : dateTimeFormat.format(currentDate),
                    id: currentDate.toString(),
                });
                timeStampList.push({
                    itemType: ITEM_TYPE.FILE,
                    items: [item],
                    itemStartIndex: index,
                });
                listItemIndex = 1;
            } else if (listItemIndex < columns) {
                timeStampList[timeStampList.length - 1].items.push(item);
                listItemIndex++;
            } else {
                listItemIndex = 1;
                timeStampList.push({
                    itemType: ITEM_TYPE.FILE,
                    items: [item],
                    itemStartIndex: index,
                });
            }
        });
    };

    const isSameDay = (first, second) =>
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate();

    const getPhotoListHeader = (photoListHeader) => {
        return {
            ...photoListHeader,
            item: (
                <ListItemContainer span={columns}>
                    {photoListHeader.item}
                </ListItemContainer>
            ),
        };
    };

    const getEmptyListItem = () => {
        return {
            itemType: ITEM_TYPE.OTHER,
            item: (
                <NothingContainer span={columns}>
                    <div>{constants.NOTHING_HERE}</div>
                </NothingContainer>
            ),
            id: 'empty-list-banner',
            height: height - 48,
        };
    };
    const getVacuumItem = (timeStampList) => {
        const photoFrameHeight = (() => {
            let sum = 0;
            const getCurrentItemSize = getItemSize(timeStampList);
            for (let i = 0; i < timeStampList.length; i++) {
                sum += getCurrentItemSize(i);
                if (height - sum <= FOOTER_HEIGHT) {
                    break;
                }
            }
            return sum;
        })();
        return {
            itemType: ITEM_TYPE.OTHER,
            item: <></>,
            height: Math.max(height - photoFrameHeight - FOOTER_HEIGHT, 0),
        };
    };

    const getAppDownloadFooter = () => {
        return {
            itemType: ITEM_TYPE.OTHER,
            height: FOOTER_HEIGHT,
            item: (
                <FooterContainer span={columns}>
                    <Typography>{constants.INSTALL_MOBILE_APP()}</Typography>
                </FooterContainer>
            ),
        };
    };

    const getAlbumsFooter = () => {
        return {
            itemType: ITEM_TYPE.OTHER,
            height: FOOTER_HEIGHT,
            item: (
                <FooterContainer span={columns}>
                    <p>
                        {constants.PRESERVED_BY}{' '}
                        <a
                            target="_blank"
                            style={{
                                color: getVariantColor(ButtonVariant.success),
                            }}
                            href={ENTE_WEBSITE_LINK}
                            rel="noreferrer">
                            {constants.ENTE_IO}
                        </a>
                    </p>
                </FooterContainer>
            ),
        };
    };
    /**
     * Checks and merge multiple dates into a single row.
     *
     * @param items
     * @param columns
     * @returns
     */
    const mergeTimeStampList = (
        items: TimeStampListItem[],
        columns: number
    ): TimeStampListItem[] => {
        const newList: TimeStampListItem[] = [];
        let index = 0;
        let newIndex = 0;
        while (index < items.length) {
            const currItem = items[index];
            // If the current item is of type time, then it is not part of an ongoing date.
            // So, there is a possibility of merge.
            if (currItem.itemType === ITEM_TYPE.TIME) {
                // If new list pointer is not at the end of list then
                // we can add more items to the same list.
                if (newList[newIndex]) {
                    // Check if items can be added to same list
                    if (
                        newList[newIndex + 1].items.length +
                            items[index + 1].items.length +
                            Math.ceil(
                                newList[newIndex].dates.length *
                                    SPACE_BTW_DATES_TO_IMAGE_CONTAINER_WIDTH_RATIO
                            ) <=
                        columns
                    ) {
                        newList[newIndex].dates.push({
                            date: currItem.date,
                            span: items[index + 1].items.length,
                        });
                        newList[newIndex + 1].items = newList[
                            newIndex + 1
                        ].items.concat(items[index + 1].items);
                        index += 2;
                    } else {
                        // Adding items would exceed the number of columns.
                        // So, move new list pointer to the end. Hence, in next iteration,
                        // items will be added to a new list.
                        newIndex += 2;
                    }
                } else {
                    // New list pointer was at the end of list so simply add new items to the list.
                    newList.push({
                        ...currItem,
                        date: null,
                        dates: [
                            {
                                date: currItem.date,
                                span: items[index + 1].items.length,
                            },
                        ],
                    });
                    newList.push(items[index + 1]);
                    index += 2;
                }
            } else {
                // Merge cannot happen. Simply add all items to new list
                // and set new list point to the end of list.
                newList.push(currItem);
                index++;
                newIndex = newList.length;
            }
        }
        for (let i = 0; i < newList.length; i++) {
            const currItem = newList[i];
            const nextItem = newList[i + 1];
            if (currItem.itemType === ITEM_TYPE.TIME) {
                if (currItem.dates.length > 1) {
                    currItem.groups = currItem.dates.map((item) => item.span);
                    nextItem.groups = currItem.groups;
                }
            }
        }
        return newList;
    };

    const getItemSize = (timeStampList) => (index) => {
        switch (timeStampList[index].itemType) {
            case ITEM_TYPE.TIME:
                return DATE_CONTAINER_HEIGHT;
            case ITEM_TYPE.SIZE_AND_COUNT:
                return SIZE_AND_COUNT_CONTAINER_HEIGHT;
            case ITEM_TYPE.FILE:
                return listItemHeight;
            default:
                return timeStampList[index].height;
        }
    };

    const extraRowsToRender = Math.ceil(
        (NO_OF_PAGES * height) / IMAGE_CONTAINER_MAX_HEIGHT
    );

    const generateKey = (index) => {
        switch (timeStampList[index].itemType) {
            case ITEM_TYPE.FILE:
                return `${timeStampList[index].items[0].id}-${
                    timeStampList[index].items.slice(-1)[0].id
                }`;
            default:
                return `${timeStampList[index].id}-${index}`;
        }
    };

    const renderListItem = (listItem: TimeStampListItem) => {
        switch (listItem.itemType) {
            case ITEM_TYPE.TIME:
                return listItem.dates ? (
                    listItem.dates.map((item) => (
                        <>
                            <DateContainer key={item.date} span={item.span}>
                                {item.date}
                            </DateContainer>
                            <div />
                        </>
                    ))
                ) : (
                    <DateContainer span={columns}>
                        {listItem.date}
                    </DateContainer>
                );
            case ITEM_TYPE.SIZE_AND_COUNT:
                return (
                    <SizeAndCountContainer span={columns}>
                        {listItem.fileCount} {constants.FILES},{' '}
                        {convertBytesToHumanReadable(listItem.fileSize || 0)}{' '}
                        {constants.EACH}
                    </SizeAndCountContainer>
                );
            case ITEM_TYPE.FILE: {
                const ret = listItem.items.map((item, idx) =>
                    getThumbnail(
                        filteredDataCopy,
                        listItem.itemStartIndex + idx
                    )
                );
                if (listItem.groups) {
                    let sum = 0;
                    for (let i = 0; i < listItem.groups.length - 1; i++) {
                        sum = sum + listItem.groups[i];
                        ret.splice(sum, 0, <div />);
                        sum += 1;
                    }
                }
                return ret;
            }
            default:
                return listItem.item;
        }
    };
    if (!timeStampList?.length) {
        return <></>;
    }

    return (
        <List
            key={`${activeCollection}`}
            ref={listRef}
            itemSize={getItemSize(timeStampList)}
            height={height}
            width={width}
            itemCount={timeStampList.length}
            itemKey={generateKey}
            overscanCount={extraRowsToRender}>
            {({ index, style }) => (
                <ListItem style={style}>
                    <ListContainer
                        columns={columns}
                        shrinkRatio={shrinkRatio}
                        groups={timeStampList[index].groups}>
                        {renderListItem(timeStampList[index])}
                    </ListContainer>
                </ListItem>
            )}
        </List>
    );
}
