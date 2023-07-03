import DialogBoxV2 from '@/components/DialogBoxV2';
import SingleInputForm, {
    SingleInputFormProps,
} from '@/components/SingleInputForm';
import { LockerDashboardContext } from '@/pages/locker';
import { updateFilePublicMagicMetadata } from '@/services/fileService';
import {
    changeFileName,
    splitFilenameAndExtension,
    updateExistingFilePubMetadata,
} from '@/utils/file';
import { t } from 'i18next';
import { useContext, useEffect, useState } from 'react';

interface IProps {
    show: boolean;
    onHide: () => void;
}

const getFileTitle = (filename: string, extension: string) => {
    if (extension) {
        return filename + '.' + extension;
    } else {
        return filename;
    }
};

const RenameFileModal = (props: IProps) => {
    const { selectedFiles, setSelectedFiles } = useContext(
        LockerDashboardContext
    );

    const [filename, setFilename] = useState<string>();
    const [extension, setExtension] = useState<string>();

    useEffect(() => {
        if (selectedFiles.length !== 1) return;

        const [filename, extension] = splitFilenameAndExtension(
            selectedFiles[0].metadata.title
        );
        setFilename(filename);
        setExtension(extension);
    }, [selectedFiles]);

    const callback: SingleInputFormProps['callback'] = async (
        inputValue,
        setFieldError
    ) => {
        try {
            if (inputValue === filename) {
                props.onHide();
                return;
            }
            const newTitle = getFileTitle(inputValue, extension);
            let updatedFile = await changeFileName(selectedFiles[0], newTitle);
            updatedFile = (
                await updateFilePublicMagicMetadata([updatedFile])
            )[0];
            const existingFile = selectedFiles[0];
            updateExistingFilePubMetadata(existingFile, updatedFile);
            setSelectedFiles([]);
            props.onHide();
        } catch (e) {
            setFieldError(e.message);
        }
    };

    return (
        <DialogBoxV2
            open={props.show}
            onClose={props.onHide}
            attributes={{
                title: t('RENAME_FILE'),
            }}>
            {selectedFiles.length === 1 && (
                <SingleInputForm
                    initialValue={selectedFiles[0].title}
                    callback={callback}
                    placeholder={t('FILE_NAME')}
                    buttonText={t('RENAME')}
                    fieldType="text"
                    caption=""
                    secondaryButtonAction={props.onHide}
                    submitButtonProps={{
                        sx: {
                            mt: 1,
                            mb: 2,
                        },
                    }}
                />
            )}
        </DialogBoxV2>
    );
};

export default RenameFileModal;
