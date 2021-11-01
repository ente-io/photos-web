import React, { useEffect, useRef, useState } from 'react';
import Photoswipe from 'photoswipe';
import PhotoswipeUIDefault from 'photoswipe/dist/photoswipe-ui-default';
import classnames from 'classnames';
import FavButton from 'components/FavButton';
import {
    addToFavorites,
    removeFromFavorites,
} from 'services/collectionService';
import { File, updatePublicMagicMetadata } from 'services/fileService';
import constants from 'utils/strings/constants';
import exifr from 'exifr';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import styled from 'styled-components';
import events from './events';
import {
    changeFileCreationTime,
    changeFileName,
    downloadFile,
    formatDateTime,
    mergeMetadata,
} from 'utils/file';
import { FormCheck } from 'react-bootstrap';
import { prettyPrintExif } from 'utils/exif';
import EditIcon from 'components/icons/EditIcon';
import { FlexWrapper, Label, Row, Value } from 'components/Container';
import TickIcon from 'components/icons/TickIcon';
import CrossIcon from 'components/icons/CrossIcon';
import { logError } from 'utils/sentry';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Iprops {
    isOpen: boolean;
    items: any[];
    currentIndex?: number;
    onClose?: (needUpdate: boolean) => void;
    gettingData: (instance: any, index: number, item: File) => void;
    id?: string;
    className?: string;
    favItemIds: Set<number>;
    loadingBar: any;
    isSharedCollection: boolean;
    isTrashCollection: boolean;
}
enum EditableMetadata {
    CreationTime = 'creationTime',
    Title = 'title',
}

const LegendContainer = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Legend = styled.span`
    font-size: 20px;
    color: #ddd;
    display: inline;
`;

const Pre = styled.pre`
    color: #aaa;
    padding: 7px 15px;
`;

const ClickWrapper = (props) => <div {...props}></div>;

const renderInfoItem = (label: string, value: string | JSX.Element) => (
    <Row>
        <Label width="30%">{label}</Label>
        <Value width="70%">{value}</Value>
    </Row>
);

const EditCreationTime = ({ isInEditMode, creationTime, handleChange }) => {
    const creationDate = new Date(creationTime / 1000);
    const onChange = (pickedTime) => {
        const pickedUnixTime = (pickedTime as Date).getTime() * 1000;
        handleChange(pickedUnixTime);
    };
    return isInEditMode ? (
        <DatePicker
            open={isInEditMode}
            selected={creationDate}
            onChange={onChange}
            timeInputLabel="Time:"
            dateFormat="dd/MM/yyyy h:mm aa"
            showTimeInput
        />
    ) : (
        <>{formatDateTime(creationDate)}</>
    );
};

const EditTitle = ({ isInEditMode, newName, handleChange }) =>
    isInEditMode ? (
        <textarea
            value={newName}
            onChange={(e) => handleChange(e.target.value)}
            style={{ width: '100%' }}></textarea>
    ) : (
        <>{newName}</>
    );

