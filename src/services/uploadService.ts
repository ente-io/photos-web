import { getEndpoint } from 'utils/common/apiUtil';
import HTTPService from './HTTPService';
import EXIF from 'exif-js';
import { File, fileAttribute } from './fileService';
import { Collection } from './collectionService';
import { FILE_TYPE, SetFiles } from 'pages/gallery';
import { retryAsyncFunction, sleep } from 'utils/common';
import {
    handleError,
    parseError,
    THUMBNAIL_GENERATION_FAILED,
} from 'utils/common/errorUtil';
import { ComlinkWorker, getDedicatedCryptoWorker } from 'utils/crypto';
import * as convert from 'xml-js';
import { ENCRYPTION_CHUNK_SIZE } from 'types';
import { getToken } from 'utils/common/key';
import {
    convertHEIC2JPEG,
    sortFilesIntoCollections,
    sortFiles,
    decryptFile,
    removeUnneccessaryFileProps,
} from 'utils/file';
import { logError } from 'utils/sentry';
import localForage from 'utils/storage/localForage';
import FileType, { FileTypeResult } from 'file-type/browser';
const ENDPOINT = getEndpoint();

const THUMBNAIL_HEIGHT = 720;
const MAX_URL_REQUESTS = 50;
const MAX_ATTEMPTS = 3;
const MIN_THUMBNAIL_SIZE = 50000;
const MAX_CONCURRENT_UPLOADS = 4;
const TYPE_IMAGE = 'image';
const TYPE_VIDEO = 'video';
const TYPE_HEIC = 'heic';
const TYPE_JSON = 'json';
const SOUTH_DIRECTION = 'S';
const WEST_DIRECTION = 'W';
const MIN_STREAM_FILE_SIZE = 20 * 1024 * 1024;
const CHUNKS_COMBINED_FOR_UPLOAD = 5;
const RANDOM_PERCENTAGE_PROGRESS_FOR_PUT = () => 90 + 10 * Math.random();
const NULL_LOCATION: Location = { latitude: null, longitude: null };
const WAIT_TIME_THUMBNAIL_GENERATION = 10 * 1000;
const FILE_UPLOAD_COMPLETED = 100;
const EDITED_FILE_SUFFIX = '-edited';
const TwoSecondInMillSeconds = 2000;

export enum FileUploadErrorCode {
    FAILED = -1,
    SKIPPED = -2,
    UNSUPPORTED = -3,
}

interface Location {
    latitude: number;
    longitude: number;
}
interface ParsedEXIFData {
    location: Location;
    creationTime: number;
}
export interface FileWithCollection {
    file: globalThis.File;
    collection: Collection;
}
export interface DataStream {
    stream: ReadableStream<Uint8Array>;
    chunkCount: number;
}

function isDataStream(object: any): object is DataStream {
    return 'stream' in object;
}
interface EncryptionResult {
    file: fileAttribute;
    key: string;
}
export interface B64EncryptionResult {
    encryptedData: string;
    key: string;
    nonce: string;
}

interface UploadURL {
    url: string;
    objectKey: string;
}

interface MultipartUploadURLs {
    objectKey: string;
    partURLs: string[];
    completeURL: string;
}

export interface MetadataObject {
    title: string;
    creationTime: number;
    modificationTime: number;
    latitude: number;
    longitude: number;
    fileType: FILE_TYPE;
    hasStaticThumbnail?: boolean;
}

interface FileInMemory {
    filedata: Uint8Array | DataStream;
    thumbnail: Uint8Array;
    metadata: MetadataObject;
}

interface EncryptedFile {
    file: ProcessedFile;
    fileKey: B64EncryptionResult;
}
interface ProcessedFile {
    file: fileAttribute;
    thumbnail: fileAttribute;
    metadata: fileAttribute;
    filename: string;
}
interface BackupedFile extends Omit<ProcessedFile, 'filename'> { }

interface uploadFile extends BackupedFile {
    collectionID: number;
    encryptedKey: string;
    keyDecryptionNonce: string;
}

export enum UPLOAD_STAGES {
    START,
    READING_GOOGLE_METADATA_FILES,
    UPLOADING,
    FINISH,
}

