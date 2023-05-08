import React, { useContext, useMemo, useState } from 'react';
import { RenderFileName } from './RenderFileName';
import { RenderCreationTime } from './RenderCreationTime';
import { Box, DialogProps, Link, Stack, styled } from '@mui/material';
import {
    ParsedEXIFData,
    isValidGeoLocation,
} from 'services/upload/exifService';
import { RenderCaption } from './RenderCaption';

import CopyButton from 'components/CodeBlock/CopyButton';
import { formatDate, formatTime } from 'utils/time/format';
import Titlebar from 'components/Titlebar';
import InfoItem from './InfoItem';
import { FlexWrapper } from 'components/Container';
import EnteSpinner from 'components/EnteSpinner';
import { EnteFile } from 'types/file';
import { Chip } from 'components/Chip';
import LinkButton from 'components/pages/gallery/LinkButton';
import { ExifData } from './ExifData';
import { EnteDrawer } from 'components/EnteDrawer';
import CameraOutlined from '@mui/icons-material/CameraOutlined';
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined';
import TextSnippetOutlined from '@mui/icons-material/TextSnippetOutlined';
import FolderOutlined from '@mui/icons-material/FolderOutlined';
import BackupOutlined from '@mui/icons-material/BackupOutlined';

import {
    PhotoPeopleList,
    UnidentifiedFaces,
} from 'components/MachineLearning/PeopleList';

import { ObjectLabelList } from 'components/MachineLearning/ObjectList';

// import MLServiceFileInfoButton from 'components/MachineLearning/MLServiceFileInfoButton';
import { AppContext } from 'pages/_app';
import { t } from 'i18next';
import { GeoLocation } from 'types/upload';

export const FileInfoSidebar = styled((props: DialogProps) => (
    <EnteDrawer {...props} anchor="right" />
))({
    zIndex: 1501,
    '& .MuiPaper-root': {
        padding: 8,
    },
});

interface Iprops {
    shouldDisableEdits: boolean;
    showInfo: boolean;
    handleCloseInfo: () => void;
    file: EnteFile;
    parsedExifData: ParsedEXIFData;
    scheduleUpdate: () => void;
    refreshPhotoswipe: () => void;
    fileToCollectionsMap: Map<number, number[]>;
    collectionNameMap: Map<number, string>;
    isTrashCollection: boolean;
}

function renderFNumber(fNumber: number) {
    return fNumber && `f/${fNumber}`;
}

function renderExposureTime(exposureTime: number) {
    return exposureTime && `1/${Math.round(1 / exposureTime)}`;
}

function renderISO(iso: number) {
    return iso && `ISO ${iso}`;
}

function BasicDeviceCamera({
    parsedExifData,
}: {
    parsedExifData: ParsedEXIFData;
}) {
    return (
        <FlexWrapper gap={1}>
            <Box>{renderFNumber(parsedExifData.fNumber)}</Box>
            <Box>{renderExposureTime(parsedExifData.exposureTime)}</Box>
            <Box>{renderISO(parsedExifData.iso)}</Box>
        </FlexWrapper>
    );
}

function getOpenStreetMapLink(location: {
    latitude: number;
    longitude: number;
}) {
    return `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=15/${location.latitude}/${location.longitude}`;
}

