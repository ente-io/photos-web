import DialogBoxV2 from '@/components/DialogBoxV2';
import SingleInputForm, {
    SingleInputFormProps,
} from '@/components/SingleInputForm';
import { Collection } from '@/interfaces/collection';
import { LockerDashboardContext } from '@/pages/locker';
import { renameCollection } from '@/services/collectionService';
import { t } from 'i18next';
import { useContext, useEffect, useState } from 'react';

interface IProps {
    show: boolean;
    onHide: () => void;
}

const RenameCollectionModal = (props: IProps) => {
    const { selectedExplorerItems } = useContext(LockerDashboardContext);

    const [originalCollectionName, setOriginalCollectionName] =
        useState<string>();

    useEffect(() => {
        if (selectedExplorerItems.length !== 1) return;
        setOriginalCollectionName(selectedExplorerItems[0].name);
    }, [selectedExplorerItems]);

    const callback: SingleInputFormProps['callback'] = async (
        inputValue,
        setFieldError
    ) => {
        try {
            if (inputValue === originalCollectionName) {
                props.onHide();
                return;
            }
            await renameCollection(
                selectedExplorerItems[0].originalItem as Collection,
                inputValue
            );
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
            {selectedExplorerItems.length === 1 && (
                <SingleInputForm
                    initialValue={selectedExplorerItems[0].name}
                    callback={callback}
                    placeholder={t('COLLECTION_NAME')}
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

export default RenameCollectionModal;