class UploadService {
    private cryptoWorkers = new Array<ComlinkWorker>(MAX_CONCURRENT_UPLOADS);
    private uploadURLs: UploadURL[] = [];
    private uploadURLFetchInProgress: Promise<any> = null;
    private perFileProgress: number;
    private filesCompleted: number;
    private totalFileCount: number;
    private fileProgress: Map<string, number>;
    private uploadResult:Map<string, number>;
    private metadataMap: Map<string, Object>;
    private filesToBeUploaded: FileWithCollection[];
    private progressBarProps;
    private failedFiles: FileWithCollection[];
    private existingFilesCollectionWise: Map<number, File[]>;
    private existingFiles: File[];
    private setFiles:SetFiles;
    public async uploadFiles(
        filesWithCollectionToUpload: FileWithCollection[],
        existingFiles: File[],
        progressBarProps,
        setFiles:SetFiles,
    ) {
        try {
            progressBarProps.setUploadStage(UPLOAD_STAGES.START);

            this.filesCompleted = 0;
            this.fileProgress = new Map<string, number>();
            this.uploadResult = new Map<string, number>();
            this.failedFiles = [];
            this.metadataMap = new Map<string, object>();
            this.progressBarProps = progressBarProps;
            this.existingFiles=existingFiles;
            this.existingFilesCollectionWise = sortFilesIntoCollections(existingFiles);
            this.updateProgressBarUI();
            this.setFiles=setFiles;
            const metadataFiles: globalThis.File[] = [];
            const actualFiles: FileWithCollection[] = [];
            filesWithCollectionToUpload.forEach((fileWithCollection) => {
                const file = fileWithCollection.file;
                if (file?.name.substr(0, 1) === '.') {
                    // ignore files with name starting with . (hidden files)
                    return;
                }
                if (file.name.endsWith(TYPE_JSON)) {
                    metadataFiles.push(fileWithCollection.file);
                } else {
                    actualFiles.push(fileWithCollection);
                }
            });
            this.filesToBeUploaded = actualFiles;

            progressBarProps.setUploadStage(
                UPLOAD_STAGES.READING_GOOGLE_METADATA_FILES,
            );
            this.totalFileCount = metadataFiles.length;
            this.perFileProgress = 100 / metadataFiles.length;
            this.filesCompleted = 0;

            for (const rawFile of metadataFiles) {
                await this.seedMetadataMap(rawFile);
                this.filesCompleted++;
                this.updateProgressBarUI();
            }

            progressBarProps.setUploadStage(UPLOAD_STAGES.START);
            this.totalFileCount = actualFiles.length;
            this.perFileProgress = 100 / actualFiles.length;
            this.filesCompleted = 0;
            this.updateProgressBarUI();
            try {
                await this.fetchUploadURLs();
            } catch (e) {
                logError(e, 'error fetching uploadURLs');
                const { parsedError, parsed } = parseError(e);
                if (parsed) {
                    throw parsedError;
                }
            }
            const uploadProcesses = [];
            for (
                let i = 0;
                i < MAX_CONCURRENT_UPLOADS;
                i++
            ) {
                if (this.filesToBeUploaded.length>0) {
                    const fileWithCollection= this.filesToBeUploaded.pop();
                    this.cryptoWorkers[i] = getDedicatedCryptoWorker();
                    uploadProcesses.push(
                        this.uploader(
                            await new this.cryptoWorkers[i].comlink(),
                            new FileReader(),
                            fileWithCollection,
                        ),
                    );
                }
            }
            progressBarProps.setUploadStage(UPLOAD_STAGES.UPLOADING);
            await Promise.all(uploadProcesses);
            progressBarProps.setUploadStage(UPLOAD_STAGES.FINISH);
            progressBarProps.setPercentComplete(FILE_UPLOAD_COMPLETED);
        } catch (e) {
            logError(e, 'uploading failed with error');
            this.filesToBeUploaded = [];
            throw e;
        } finally {
            for (let i = 0; i < MAX_CONCURRENT_UPLOADS; i++) {
                this.cryptoWorkers[i]?.worker.terminate();
            }
        }
    }