function getLabel(propertyName) {
    switch (propertyName) {
        case EditableMetadata.CreationTime:
            return constants.CREATION_TIME;
        case EditableMetadata.Title:
            return constants.FILE_NAME;
        default:
            return '';
    }
}
function RenderEditableProp({
    file,
    propertyName,
    scheduleUpdate,
}: {
    file: File;
    scheduleUpdate: () => void;
    propertyName: EditableMetadata;
}) {
    const originalPropertyValue = file.metadata[propertyName];
    const [isInEditMode, setIsInEditMode] = useState(false);
    const label = getLabel(propertyName);
    const [editedProperty, setEditedProperty] = useState(originalPropertyValue);

    const openEditMode = () => setIsInEditMode(true);

    const saveEdits = async () => {
        try {
            if (isInEditMode && file) {
                let updatedFile = null;
                switch (propertyName) {
                    case EditableMetadata.CreationTime: {
                        const editedCreationTime = editedProperty as number;
                        updatedFile = await changeFileCreationTime(
                            file,
                            editedCreationTime
                        );
                        break;
                    }
                    case EditableMetadata.Title: {
                        const editedFileName = editedProperty as string;

                        updatedFile = await changeFileName(
                            file,
                            editedFileName
                        );
                        break;
                    }
                }
                await updatePublicMagicMetadata([updatedFile]);
                updatedFile.pubMagicMetadata.version += 1;
                file.pubMagicMetadata = updatedFile.pubMagicMetadata;
                file.metadata = mergeMetadata([file])[0].metadata;
                scheduleUpdate();
            }
        } catch (e) {
            logError(e, 'failed to update file property', { propertyName });
        }
        setIsInEditMode(false);
    };
    const discardEdits = () => {
        setEditedProperty(originalPropertyValue);
        setIsInEditMode(false);
    };
    const handleChange = (newValue) => {
        setEditedProperty(newValue);
    };
    return (
        <>
            <Row>
                <Label width="30%">{label}</Label>
                <Value
                    width={isInEditMode ? '50%' : '60%'}
                    style={{ textAlign: 'left' }}>
                    {propertyName === EditableMetadata.CreationTime && (
                        <EditCreationTime
                            isInEditMode={isInEditMode}
                            creationTime={editedProperty}
                            handleChange={handleChange}
                        />
                    )}
                    {propertyName === EditableMetadata.Title && (
                        <EditTitle
                            isInEditMode={isInEditMode}
                            newName={editedProperty}
                            handleChange={handleChange}
                        />
                    )}
                </Value>
                <Value
                    width={isInEditMode ? '20%' : '10%'}
                    style={{ cursor: 'pointer', marginLeft: '10px' }}>
                    {isInEditMode ? (
                        <FlexWrapper style={{ justifyContent: 'space-around' }}>
                            <ClickWrapper onClick={saveEdits}>
                                <TickIcon width="24px" height="24px" />
                            </ClickWrapper>
                            <ClickWrapper onClick={discardEdits}>
                                <CrossIcon />
                            </ClickWrapper>
                        </FlexWrapper>
                    ) : (
                        <ClickWrapper onClick={openEditMode}>
                            <EditIcon />
                        </ClickWrapper>
                    )}
                </Value>
            </Row>
            {isInEditMode && propertyName === EditableMetadata.CreationTime && (
                <div style={{ height: '205px' }} />
            )}
        </>
    );
}
function ExifData(props: { exif: any }) {
    const { exif } = props;
    const [showAll, setShowAll] = useState(false);

    const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShowAll(e.target.checked);
    };

    const renderAllValues = () => <Pre>{exif.raw}</Pre>;

    const renderSelectedValues = () => (
        <>
            {exif?.Make &&
                exif?.Model &&
                renderInfoItem(constants.DEVICE, `${exif.Make} ${exif.Model}`)}
            {exif?.ImageWidth &&
                exif?.ImageHeight &&
                renderInfoItem(
                    constants.IMAGE_SIZE,
                    `${exif.ImageWidth} x ${exif.ImageHeight}`
                )}
            {exif?.Flash && renderInfoItem(constants.FLASH, exif.Flash)}
            {exif?.FocalLength &&
                renderInfoItem(
                    constants.FOCAL_LENGTH,
                    exif.FocalLength.toString()
                )}
            {exif?.ApertureValue &&
                renderInfoItem(
                    constants.APERTURE,
                    exif.ApertureValue.toString()
                )}
            {exif?.ISOSpeedRatings &&
                renderInfoItem(constants.ISO, exif.ISOSpeedRatings.toString())}
        </>
    );

    return (
        <>
            <LegendContainer>
                <Legend>{constants.EXIF}</Legend>
                <FormCheck>
                    <FormCheck.Label>
                        <FormCheck.Input onChange={changeHandler} />
                        {constants.SHOW_ALL}
                    </FormCheck.Label>
                </FormCheck>
            </LegendContainer>
            {showAll ? renderAllValues() : renderSelectedValues()}
        </>
    );
}

