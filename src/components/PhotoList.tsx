import React, { useRef, useEffect, useContext, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import { Box, Link, styled } from '@mui/material';
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
import { PublicCollectionGalleryContext } from 'utils/publicCollectionGallery';
import { ENTE_WEBSITE_LINK } from 'constants/urls';
import { convertBytesToHumanReadable } from 'utils/file/size';
import { DeduplicateContext } from 'pages/deduplicate';
import { FlexWrapper } from './Container';
import { Typography } from '@mui/material';
import { GalleryContext } from 'pages/gallery';
import { formatDate } from 'utils/time/format';
import { Trans } from 'react-i18next';
import { t } from 'i18next';

const A_DAY = 24 * 60 * 60 * 1000;
const FOOTER_HEIGHT = 90;
const ALBUM_FOOTER_HEIGHT = 75;

export enum ITEM_TYPE {
    TIME = 'TIME',
    FILE = 'FILE',
    SIZE_AND_COUNT = 'SIZE_AND_COUNT',
    HEADER = 'HEADER',
    FOOTER = 'FOOTER',
    MARKETING_FOOTER = 'MARKETING_FOOTER',
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
    padding: 0 24px;
    @media (max-width: ${IMAGE_CONTAINER_MAX_WIDTH * MIN_COLUMNS}px) {
        padding: 0 4px;
    }
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
    color: ${({ theme }) => theme.colors.text.muted};
`;

const SizeAndCountContainer = styled(DateContainer)`
    margin-top: 1rem;
    height: ${SIZE_AND_COUNT_CONTAINER_HEIGHT}px;
`;

const FooterContainer = styled(ListItemContainer)`
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

const AlbumFooterContainer = styled(ListItemContainer)`
    margin-top: 48px;
    margin-bottom: 10px;
    text-align: center;
    justify-content: center;
`;

const NothingContainer = styled(ListItemContainer)`
    color: #979797;
    text-align: center;
    justify-content: center;
`;

const isSameDay = (first, second) => {
    return (
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate()
    );
};

const getItemSize = (timeStampList, listItemHeight) => (index) => {
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

const generateKey = (timeStampList) => (index) => {
    switch (timeStampList[index].itemType) {
        case ITEM_TYPE.FILE:
            return `${timeStampList[index].items[0].id}-${
                timeStampList[index].items.slice(-1)[0].id
            }`;
        default:
            return `${timeStampList[index].id}`;
    }
};

const getPhotoListHeader = (photoListHeader, columns) => {
    return {
        ...photoListHeader,
        item: (
            <ListItemContainer span={columns}>
                {photoListHeader.item}
            </ListItemContainer>
        ),
    };
};

const getPhotoListFooter = (photoListFooter, columns) => {
    return {
        ...photoListFooter,
        id: 'photo-list-footer',
        item: (
            <ListItemContainer span={columns}>
                {photoListFooter.item}
            </ListItemContainer>
        ),
    };
};

const getEmptyListItem = (columns, height) => {
    return {
        itemType: ITEM_TYPE.OTHER,
        item: (
            <NothingContainer span={columns}>
                <div>{t('NOTHING_HERE')}</div>
            </NothingContainer>
        ),
        id: 'empty-list-banner',
        height: height - 48,
    };
};
const getVacuumItem = (
    timeStampList,
    publicCollectionGalleryContext,
    listItemHeight,
    height
) => {
    const footerHeight = publicCollectionGalleryContext.accessedThroughSharedURL
        ? ALBUM_FOOTER_HEIGHT +
          (publicCollectionGalleryContext.photoListFooter?.height ?? 0)
        : FOOTER_HEIGHT;
    const photoFrameHeight = (() => {
        let sum = 0;
        const getCurrentItemSize = getItemSize(timeStampList, listItemHeight);
        for (let i = 0; i < timeStampList.length; i++) {
            sum += getCurrentItemSize(i);
            if (height - sum <= footerHeight) {
                break;
            }
        }
        return sum;
    })();
    return {
        itemType: ITEM_TYPE.OTHER,
        item: <></>,
        id: 'vacuum-item',
        height: Math.max(height - photoFrameHeight - footerHeight, 0),
    };
};

const getAppDownloadFooter = (columns) => {
    return {
        itemType: ITEM_TYPE.MARKETING_FOOTER,
        height: FOOTER_HEIGHT,
        id: 'app-download-footer',
        item: (
            <FooterContainer span={columns}>
                <Typography variant="small">
                    <Trans
                        i18nKey={'INSTALL_MOBILE_APP'}
                        components={{
                            a: (
                                <Link
                                    href="https://play.google.com/store/apps/details?id=io.ente.photos"
                                    target="_blank"
                                    rel="noreferrer"
                                />
                            ),
                            b: (
                                <Link
                                    href="https://apps.apple.com/in/app/ente-photos/id1542026904"
                                    target="_blank"
                                    rel="noreferrer"
                                />
                            ),
                        }}
                    />
                </Typography>
            </FooterContainer>
        ),
    };
};

const getAlbumsFooter = (columns) => {
    return {
        itemType: ITEM_TYPE.MARKETING_FOOTER,
        height: ALBUM_FOOTER_HEIGHT,
        id: 'albums-footer',
        item: (
            <AlbumFooterContainer span={columns}>
                <Typography variant="small">
                    {t('SHARED_USING')}{' '}
                    <Link target="_blank" href={ENTE_WEBSITE_LINK}>
                        {t('ENTE_IO')}
                    </Link>
                </Typography>
            </AlbumFooterContainer>
        ),
    };
};

const RenderListItem = React.memo(
    ({
        getThumbnail,
        columns,
        listItem,
        isScrolling,
    }: {
        getThumbnail;
        columns;
        listItem: TimeStampListItem;
        isScrolling: boolean;
    }) => {
        switch (listItem.itemType) {
            case ITEM_TYPE.TIME:
                return listItem.dates ? (
                    listItem.dates
                        .map((item) => [
                            <DateContainer key={item.date} span={item.span}>
                                {item.date}
                            </DateContainer>,
                            <div key={`${item.date}-gap`} />,
                        ])
                        .flat()
                ) : (
                    <DateContainer span={columns}>
                        {listItem.date}
                    </DateContainer>
                );
            case ITEM_TYPE.SIZE_AND_COUNT:
                return (
                    <SizeAndCountContainer span={columns}>
                        {listItem.fileCount} {t('FILES')},{' '}
                        {convertBytesToHumanReadable(listItem.fileSize || 0)}{' '}
                        {t('EACH')}
                    </SizeAndCountContainer>
                );
            case ITEM_TYPE.FILE: {
                const ret = listItem.items.map((item, idx) =>
                    getThumbnail(
                        item,
                        listItem.itemStartIndex + idx,
                        isScrolling
                    )
                );
                if (listItem.groups) {
                    let sum = 0;
                    for (let i = 0; i < listItem.groups.length - 1; i++) {
                        sum = sum + listItem.groups[i];
                        ret.splice(
                            sum,
                            0,
                            <div key={`${listItem.items[0].id}-gap-${i}`} />
                        );
                        sum += 1;
                    }
                }
                return ret;
            }
            default:
                return listItem.item;
        }
    }
);

interface Props {
    height: number;
    width: number;
    filteredData: EnteFile[];
    showAppDownloadBanner: boolean;
    getThumbnail: (
        file: EnteFile,
        index: number,
        isScrolling?: boolean
    ) => JSX.Element;
    activeCollection: number;
}

export function PhotoList({
    height,
    width,
    filteredData,
    showAppDownloadBanner,
    getThumbnail,
    activeCollection,
}: Props) {
    const galleryContext = useContext(GalleryContext);
    const publicCollectionGalleryContext = useContext(
        PublicCollectionGalleryContext
    );
    const deduplicateContext = useContext(DeduplicateContext);

    const [timeStampList, setTimeStampList] = useState<TimeStampListItem[]>([]);
    const refreshInProgress = useRef(false);
    const shouldRefresh = useRef(false);
    const listRef = useRef(null);

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
    };

    useEffect(() => {
        const main = () => {
            if (refreshInProgress.current) {
                shouldRefresh.current = true;
                return;
            }
            refreshInProgress.current = true;
            let timeStampList: TimeStampListItem[] = [];

            if (galleryContext.photoListHeader) {
                timeStampList.push(
                    getPhotoListHeader(galleryContext.photoListHeader, columns)
                );
            } else if (publicCollectionGalleryContext.photoListHeader) {
                timeStampList.push(
                    getPhotoListHeader(
                        publicCollectionGalleryContext.photoListHeader,
                        columns
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
            if (timeStampList.length === 1) {
                timeStampList.push(getEmptyListItem(columns, height));
            }
            timeStampList.push(
                getVacuumItem(
                    timeStampList,
                    publicCollectionGalleryContext,
                    listItemHeight,
                    height
                )
            );
            if (publicCollectionGalleryContext.accessedThroughSharedURL) {
                if (publicCollectionGalleryContext.photoListFooter) {
                    timeStampList.push(
                        getPhotoListFooter(
                            publicCollectionGalleryContext.photoListFooter,
                            columns
                        )
                    );
                }
                timeStampList.push(getAlbumsFooter(columns));
            } else if (showAppDownloadBanner) {
                timeStampList.push(getAppDownloadFooter(columns));
            }

            setTimeStampList(timeStampList);
            refreshInProgress.current = false;
            if (shouldRefresh.current) {
                shouldRefresh.current = false;
                setTimeout(main, 0);
            }
        };
        main();
    }, [
        width,
        height,
        filteredData,
        deduplicateContext.isOnDeduplicatePage,
        deduplicateContext.fileSizeMap,
    ]);

    useEffect(() => {
        setTimeStampList((timeStampList) => {
            timeStampList = timeStampList ?? [];
            const hasHeader =
                timeStampList.length > 0 &&
                timeStampList[0].itemType === ITEM_TYPE.HEADER;

            if (hasHeader) {
                return timeStampList;
            }
            if (galleryContext.photoListHeader) {
                return [
                    getPhotoListHeader(galleryContext.photoListHeader, columns),
                    ...timeStampList,
                ];
            } else if (publicCollectionGalleryContext.photoListHeader) {
                return [
                    getPhotoListHeader(
                        publicCollectionGalleryContext.photoListHeader,
                        columns
                    ),
                    ...timeStampList,
                ];
            } else {
                return timeStampList;
            }
        });
    }, [
        galleryContext.photoListHeader,
        publicCollectionGalleryContext.photoListHeader,
    ]);

    useEffect(() => {
        setTimeStampList((timeStampList) => {
            timeStampList = timeStampList ?? [];
            const hasFooter =
                timeStampList.length > 0 &&
                timeStampList[timeStampList.length - 1].itemType ===
                    ITEM_TYPE.MARKETING_FOOTER;
            if (hasFooter) {
                return timeStampList;
            }
            if (publicCollectionGalleryContext.accessedThroughSharedURL) {
                if (publicCollectionGalleryContext.photoListFooter) {
                    return [
                        ...timeStampList,
                        getPhotoListFooter(
                            publicCollectionGalleryContext.photoListFooter,
                            columns
                        ),
                        getAlbumsFooter(columns),
                    ];
                }
            } else if (showAppDownloadBanner) {
                return [...timeStampList, getAppDownloadFooter(columns)];
            } else {
                return timeStampList;
            }
        });
    }, [
        publicCollectionGalleryContext.accessedThroughSharedURL,
        showAppDownloadBanner,
        publicCollectionGalleryContext.photoListFooter,
    ]);

    useEffect(() => {
        refreshList();
    }, [timeStampList]);

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
        let currentDate;
        filteredData.forEach((item, index) => {
            if (
                !currentDate ||
                !isSameDay(
                    new Date(item.metadata.creationTime / 1000),
                    new Date(currentDate)
                )
            ) {
                currentDate = item.metadata.creationTime / 1000;

                timeStampList.push({
                    itemType: ITEM_TYPE.TIME,
                    date: isSameDay(new Date(currentDate), new Date())
                        ? t('TODAY')
                        : isSameDay(
                              new Date(currentDate),
                              new Date(Date.now() - A_DAY)
                          )
                        ? t('YESTERDAY')
                        : formatDate(currentDate),
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
                        newList[newIndex + 1].items = [
                            ...newList[newIndex + 1].items,
                            ...items[index + 1].items,
                        ];
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

    if (!timeStampList?.length) {
        return <></>;
    }

    return (
        <List
            key={`${activeCollection}`}
            ref={listRef}
            itemSize={getItemSize(timeStampList, listItemHeight)}
            height={height}
            width={width}
            itemCount={timeStampList.length}
            itemKey={generateKey(timeStampList)}
            overscanCount={3}
            useIsScrolling>
            {({ index, style, isScrolling }) => (
                <ListItem style={style}>
                    <ListContainer
                        columns={columns}
                        shrinkRatio={shrinkRatio}
                        groups={timeStampList[index].groups}>
                        <RenderListItem
                            getThumbnail={getThumbnail}
                            columns={columns}
                            listItem={timeStampList[index]}
                            isScrolling={isScrolling}
                        />
                    </ListContainer>
                </ListItem>
            )}
        </List>
    );
}
