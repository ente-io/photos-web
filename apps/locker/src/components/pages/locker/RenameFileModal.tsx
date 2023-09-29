import DialogBoxV2 from '@/components/DialogBoxV2';
import SingleInputForm, {
    SingleInputFormProps,
} from '@/components/SingleInputForm';
import { EnteFile } from '@/interfaces/file';
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
    const { selectedExplorerItems, setSelectedExplorerItems } = useContext(
        LockerDashboardContext
    );

    const [filename, setFilename] = useState<string>('');
    const [extension, setExtension] = useState<string>('');

    useEffect(() => {
        if (selectedExplorerItems.length !== 1) return;

        const [filename, extension] = splitFilenameAndExtension(
            selectedExplorerItems[0].name
        );
        setFilename(filename);
        setExtension(extension);
    }, [selectedExplorerItems]);

    const callback: SingleInputFormProps['callback'] = async (
        inputValue,
        setFieldError
    ) => {
        try {
            if (
                inputValue ===
                `${filename}${extension?.length > 0 ? `.${extension}` : ''}`
            ) {
                console.log('same, ignoring');
                props.onHide();
                return;
            }
            let updatedFile = await changeFileName(
                selectedExplorerItems[0].originalItem as EnteFile,
                inputValue
            );
            updatedFile = (
                await updateFilePublicMagicMetadata([updatedFile])
            )[0];
            const existingFile = selectedExplorerItems[0]
                .originalItem as EnteFile;
            updateExistingFilePubMetadata(existingFile, updatedFile);
            setSelectedExplorerItems([]);
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
            {selectedExplorerItems.length === 1 && (
                <SingleInputForm
                    initialValue={`${filename}${
                        extension?.length > 0 ? `.${extension}` : ''
                    }`}
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
