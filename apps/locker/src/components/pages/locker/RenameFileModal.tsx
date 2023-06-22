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

const getFileTitle = (filename, extension) => {
    if (extension) {
        return filename + '.' + extension;
    } else {
        return filename;
    }
};

const RenameFileModal = (props: IProps) => {
    const { selectedFiles } = useContext(LockerDashboardContext);

    const [filename, setFilename] = useState<string>();
    const [extension, setExtension] = useState<string>();

    useEffect(() => {
        const [filename, extension] = splitFilenameAndExtension(
            selectedFiles[0].metadata.title
        );
        setFilename(filename);
        setExtension(extension);
    }, []);

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
            updateExistingFilePubMetadata(selectedFiles[0], updatedFile);

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
            <SingleInputForm
                initialValue={selectedFiles[0].title}
                callback={callback}
                placeholder={'File name'}
                buttonText={'Rename'}
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
        </DialogBoxV2>
    );
};

export default RenameFileModal;
