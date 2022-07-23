import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import { EnteFile } from 'types/file';
import { styled } from '@mui/material';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import DownloadManager from 'services/downloadManager';
import useLongPress from 'utils/common/useLongPress';
import { GalleryContext } from 'pages/gallery';
import { GAP_BTW_TILES, IMAGE_CONTAINER_MAX_WIDTH } from 'constants/gallery';
import { PublicCollectionGalleryContext } from 'utils/publicCollectionGallery';
import PublicCollectionDownloadManager from 'services/publicCollectionDownloadManager';
import LivePhotoIcon from '@mui/icons-material/LightMode';
import { formatDateRelative, isLivePhoto } from 'utils/file';
import { DeduplicateContext } from 'pages/deduplicate';
import { logError } from 'utils/sentry';
import { Overlay } from 'components/Container';
import { TRASH_SECTION } from 'constants/collection';

interface IProps {
    file: EnteFile;
    updateURL?: (url: string) => EnteFile;
    onClick?: () => void;
    forcedEnable?: boolean;
    selectable?: boolean;
    selected?: boolean;
    onSelect?: (checked: boolean) => void;
    onHover?: () => void;
    onRangeSelect?: () => void;
    isRangeSelectActive?: boolean;
    selectOnClick?: boolean;
    isInsSelectRange?: boolean;
    activeCollection?: number;
}

const Check = styled('input')<{ active: boolean }>`
    appearance: none;
    position: absolute;
    z-index: 10;
    left: 0;
    opacity: 0;
    outline: none;
    cursor: pointer;
    @media (pointer: coarse) {
        pointer-events: none;
    }

    &::before {
        content: '';
        width: 16px;
        height: 16px;
        border: 2px solid #fff;
        background-color: #ddd;
        display: inline-block;
        border-radius: 50%;
        vertical-align: bottom;
        margin: 8px 8px;
        text-align: center;
        line-height: 16px;
        transition: background-color 0.3s ease;
        pointer-events: inherit;
        color: #aaa;
    }
    &::after {
        content: '';
        width: 5px;
        height: 10px;
        border-right: 2px solid #333;
        border-bottom: 2px solid #333;
        transform: translate(-18px, 8px);
        transition: transform 0.3s ease;
        position: absolute;
        pointer-events: inherit;
        transform: translate(-18px, 10px) rotate(45deg);
    }

    /** checked */
    &:checked::before {
        content: '';
        background-color: #51cd7c;
        border-color: #51cd7c;
        color: #fff;
    }
    &:checked::after {
        content: '';
        border-right: 2px solid #ddd;
        border-bottom: 2px solid #ddd;
    }
    ${(props) => props.active && 'opacity: 0.5 '};
    &:checked {
        opacity: 1 !important;
    }
`;

export const HoverOverlay = styled('div')<{ checked: boolean }>`
    opacity: 0;
    left: 0;
    top: 0;
    outline: none;
    height: 40%;
    width: 100%;
    position: absolute;
    ${(props) =>
        !props.checked &&
        'background:linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0))'};
`;

export const InSelectRangeOverLay = styled('div')<{ active: boolean }>`
    opacity: ${(props) => (!props.active ? 0 : 1)};
    left: 0;
    top: 0;
    outline: none;
    height: 100%;
    width: 100%;
    position: absolute;
    ${(props) => props.active && 'background:rgba(81, 205, 124, 0.25)'};
`;

export const FileAndCollectionNameOverlay = styled('div')`
    width: 100%;
    bottom: 0;
    left: 0;
    max-height: 40%;
    width: 100%;
    background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 2));
    & > p {
        max-width: calc(${IMAGE_CONTAINER_MAX_WIDTH}px - 10px);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        margin: 2px;
        text-align: center;
    }
    padding: 7px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    color: #fff;
    position: absolute;
`;

export const SelectedOverlay = styled('div')<{ selected: boolean }>`
    z-index: 5;
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    ${(props) => props.selected && 'border: 5px solid #51cd7c;'}
    border-radius: 4px;
`;

export const LivePhotoIndicatorOverlay = styled(Overlay)`
    display: flex;
    justify-content: flex-end;
    padding: 8px;
`;

const Cont = styled('div')<{ disabled: boolean }>`
    background: #222;
    display: flex;
    width: fit-content;
    margin-bottom: ${GAP_BTW_TILES}px;
    min-width: 100%;
    overflow: hidden;
    position: relative;
    flex: 1;
    cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};

    & > img {
        object-fit: cover;
        max-width: 100%;
        min-height: 100%;
        flex: 1;
        pointer-events: none;
    }

    & > svg {
        position: absolute;
        color: white;
        width: 50px;
        height: 50px;
        margin-left: 50%;
        margin-top: 50%;
        top: -25px;
        left: -25px;
        filter: drop-shadow(3px 3px 2px rgba(0, 0, 0, 0.7));
    }

    &:hover ${Check} {
        opacity: 0.5;
    }
    &:hover ${HoverOverlay} {
        opacity: 1;
    }
    border-radius: 4px;
`;