    private async uploader(
        worker: any,
        reader: FileReader,
        fileWithCollection: FileWithCollection,
    ) {
        const { file: rawFile, collection } = fileWithCollection;
        this.fileProgress.set(rawFile.name, 0);
        this.updateProgressBarUI();
        try {
            let file: FileInMemory = null;
            let unsupported=false;
            try {
                file=await this.readFile(reader, rawFile);
            } catch (e) {
                unsupported=true;
            }
            if (unsupported || file.metadata.fileType===FILE_TYPE.OTHERS) {
                this.fileProgress.set(rawFile.name, FileUploadErrorCode.UNSUPPORTED);
                this.updateProgressBarUI();
                await sleep(TwoSecondInMillSeconds);
            } else if (this.fileAlreadyInCollection(file, collection)) {
                // set progress to -2 indicating that file upload was skipped
                this.fileProgress.set(rawFile.name, FileUploadErrorCode.SKIPPED);
                this.updateProgressBarUI();
                await sleep(TwoSecondInMillSeconds);
            } else {
                let encryptedFile: EncryptedFile =
                    await this.encryptFile(worker, file, collection.key);

                let backupedFile: BackupedFile = await this.uploadToBucket(
                    encryptedFile.file,
                );

                let uploadFile: uploadFile = this.getUploadFile(
                    collection,
                    backupedFile,
                    encryptedFile.fileKey,
                );

                encryptedFile = null;
                backupedFile = null;

                const uploadedFile =await this.uploadFile(uploadFile);
                const decryptedFile=await decryptFile(uploadedFile, collection);

                this.existingFiles.push(decryptedFile);
                this.existingFiles=sortFiles(this.existingFiles);
                await localForage.setItem('files', removeUnneccessaryFileProps(this.existingFiles));
                this.setFiles(this.existingFiles);

                file = null;
                uploadFile = null;

                this.filesCompleted++;
            }
        } catch (e) {
            logError(e, 'file upload failed');
            this.failedFiles.push(fileWithCollection);
            // set progress to -1 indicating that file upload failed but keep it to show in the file-upload list progress
            this.fileProgress.set(rawFile.name, FileUploadErrorCode.FAILED);
            handleError(e);
        }
        this.uploadResult.set(rawFile.name, this.fileProgress.get(rawFile.name));
        this.fileProgress.delete(rawFile.name);
        this.updateProgressBarUI();

        if (this.filesToBeUploaded.length > 0) {
            await this.uploader(
                worker,
                reader,
                this.filesToBeUploaded.pop(),
            );
        }
    }
    async retryFailedFiles(localFiles:File[]) {
        await this.uploadFiles(this.failedFiles, localFiles, this.progressBarProps, this.setFiles);
    }