export function FileInfo({
    shouldDisableEdits,
    showInfo,
    handleCloseInfo,
    file,
    parsedExifData,
    scheduleUpdate,
    refreshPhotoswipe,
    fileToCollectionsMap,
    collectionNameMap,
    isTrashCollection,
}: Iprops) {
    const appContext = useContext(AppContext);
    const [showExif, setShowExif] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [updateMLDataIndex, setUpdateMLDataIndex] = useState(0);

    const openExif = () => setShowExif(true);
    const closeExif = () => setShowExif(false);

    const location = useMemo(() => {
        if (file) {
            const location: GeoLocation = {
                latitude: file.metadata.latitude,
                longitude: file.metadata.longitude,
            };
            if (isValidGeoLocation(location)) {
                return location;
            }
        } else if (parsedExifData) {
            const location = {
                latitude: parsedExifData.latitude,
                longitude: parsedExifData.longitude,
            };
            if (isValidGeoLocation(location)) {
                return location;
            }
        } else {
            return null;
        }
    }, [file, parsedExifData]);

    if (!file) {
        return <></>;
    }

    return (
        <FileInfoSidebar open={showInfo} onClose={handleCloseInfo}>
            <Titlebar onClose={handleCloseInfo} title={t('INFO')} backIsClose />
            <Stack pt={1} pb={3} spacing={'20px'}>
                <RenderCaption
                    shouldDisableEdits={shouldDisableEdits}
                    file={file}
                    scheduleUpdate={scheduleUpdate}
                    refreshPhotoswipe={refreshPhotoswipe}
                />

                <RenderCreationTime
                    shouldDisableEdits={shouldDisableEdits}
                    file={file}
                    scheduleUpdate={scheduleUpdate}
                />

                <RenderFileName
                    parsedExifData={parsedExifData}
                    shouldDisableEdits={shouldDisableEdits}
                    file={file}
                    scheduleUpdate={scheduleUpdate}
                />
                {parsedExifData && parsedExifData.takenOnDevice && (
                    <InfoItem
                        icon={<CameraOutlined />}
                        title={parsedExifData.takenOnDevice}
                        caption={
                            <BasicDeviceCamera
                                parsedExifData={parsedExifData}
                            />
                        }
                        hideEditOption
                    />
                )}

                {location && (
                    <InfoItem
                        icon={<LocationOnOutlined />}
                        title={t('LOCATION')}
                        caption={
                            <Link
                                href={getOpenStreetMapLink(location)}
                                target="_blank"
                                sx={{ fontWeight: 'bold' }}>
                                {t('SHOW_ON_MAP')}
                            </Link>
                        }
                        customEndButton={
                            <CopyButton
                                code={getOpenStreetMapLink(location)}
                                color="secondary"
                                size="medium"
                            />
                        }
                    />
                )}
                <InfoItem
                    icon={<TextSnippetOutlined />}
                    title={t('DETAILS')}
                    caption={
                        typeof parsedExifData === 'undefined' ? (
                            <EnteSpinner size={11.33} />
                        ) : parsedExifData !== null ? (
                            <LinkButton
                                onClick={openExif}
                                sx={{
                                    textDecoration: 'none',
                                    color: 'text.muted',
                                    fontWeight: 'bold',
                                }}>
                                {t('VIEW_EXIF')}
                            </LinkButton>
                        ) : (
                            t('NO_EXIF')
                        )
                    }
                    hideEditOption
                />
                <InfoItem
                    icon={<BackupOutlined />}
                    title={formatDate(file.metadata.modificationTime / 1000)}
                    caption={formatTime(file.metadata.modificationTime / 1000)}
                    hideEditOption
                />
                {!isTrashCollection && (
                    <InfoItem icon={<FolderOutlined />} hideEditOption>
                        <Box
                            display={'flex'}
                            gap={1}
                            flexWrap="wrap"
                            justifyContent={'flex-start'}
                            alignItems={'flex-start'}>
                            {fileToCollectionsMap
                                .get(file.id)
                                ?.filter((collectionID) =>
                                    collectionNameMap.has(collectionID)
                                )
                                ?.map((collectionID) => (
                                    <Chip key={collectionID}>
                                        {collectionNameMap.get(collectionID)}
                                    </Chip>
                                ))}
                        </Box>
                    </InfoItem>
                )}
                {appContext.mlSearchEnabled && (
                    <>
                        <PhotoPeopleList
                            file={file}
                            updateMLDataIndex={updateMLDataIndex}
                        />
                        <UnidentifiedFaces
                            file={file}
                            updateMLDataIndex={updateMLDataIndex}
                        />
                        <ObjectLabelList
                            file={file}
                            updateMLDataIndex={updateMLDataIndex}
                        />

                        {/* <Box pt={1}>
                            <MLServiceFileInfoButton
                                file={file}
                                updateMLDataIndex={updateMLDataIndex}
                                setUpdateMLDataIndex={setUpdateMLDataIndex}
                            />
                        </Box> */}
                    </>
                )}
            </Stack>
            <ExifData
                exif={parsedExifData}
                open={showExif}
                onClose={closeExif}
                onInfoClose={handleCloseInfo}
                filename={file.metadata.title}
            />
        </FileInfoSidebar>
    );
}