export default function PreviewCard(props: IProps) {
    const [imgSrc, setImgSrc] = useState<string>();
    const { thumbs } = useContext(GalleryContext);
    const {
        file,
        onClick,
        updateURL,
        forcedEnable,
        selectable,
        selected,
        onSelect,
        selectOnClick,
        onHover,
        onRangeSelect,
        isRangeSelectActive,
        isInsSelectRange,
    } = props;
    const isMounted = useRef(true);
    const publicCollectionGalleryContext = useContext(
        PublicCollectionGalleryContext
    );
    const deduplicateContext = useContext(DeduplicateContext);

    useLayoutEffect(() => {
        if (file && !file.msrc) {
            const main = async () => {
                try {
                    let url;
                    if (
                        publicCollectionGalleryContext.accessedThroughSharedURL
                    ) {
                        url =
                            await PublicCollectionDownloadManager.getThumbnail(
                                file,
                                publicCollectionGalleryContext.token,
                                publicCollectionGalleryContext.passwordToken
                            );
                    } else {
                        url = await DownloadManager.getThumbnail(file);
                    }
                    if (isMounted.current) {
                        setImgSrc(url);
                        thumbs.set(file.id, url);
                        if (updateURL) {
                            const newFile = updateURL(url);
                            file.msrc = newFile.msrc;
                            file.html = newFile.html;
                            file.src = newFile.src;
                            file.w = newFile.w;
                            file.h = newFile.h;
                        }
                    }
                } catch (e) {
                    logError(e, 'preview card useEffect failed');
                    // no-op
                }
            };

            if (thumbs.has(file.id)) {
                const thumbImgSrc = thumbs.get(file.id);
                setImgSrc(thumbImgSrc);
                file.msrc = thumbImgSrc;
            } else {
                main();
            }
        }

        return () => {
            // cool cool cool
            isMounted.current = false;
        };
    }, [file]);

    const handleClick = () => {
        if (selectOnClick) {
            if (isRangeSelectActive) {
                onRangeSelect();
            } else {
                onSelect(!selected);
            }
        } else if (file?.msrc || imgSrc) {
            onClick?.();
        }
    };

    const handleSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        if (isRangeSelectActive) {
            onRangeSelect?.();
        } else {
            onSelect(e.target.checked);
        }
    };

    const longPressCallback = () => {
        onSelect(!selected);
    };
    const handleHover = () => {
        if (isRangeSelectActive) {
            onHover();
        }
    };

    return (
        <Cont
            id={`thumb-${file?.id}`}
            onClick={handleClick}
            onMouseEnter={handleHover}
            disabled={!forcedEnable && !file?.msrc && !imgSrc}
            {...(selectable ? useLongPress(longPressCallback, 500) : {})}>
            {selectable && (
                <Check
                    type="checkbox"
                    checked={selected}
                    onChange={handleSelect}
                    active={isRangeSelectActive && isInsSelectRange}
                    onClick={(e) => e.stopPropagation()}
                />
            )}
            {(file?.msrc || imgSrc) && <img src={file?.msrc || imgSrc} />}
            {file?.metadata.fileType === 1 && <PlayCircleOutlineOutlinedIcon />}
            <SelectedOverlay selected={selected} />
            <HoverOverlay checked={selected} />
            <InSelectRangeOverLay
                active={isRangeSelectActive && isInsSelectRange}
            />
            {isLivePhoto(file) && <LivePhotoIndicator />}
            {deduplicateContext.isOnDeduplicatePage && (
                <FileAndCollectionNameOverlay>
                    <p>{file.metadata.title}</p>
                    <p>
                        {deduplicateContext.collectionNameMap.get(
                            file.collectionID
                        )}
                    </p>
                </FileAndCollectionNameOverlay>
            )}
            {props?.activeCollection === TRASH_SECTION && file.isTrashed && (
                <FileAndCollectionNameOverlay>
                    <p>{formatDateRelative(file.deleteBy / 1000)}</p>
                </FileAndCollectionNameOverlay>
            )}
        </Cont>
    );
}

function LivePhotoIndicator() {
    return (
        <LivePhotoIndicatorOverlay>
            <LivePhotoIcon />
        </LivePhotoIndicatorOverlay>
    );
}