    private updateProgressBarUI() {
        const { setPercentComplete, setFileCounter, setFileProgress, setUploadResult } =
            this.progressBarProps;
        setFileCounter({
            finished: this.filesCompleted,
            total: this.totalFileCount,
        });
        let percentComplete = this.perFileProgress * this.filesCompleted;
        if (this.fileProgress) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [_, progress] of this.fileProgress) {
                // filter  negative indicator values during percentComplete calculation
                if (progress < 0) {
                    continue;
                }
                percentComplete += (this.perFileProgress * progress) / 100;
            }
        }
        setPercentComplete(percentComplete);
        setFileProgress(this.fileProgress);
        setUploadResult(this.uploadResult);
    }

    private fileAlreadyInCollection(
        newFile: FileInMemory,
        collection: Collection,
    ): boolean {
        const collectionFiles =
            this.existingFilesCollectionWise.get(collection.id) ?? [];
        for (const existingFile of collectionFiles) {
            if (this.areFilesSame(existingFile.metadata, newFile.metadata)) {
                return true;
            }
        }
        return false;
    }
    private areFilesSame(
        existingFile: MetadataObject,
        newFile: MetadataObject,
    ): boolean {
        if (
            existingFile.fileType === newFile.fileType &&
            existingFile.creationTime === newFile.creationTime &&
            existingFile.modificationTime === newFile.modificationTime &&
            existingFile.title === newFile.title
        ) {
            return true;
        } else {
            return false;
        }
    }

    private async readFile(reader: FileReader, receivedFile: globalThis.File) {
        try {
            const filedata =
                receivedFile.size > MIN_STREAM_FILE_SIZE ?
                    this.getFileStream(reader, receivedFile) :
                    await this.getUint8ArrayView(reader, receivedFile);

            let fileType: FILE_TYPE;
            const mimeType=await this.getMimeType(filedata);
            switch (mimeType.split('/')[0]) {
                case TYPE_IMAGE:
                    fileType = FILE_TYPE.IMAGE;
                    break;
                case TYPE_VIDEO:
                    fileType = FILE_TYPE.VIDEO;
                    break;
                default:
                    fileType = FILE_TYPE.OTHERS;
            }
            const isHEIC= mimeType.split('/')[1].toLocaleLowerCase()===TYPE_HEIC;

            const { thumbnail, hasStaticThumbnail } = await this.generateThumbnail(
                reader,
                receivedFile,
                fileType,
                isHEIC,
            );

            const { location, creationTime } = await this.getExifData(
                reader,
                receivedFile,
                fileType,
            );
            let receivedFileOriginalName = receivedFile.name;
            if (receivedFile.name.endsWith(EDITED_FILE_SUFFIX)) {
                receivedFileOriginalName = receivedFile.name.slice(
                    0,
                    -1 * EDITED_FILE_SUFFIX.length,
                );
            }
            const metadata = Object.assign(
                {
                    title: receivedFile.name,
                    creationTime:
                        creationTime || receivedFile.lastModified * 1000,
                    modificationTime: receivedFile.lastModified * 1000,
                    latitude: location?.latitude,
                    longitude: location?.latitude,
                    fileType,
                },
                this.metadataMap.get(receivedFileOriginalName),
            );
            if (hasStaticThumbnail) {
                metadata['hasStaticThumbnail'] = hasStaticThumbnail;
            }

            return {
                filedata,
                thumbnail,
                metadata,
            };
        } catch (e) {
            logError(e, 'error reading files');
            throw e;
        }
    }

    private async encryptFile(
        worker: any,
        file: FileInMemory,
        encryptionKey: string,
    ): Promise<EncryptedFile> {
        try {
            const { key: fileKey, file: encryptedFiledata }: EncryptionResult =
                isDataStream(file.filedata) ?
                    await this.encryptFileStream(worker, file.filedata) :
                    await worker.encryptFile(file.filedata);

            const { file: encryptedThumbnail }: EncryptionResult =
                await worker.encryptThumbnail(file.thumbnail, fileKey);
            const { file: encryptedMetadata }: EncryptionResult =
                await worker.encryptMetadata(file.metadata, fileKey);

            const encryptedKey: B64EncryptionResult = await worker.encryptToB64(
                fileKey,
                encryptionKey,
            );

            const result: EncryptedFile = {
                file: {
                    file: encryptedFiledata,
                    thumbnail: encryptedThumbnail,
                    metadata: encryptedMetadata,
                    filename: file.metadata.title,
                },
                fileKey: encryptedKey,
            };
            return result;
        } catch (e) {
            logError(e, 'Error encrypting files');
            throw e;
        }
    }

    private async encryptFileStream(worker, fileData: DataStream) {
        const { stream, chunkCount } = fileData;
        const fileStreamReader = stream.getReader();
        const { key, decryptionHeader, pushState } =
            await worker.initChunkEncryption();
        const ref = { pullCount: 1 };
        const encryptedFileStream = new ReadableStream({
            async pull(controller) {
                const { value } = await fileStreamReader.read();
                const encryptedFileChunk = await worker.encryptFileChunk(
                    value,
                    pushState,
                    ref.pullCount === chunkCount,
                );
                controller.enqueue(encryptedFileChunk);
                if (ref.pullCount === chunkCount) {
                    controller.close();
                }
                ref.pullCount++;
            },
        });
        return {
            key,
            file: {
                decryptionHeader,
                encryptedData: { stream: encryptedFileStream, chunkCount },
            },
        };
    }

    private async uploadToBucket(file: ProcessedFile): Promise<BackupedFile> {
        try {
            let fileObjectKey;
            if (isDataStream(file.file.encryptedData)) {
                const { chunkCount, stream } = file.file.encryptedData;
                const uploadPartCount = Math.ceil(
                    chunkCount / CHUNKS_COMBINED_FOR_UPLOAD,
                );
                const filePartUploadURLs = await this.fetchMultipartUploadURLs(
                    uploadPartCount,
                );
                fileObjectKey = await this.putFileInParts(
                    filePartUploadURLs,
                    stream,
                    file.filename,
                    uploadPartCount,
                );
            } else {
                const fileUploadURL = await this.getUploadURL();
                fileObjectKey = await this.putFile(
                    fileUploadURL,
                    file.file.encryptedData,
                    file.filename,
                );
            }
            const thumbnailUploadURL = await this.getUploadURL();
            const thumbnailObjectKey = await this.putFile(
                thumbnailUploadURL,
                file.thumbnail.encryptedData as Uint8Array,
                null,
            );

            const backupedFile: BackupedFile = {
                file: {
                    decryptionHeader: file.file.decryptionHeader,
                    objectKey: fileObjectKey,
                },
                thumbnail: {
                    decryptionHeader: file.thumbnail.decryptionHeader,
                    objectKey: thumbnailObjectKey,
                },
                metadata: file.metadata,
            };
            return backupedFile;
        } catch (e) {
            logError(e, 'error uploading to bucket');
            throw e;
        }
    }

    private getUploadFile(
        collection: Collection,
        backupedFile: BackupedFile,
        fileKey: B64EncryptionResult,
    ): uploadFile {
        const uploadFile: uploadFile = {
            collectionID: collection.id,
            encryptedKey: fileKey.encryptedData,
            keyDecryptionNonce: fileKey.nonce,
            ...backupedFile,
        };
        uploadFile;
        return uploadFile;
    }

    private async uploadFile(uploadFile: uploadFile):Promise<File> {
        try {
            const token = getToken();
            if (!token) {
                return;
            }
            const response = await retryAsyncFunction(()=>HTTPService.post(
                `${ENDPOINT}/files`,
                uploadFile,
                null,
                {
                    'X-Auth-Token': token,
                },
            ));
            return response.data;
        } catch (e) {
            logError(e, 'upload Files Failed');
            throw e;
        }
    }

    private async seedMetadataMap(receivedFile: globalThis.File) {
        try {
            const metadataJSON: object = await new Promise(
                (resolve, reject) => {
                    const reader = new FileReader();
                    reader.onabort = () => reject(Error('file reading was aborted'));
                    reader.onerror = () => reject(Error('file reading has failed'));
                    reader.onload = () => {
                        const result =
                            typeof reader.result !== 'string' ?
                                new TextDecoder().decode(reader.result) :
                                reader.result;
                        resolve(JSON.parse(result));
                    };
                    reader.readAsText(receivedFile);
                },
            );

            const metaDataObject = {};
            if (!metadataJSON) {
                return;
            }
            if (
                metadataJSON['photoTakenTime'] &&
                metadataJSON['photoTakenTime']['timestamp']
            ) {
                metaDataObject['creationTime'] =
                    metadataJSON['photoTakenTime']['timestamp'] * 1000000;
            }
            if (
                metadataJSON['modificationTime'] &&
                metadataJSON['modificationTime']['timestamp']
            ) {
                metaDataObject['modificationTime'] =
                    metadataJSON['modificationTime']['timestamp'] * 1000000;
            }
            let locationData = null;
            if (
                metadataJSON['geoData'] &&
                (metadataJSON['geoData']['latitude'] !== 0.0 ||
                    metadataJSON['geoData']['longitude'] !== 0.0)
            ) {
                locationData = metadataJSON['geoData'];
            } else if (
                metadataJSON['geoDataExif'] &&
                (metadataJSON['geoDataExif']['latitude'] !== 0.0 ||
                    metadataJSON['geoDataExif']['longitude'] !== 0.0)
            ) {
                locationData = metadataJSON['geoDataExif'];
            }
            if (locationData !== null) {
                metaDataObject['latitude'] = locationData['latitude'];
                metaDataObject['longitude'] = locationData['longitude'];
            }
            this.metadataMap.set(metadataJSON['title'], metaDataObject);
        } catch (e) {
            logError(e);
            // ignore
        }
    }
    private async generateThumbnail(
        reader: FileReader,
        file: globalThis.File,
        fileType:FILE_TYPE,
        isHEIC:boolean,
    ): Promise<{ thumbnail: Uint8Array, hasStaticThumbnail: boolean }> {
        try {
            let hasStaticThumbnail = false;
            const canvas = document.createElement('canvas');
            // eslint-disable-next-line camelcase
            const canvas_CTX = canvas.getContext('2d');
            let imageURL = null;
            let timeout = null;
            try {
                if (fileType===FILE_TYPE.IMAGE || isHEIC) {
                    if (isHEIC) {
                        file = new globalThis.File(
                            [await convertHEIC2JPEG(file)],
                            null,
                            null,
                        );
                    }
                    let image = new Image();
                    imageURL = URL.createObjectURL(file);
                    image.setAttribute('src', imageURL);
                    await new Promise((resolve, reject) => {
                        image.onload = () => {
                            try {
                                const thumbnailWidth =
                                    (image.width * THUMBNAIL_HEIGHT) / image.height;
                                canvas.width = thumbnailWidth;
                                canvas.height = THUMBNAIL_HEIGHT;
                                canvas_CTX.drawImage(
                                    image,
                                    0,
                                    0,
                                    thumbnailWidth,
                                    THUMBNAIL_HEIGHT,
                                );
                                image = null;
                                clearTimeout(timeout);
                                resolve(null);
                            } catch (e) {
                                reject(e);
                                logError(e);
                                reject(Error(`${THUMBNAIL_GENERATION_FAILED} err: ${e}`));
                            }
                        };
                        timeout = setTimeout(
                            () =>
                                reject(
                                    Error(`wait time exceeded for format ${file.name.split('.').slice(-1)[0]}`),
                                ),
                            WAIT_TIME_THUMBNAIL_GENERATION,
                        );
                    });
                } else {
                    await new Promise((resolve, reject) => {
                        let video = document.createElement('video');
                        imageURL = URL.createObjectURL(file);
                        video.addEventListener('timeupdate', function () {
                            try {
                                if (!video) {
                                    return;
                                }
                                const thumbnailWidth =
                                    (video.videoWidth * THUMBNAIL_HEIGHT) /
                                    video.videoHeight;
                                canvas.width = thumbnailWidth;
                                canvas.height = THUMBNAIL_HEIGHT;
                                canvas_CTX.drawImage(
                                    video,
                                    0,
                                    0,
                                    thumbnailWidth,
                                    THUMBNAIL_HEIGHT,
                                );
                                video = null;
                                clearTimeout(timeout);
                                resolve(null);
                            } catch (e) {
                                reject(e);
                                logError(e);
                                reject(Error(`${THUMBNAIL_GENERATION_FAILED} err: ${e}`));
                            }
                        });
                        video.preload = 'metadata';
                        video.src = imageURL;
                        video.currentTime = 3;
                        setTimeout(
                            () =>
                                reject(Error(`wait time exceeded for format ${file.name.split('.').slice(-1)[0]}`)),
                            WAIT_TIME_THUMBNAIL_GENERATION,
                        );
                    });
                }
                URL.revokeObjectURL(imageURL);
            } catch (e) {
                logError(e);
                // ignore and set staticThumbnail
                hasStaticThumbnail = true;
            }
            let thumbnailBlob = null;
            let attempts = 0;
            let quality = 1;

            do {
                attempts++;
                quality /= 2;
                thumbnailBlob = await new Promise((resolve) => {
                    canvas.toBlob(
                        function (blob) {
                            resolve(blob);
                        },
                        'image/jpeg',
                        quality,
                    );
                });
                thumbnailBlob = thumbnailBlob ?? new Blob([]);
            } while (
                thumbnailBlob.size > MIN_THUMBNAIL_SIZE &&
                attempts <= MAX_ATTEMPTS
            );
            const thumbnail = await this.getUint8ArrayView(
                reader,
                thumbnailBlob,
            );
            return { thumbnail, hasStaticThumbnail };
        } catch (e) {
            logError(e, 'Error generating thumbnail');
            throw e;
        }
    }

    private getFileStream(reader: FileReader, file: globalThis.File):DataStream {
        const self = this;
        const fileChunkReader = (async function* fileChunkReaderMaker(
            fileSize,
            self,
        ) {
            let offset = 0;
            while (offset < fileSize) {
                const blob = file.slice(offset, ENCRYPTION_CHUNK_SIZE + offset);
                const fileChunk = await self.getUint8ArrayView(reader, blob);
                yield fileChunk;
                offset += ENCRYPTION_CHUNK_SIZE;
            }
            return null;
        })(file.size, self);
        return {
            stream: new ReadableStream<Uint8Array>({
                async pull(controller: ReadableStreamDefaultController) {
                    const chunk = await fileChunkReader.next();
                    if (chunk.done) {
                        controller.close();
                    } else {
                        controller.enqueue(chunk.value);
                    }
                },
            }),
            chunkCount: Math.ceil(file.size / ENCRYPTION_CHUNK_SIZE),
        };
    }

    private async getUint8ArrayView(
        reader: FileReader,
        file: Blob,
    ): Promise<Uint8Array> {
        try {
            return await new Promise((resolve, reject) => {
                reader.onabort = () => reject(Error('file reading was aborted'));
                reader.onerror = () => reject(Error('file reading has failed'));
                reader.onload = () => {
                    // Do whatever you want with the file contents
                    const result =
                        typeof reader.result === 'string' ?
                            new TextEncoder().encode(reader.result) :
                            new Uint8Array(reader.result);
                    resolve(result);
                };
                reader.readAsArrayBuffer(file);
            });
        } catch (e) {
            logError(e, 'error reading file to byte-array');
            throw e;
        }
    }

    private async getUploadURL() {
        if (this.uploadURLs.length === 0) {
            await this.fetchUploadURLs();
        }
        return this.uploadURLs.pop();
    }

    private async fetchUploadURLs(): Promise<void> {
        try {
            if (!this.uploadURLFetchInProgress) {
                try {
                    const token = getToken();
                    if (!token) {
                        return;
                    }
                    this.uploadURLFetchInProgress = HTTPService.get(
                        `${ENDPOINT}/files/upload-urls`,
                        {
                            count: Math.min(
                                MAX_URL_REQUESTS,
                                (this.totalFileCount - this.filesCompleted) * 2,
                            ),
                        },
                        { 'X-Auth-Token': token },
                    );
                    const response = await this.uploadURLFetchInProgress;
                    this.uploadURLs.push(...response.data['urls']);
                } finally {
                    this.uploadURLFetchInProgress = null;
                }
            }
            return this.uploadURLFetchInProgress;
        } catch (e) {
            logError(e, 'fetch upload-url failed ');
            throw e;
        }
    }

    private async fetchMultipartUploadURLs(
        count: number,
    ): Promise<MultipartUploadURLs> {
        try {
            const token = getToken();
            if (!token) {
                return;
            }
            const response = await HTTPService.get(
                `${ENDPOINT}/files/multipart-upload-urls`,
                {
                    count,
                },
                { 'X-Auth-Token': token },
            );

            return response.data['urls'];
        } catch (e) {
            logError(e, 'fetch multipart-upload-url failed');
            throw e;
        }
    }

    private async putFile(
        fileUploadURL: UploadURL,
        file: Uint8Array,
        filename: string,
    ): Promise<string> {
        try {
            await retryAsyncFunction(()=>
                HTTPService.put(
                    fileUploadURL.url,
                    file,
                    null,
                    null,
                    this.trackUploadProgress(filename),
                ),
            );
            return fileUploadURL.objectKey;
        } catch (e) {
            logError(e, 'putFile to dataStore failed ');
            throw e;
        }
    }

    private async putFileInParts(
        multipartUploadURLs: MultipartUploadURLs,
        file: ReadableStream<Uint8Array>,
        filename: string,
        uploadPartCount: number,
    ) {
        try {
            const streamEncryptedFileReader = file.getReader();
            const percentPerPart = Math.round(
                RANDOM_PERCENTAGE_PROGRESS_FOR_PUT() / uploadPartCount,
            );
            const resParts = [];
            for (const [
                index,
                fileUploadURL,
            ] of multipartUploadURLs.partURLs.entries()) {
                const combinedChunks = [];
                for (let i = 0; i < CHUNKS_COMBINED_FOR_UPLOAD; i++) {
                    const { done, value: chunk } =
                        await streamEncryptedFileReader.read();
                    if (done) {
                        break;
                    }
                    for (let index = 0; index < chunk.length; index++) {
                        combinedChunks.push(chunk[index]);
                    }
                }
                const uploadChunk = Uint8Array.from(combinedChunks);
                const response = await retryAsyncFunction(()=>
                    HTTPService.put(
                        fileUploadURL,
                        uploadChunk,
                        null,
                        null,
                        this.trackUploadProgress(filename, percentPerPart, index),
                    ),
                );
                resParts.push({
                    PartNumber: index + 1,
                    ETag: response.headers.etag,
                });
            }
            const options = { compact: true, ignoreComment: true, spaces: 4 };
            const body = convert.js2xml(
                { CompleteMultipartUpload: { Part: resParts } },
                options,
            );
            await retryAsyncFunction(()=>
                HTTPService.post(multipartUploadURLs.completeURL, body, null, {
                    'content-type': 'text/xml',
                }),
            );
            return multipartUploadURLs.objectKey;
        } catch (e) {
            logError(e, 'put file in parts failed');
            throw e;
        }
    }

    private trackUploadProgress(
        filename,
        percentPerPart = RANDOM_PERCENTAGE_PROGRESS_FOR_PUT(),
        index = 0,
    ) {
        const cancel={ exec: null };
        let timeout=null;
        const resetTimeout=()=>{
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout=setTimeout(()=>cancel.exec(), 30*1000);
        };
        return {
            cancel,
            onUploadProgress: (event) => {
                filename &&
                    this.fileProgress.set(
                        filename,
                        Math.min(
                            Math.round(
                                percentPerPart * index +
                                (percentPerPart * event.loaded) /
                                event.total,
                            ),
                            98,
                        ),
                    );
                this.updateProgressBarUI();
                if (event.loaded===event.total) {
                    clearTimeout(timeout);
                } else {
                    resetTimeout();
                }
            },
        };
    }
    private async getExifData(
        reader: FileReader,
        receivedFile: globalThis.File,
        fileType: FILE_TYPE,
    ): Promise<ParsedEXIFData> {
        try {
            if (fileType === FILE_TYPE.VIDEO) {
                // Todo  extract exif data from videos
                return { location: NULL_LOCATION, creationTime: null };
            }
            const exifData: any = await new Promise((resolve) => {
                reader.onload = () => {
                    resolve(EXIF.readFromBinaryFile(reader.result));
                };
                reader.readAsArrayBuffer(receivedFile);
            });
            if (!exifData) {
                return { location: NULL_LOCATION, creationTime: null };
            }
            return {
                location: this.getEXIFLocation(exifData),
                creationTime: this.getUNIXTime(exifData),
            };
        } catch (e) {
            logError(e, 'error reading exif data');
            throw e;
        }
    }
    private getUNIXTime(exifData: any) {
        const dateString: string = exifData.DateTimeOriginal || exifData.DateTime;
        if (!dateString || dateString==='0000:00:00 00:00:00') {
            return null;
        }
        const parts = dateString.split(' ')[0].split(':');
        const date = new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2]),
        );
        return date.getTime() * 1000;
    }

    private getEXIFLocation(exifData): Location {
        if (!exifData.GPSLatitude) {
            return NULL_LOCATION;
        }

        const latDegree = exifData.GPSLatitude[0];
        const latMinute = exifData.GPSLatitude[1];
        const latSecond = exifData.GPSLatitude[2];

        const lonDegree = exifData.GPSLongitude[0];
        const lonMinute = exifData.GPSLongitude[1];
        const lonSecond = exifData.GPSLongitude[2];

        const latDirection = exifData.GPSLatitudeRef;
        const lonDirection = exifData.GPSLongitudeRef;

        const latFinal = this.convertDMSToDD(
            latDegree,
            latMinute,
            latSecond,
            latDirection,
        );

        const lonFinal = this.convertDMSToDD(
            lonDegree,
            lonMinute,
            lonSecond,
            lonDirection,
        );
        return { latitude: latFinal * 1.0, longitude: lonFinal * 1.0 };
    }

    private convertDMSToDD(degrees, minutes, seconds, direction) {
        let dd = degrees + minutes / 60 + seconds / 3600;

        if (direction === SOUTH_DIRECTION || direction === WEST_DIRECTION) {
            dd = dd * -1;
        }

        return dd;
    }
    private async getMimeType(file:Uint8Array | DataStream) {
        let result:FileTypeResult=null;
        if (isDataStream(file)) {
            result= await FileType.fromStream(file.stream);
        } else {
            result=await FileType.fromBuffer(file);
        }
        return result.mime;
    }
}

export default new UploadService();