function InfoModal({
    showInfo,
    handleCloseInfo,
    items,
    photoSwipe,
    metadata,
    exif,
    scheduleUpdate,
}) {
    return (
        <Modal show={showInfo} onHide={handleCloseInfo}>
            <Modal.Header closeButton>
                <Modal.Title>{constants.INFO}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div>
                    <Legend>{constants.METADATA}</Legend>
                </div>
                {renderInfoItem(
                    constants.FILE_ID,
                    items[photoSwipe?.getCurrentIndex()]?.id
                )}
                {metadata?.title && (
                    <RenderEditableProp
                        propertyName={EditableMetadata.Title}
                        file={items[photoSwipe?.getCurrentIndex()]}
                        scheduleUpdate={scheduleUpdate}
                    />
                )}
                {metadata?.creationTime && (
                    <RenderEditableProp
                        propertyName={EditableMetadata.CreationTime}
                        file={items[photoSwipe?.getCurrentIndex()]}
                        scheduleUpdate={scheduleUpdate}
                    />
                )}
                {metadata?.modificationTime &&
                    renderInfoItem(
                        constants.UPDATED_ON,
                        formatDateTime(metadata.modificationTime / 1000)
                    )}
                {metadata?.longitude > 0 &&
                    metadata?.longitude > 0 &&
                    renderInfoItem(
                        constants.LOCATION,
                        <a
                            href={`https://www.openstreetmap.org/?mlat=${metadata.latitude}&mlon=${metadata.longitude}#map=15/${metadata.latitude}/${metadata.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer">
                            {constants.SHOW_MAP}
                        </a>
                    )}
                {exif && (
                    <>
                        <ExifData exif={exif} />
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={handleCloseInfo}>
                    {constants.CLOSE}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

function PhotoSwipe(props: Iprops) {
    const pswpElement = useRef<HTMLDivElement>();
    const [photoSwipe, setPhotoSwipe] = useState<Photoswipe<any>>();

    const { isOpen, items } = props;
    const [isFav, setIsFav] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [metadata, setMetaData] = useState<File['metadata']>(null);
    const [exif, setExif] = useState<any>(null);
    const needUpdate = useRef(false);

    useEffect(() => {
        if (!pswpElement) return;
        if (isOpen) {
            openPhotoSwipe();
        }
        if (!isOpen) {
            closePhotoSwipe();
        }
        return () => {
            closePhotoSwipe();
        };
    }, [isOpen]);

    useEffect(() => {
        updateItems(items);
    }, [items]);

    useEffect(() => {
        if (photoSwipe) {
            photoSwipe.options.arrowKeys = !showInfo;
            photoSwipe.options.escKey = !showInfo;
        }
    }, [showInfo]);

    function updateFavButton() {
        setIsFav(isInFav(this?.currItem));
    }

    const openPhotoSwipe = () => {
        const { items, currentIndex } = props;
        const options = {
            history: false,
            maxSpreadZoom: 5,
            index: currentIndex,
            showHideOpacity: true,
            getDoubleTapZoom(isMouseClick, item) {
                if (isMouseClick) {
                    return 2.5;
                }
                // zoom to original if initial zoom is less than 0.7x,
                // otherwise to 1.5x, to make sure that double-tap gesture always zooms image
                return item.initialZoomLevel < 0.7 ? 1 : 1.5;
            },
            getThumbBoundsFn: (index) => {
                try {
                    const file = items[index];
                    const ele = document.getElementById(`thumb-${file.id}`);
                    if (ele) {
                        const rect = ele.getBoundingClientRect();
                        const pageYScroll =
                            window.pageYOffset ||
                            document.documentElement.scrollTop;
                        return {
                            x: rect.left,
                            y: rect.top + pageYScroll,
                            w: rect.width,
                        };
                    }
                    return null;
                } catch (e) {
                    return null;
                }
            },
        };
        const photoSwipe = new Photoswipe(
            pswpElement.current,
            PhotoswipeUIDefault,
            items,
            options
        );
        events.forEach((event) => {
            const callback = props[event];
            if (callback || event === 'destroy') {
                photoSwipe.listen(event, function (...args) {
                    if (callback) {
                        args.unshift(this);
                        callback(...args);
                    }
                    if (event === 'destroy') {
                        handleClose();
                    }
                    if (event === 'close') {
                        handleClose();
                    }
                });
            }
        });
        photoSwipe.listen('beforeChange', function () {
            updateInfo.call(this);
            updateFavButton.call(this);
        });
        photoSwipe.listen('resize', checkExifAvailable);
        photoSwipe.init();
        needUpdate.current = false;
        setPhotoSwipe(photoSwipe);
    };

    const closePhotoSwipe = () => {
        if (photoSwipe) photoSwipe.close();
    };

    const handleClose = () => {
        const { onClose } = props;
        if (typeof onClose === 'function') {
            onClose(needUpdate.current);
        }
        const videoTags = document.getElementsByTagName('video');
        for (const videoTag of videoTags) {
            videoTag.pause();
        }
        handleCloseInfo();
    };
    const isInFav = (file) => {
        const { favItemIds } = props;
        if (favItemIds && file) {
            return favItemIds.has(file.id);
        }
        return false;
    };

    const onFavClick = async (file) => {
        const { favItemIds } = props;
        if (!isInFav(file)) {
            favItemIds.add(file.id);
            addToFavorites(file);
            setIsFav(true);
        } else {
            favItemIds.delete(file.id);
            removeFromFavorites(file);
            setIsFav(false);
        }
        needUpdate.current = true;
    };

    const updateItems = (items = []) => {
        if (photoSwipe) {
            photoSwipe.items.length = 0;
            items.forEach((item) => {
                photoSwipe.items.push(item);
            });
            photoSwipe.invalidateCurrItems();
            // photoSwipe.updateSize(true);
        }
    };

    const checkExifAvailable = () => {
        setExif(null);
        setTimeout(() => {
            const img: HTMLImageElement = document.querySelector(
                '.pswp__img:not(.pswp__img--placeholder)'
            );
            if (img) {
                exifr.parse(img).then(function (exifData) {
                    if (!exifData) {
                        return;
                    }
                    exifData.raw = prettyPrintExif(exifData);
                    setExif(exifData);
                });
            }
        }, 100);
    };

    function updateInfo() {
        const file: File = this?.currItem;
        if (file?.metadata) {
            setMetaData(file.metadata);
            setExif(null);
            checkExifAvailable();
        }
    }

    const handleCloseInfo = () => {
        setShowInfo(false);
    };
    const handleOpenInfo = () => {
        setShowInfo(true);
    };

    const downloadFileHelper = async (file) => {
        const { loadingBar } = props;
        loadingBar.current.continuousStart();
        await downloadFile(file);
        loadingBar.current.complete();
    };
    const scheduleUpdate = () => (needUpdate.current = true);
    const { id } = props;
    let { className } = props;
    className = classnames(['pswp', className]).trim();
    return (
        <>
            <div
                id={id}
                className={className}
                tabIndex={Number('-1')}
                role="dialog"
                aria-hidden="true"
                ref={pswpElement}>
                <div className="pswp__bg" />
                <div className="pswp__scroll-wrap">
                    <div className="pswp__container">
                        <div className="pswp__item" />
                        <div className="pswp__item" />
                        <div className="pswp__item" />
                    </div>
                    <div className="pswp__ui pswp__ui--hidden">
                        <div className="pswp__top-bar">
                            <div className="pswp__counter" />

                            <button
                                className="pswp__button pswp__button--close"
                                title={constants.CLOSE}
                            />

                            <button
                                className="pswp-custom download-btn"
                                title={constants.DOWNLOAD}
                                onClick={() =>
                                    downloadFileHelper(photoSwipe.currItem)
                                }
                            />

                            <button
                                className="pswp__button pswp__button--fs"
                                title={constants.TOGGLE_FULLSCREEN}
                            />
                            <button
                                className="pswp__button pswp__button--zoom"
                                title={constants.ZOOM_IN_OUT}
                            />
                            {!props.isSharedCollection &&
                                !props.isTrashCollection && (
                                    <FavButton
                                        size={44}
                                        isClick={isFav}
                                        onClick={() => {
                                            onFavClick(photoSwipe?.currItem);
                                        }}
                                    />
                                )}
                            <button
                                className="pswp-custom info-btn"
                                title={constants.INFO}
                                onClick={handleOpenInfo}
                            />
                            <div className="pswp__preloader">
                                <div className="pswp__preloader__icn">
                                    <div className="pswp__preloader__cut">
                                        <div className="pswp__preloader__donut" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
                            <div className="pswp__share-tooltip" />
                        </div>
                        <button
                            className="pswp__button pswp__button--arrow--left"
                            title={constants.PREVIOUS}
                        />
                        <button
                            className="pswp__button pswp__button--arrow--right"
                            title={constants.NEXT}
                        />
                        <div className="pswp__caption">
                            <div />
                        </div>
                    </div>
                </div>
            </div>
            <InfoModal
                showInfo={showInfo}
                handleCloseInfo={handleCloseInfo}
                items={items}
                photoSwipe={photoSwipe}
                metadata={metadata}
                exif={exif}
                scheduleUpdate={scheduleUpdate}
            />
        </>
    );
}

export default PhotoSwipe;
