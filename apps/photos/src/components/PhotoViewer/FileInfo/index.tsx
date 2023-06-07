import React, { useContext, useEffect, useMemo, useState } from 'react';
import { RenderFileName } from './RenderFileName';
import { RenderCreationTime } from './RenderCreationTime';
import { Box, DialogProps, Link, Stack, styled } from '@mui/material';
import { getEXIFLocation } from 'services/upload/exifService';
import { RenderCaption } from './RenderCaption';

import CopyButton from 'components/CodeBlock/CopyButton';
import { formatDate, formatTime } from 'utils/time/format';
import Titlebar from 'components/Titlebar';
import MapBox from './MapBox';
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

export const FileInfoSidebar = styled((props: DialogProps) => (
    <EnteDrawer {...props} anchor="right" />
))({
    zIndex: 1501,
    '& .MuiPaper-root': {
        padding: 8,
    },
});

interface Iprops {
    shouldDisableEdits?: boolean;
    showInfo: boolean;
    handleCloseInfo: () => void;
    file: EnteFile;
    exif: any;
    scheduleUpdate: () => void;
    refreshPhotoswipe: () => void;
    fileToCollectionsMap?: Map<number, number[]>;
    collectionNameMap?: Map<number, string>;
    showCollectionChips: boolean;
}

function BasicDeviceCamera({
    parsedExifData,
}: {
    parsedExifData: Record<string, any>;
}) {
    return (
        <FlexWrapper gap={1}>
            <Box>{parsedExifData['fNumber']}</Box>
            <Box>{parsedExifData['exposureTime']}</Box>
            <Box>{parsedExifData['ISO']}</Box>
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
    exif,
    scheduleUpdate,
    refreshPhotoswipe,
    fileToCollectionsMap,
    collectionNameMap,
    showCollectionChips,
}: Iprops) {
    const appContext = useContext(AppContext);
    const [parsedExifData, setParsedExifData] = useState<Record<string, any>>();
    const [showExif, setShowExif] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [updateMLDataIndex, setUpdateMLDataIndex] = useState(0);

    const openExif = () => setShowExif(true);
    const closeExif = () => setShowExif(false);

    const location = useMemo(() => {
        if (file && file.metadata) {
            if (
                (file.metadata.latitude || file.metadata.latitude === 0) &&
                !(file.metadata.longitude === 0 && file.metadata.latitude === 0)
            ) {
                return {
                    latitude: file.metadata.latitude,
                    longitude: file.metadata.longitude,
                };
            }
        }
        if (exif) {
            const exifLocation = getEXIFLocation(exif);
            if (
                (exifLocation.latitude || exifLocation.latitude === 0) &&
                !(exifLocation.longitude === 0 && exifLocation.latitude === 0)
            ) {
                return exifLocation;
            }
        }
        return null;
    }, [file, exif]);

    useEffect(() => {
        if (!exif) {
            setParsedExifData({});
            return;
        }
        const parsedExifData = {};
        if (exif['fNumber']) {
            parsedExifData['fNumber'] = `f/${Math.ceil(exif['FNumber'])}`;
        } else if (exif['ApertureValue'] && exif['FocalLength']) {
            parsedExifData['fNumber'] = `f/${Math.ceil(
                exif['FocalLength'] / exif['ApertureValue']
            )}`;
        }
        const imageWidth = exif['ImageWidth'] ?? exif['ExifImageWidth'];
        const imageHeight = exif['ImageHeight'] ?? exif['ExifImageHeight'];
        if (imageWidth && imageHeight) {
            parsedExifData['resolution'] = `${imageWidth} x ${imageHeight}`;
            const megaPixels = Math.round((imageWidth * imageHeight) / 1000000);
            if (megaPixels) {
                parsedExifData['megaPixels'] = `${Math.round(
                    (imageWidth * imageHeight) / 1000000
                )}MP`;
            }
        }
        if (exif['Make'] && exif['Model']) {
            parsedExifData[
                'takenOnDevice'
            ] = `${exif['Make']} ${exif['Model']}`;
        }
        if (exif['ExposureTime']) {
            parsedExifData['exposureTime'] = `1/${
                1 / parseFloat(exif['ExposureTime'])
            }`;
        }
        if (exif['ISO']) {
            parsedExifData['ISO'] = `ISO${exif['ISO']}`;
        }
        setParsedExifData(parsedExifData);
    }, [exif]);

    if (!file) {
        return <></>;
    }
    console.log(file);

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
                {parsedExifData && parsedExifData['takenOnDevice'] && (
                    <InfoItem
                        icon={<CameraOutlined />}
                        title={parsedExifData['takenOnDevice']}
                        caption={
                            <BasicDeviceCamera
                                parsedExifData={parsedExifData}
                            />
                        }
                        hideEditOption
                    />
                )}

                {location && (
                    <div>
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
                        <MapBox />
                    </div>
                )}
                <InfoItem
                    icon={<TextSnippetOutlined />}
                    title={t('DETAILS')}
                    caption={
                        typeof exif === 'undefined' ? (
                            <EnteSpinner size={11.33} />
                        ) : exif !== null ? (
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
                {showCollectionChips && (
                    <InfoItem icon={<FolderOutlined />} hideEditOption>
                        <Box
                            display={'flex'}
                            gap={1}
                            flexWrap="wrap"
                            justifyContent={'flex-start'}
                            alignItems={'flex-start'}>
                            {fileToCollectionsMap
                                ?.get(file.id)
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
                exif={exif}
                open={showExif}
                onClose={closeExif}
                onInfoClose={handleCloseInfo}
                filename={file.metadata.title}
            />
        </FileInfoSidebar>
    );
}
