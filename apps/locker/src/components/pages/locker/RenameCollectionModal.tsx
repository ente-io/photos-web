import DialogBoxV2 from '@/components/DialogBoxV2';
import SingleInputForm, {
    SingleInputFormProps,
} from '@/components/SingleInputForm';
import { LockerDashboardContext } from '@/pages/locker';
import { renameCollection } from '@/services/collectionService';
import { t } from 'i18next';
import { useContext, useEffect, useState } from 'react';

interface IProps {
    show: boolean;
    onHide: () => void;
}

const RenameCollectionModal = (props: IProps) => {
    const { selectedCollections } = useContext(LockerDashboardContext);

    const [originalCollectionName, setOriginalCollectionName] =
        useState<string>();

    useEffect(() => {
        if (selectedCollections.length !== 1) return;
        setOriginalCollectionName(selectedCollections[0].name);
    }, [selectedCollections]);

    const callback: SingleInputFormProps['callback'] = async (
        inputValue,
        setFieldError
    ) => {
        try {
            if (inputValue === originalCollectionName) {
                props.onHide();
                return;
            }
            await renameCollection(selectedCollections[0], inputValue);
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
                title: t('RENAME_COLLECTION'),
            }}>
            {selectedCollections.length === 1 && (
                <SingleInputForm
                    initialValue={selectedCollections[0].name}
                    callback={callback}
                    placeholder={'Collection name'}
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
            )}
        </DialogBoxV2>
    );
};

export default RenameCollectionModal;
