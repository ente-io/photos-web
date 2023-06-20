import DialogBoxV2 from '@/components/DialogBoxV2';
import { CollectionType } from '@/constants/collection';
import { createCollection } from '@/services/collectionService';
import { t } from 'i18next';
import SingleInputForm, {
    SingleInputFormProps,
} from '@/components/SingleInputForm';

interface IProps {
    show: boolean;
    onHide: () => void;
}

const NewCollectionModal = (props: IProps) => {
    const callback: SingleInputFormProps['callback'] = async (
        inputValue,
        setFieldError
    ) => {
        try {
            await createCollection(inputValue, CollectionType.folder);
            props.onHide();
        } catch (e) {
            setFieldError(e.message);
        }
    };

    return (
        <DialogBoxV2
            sx={{ zIndex: 1600 }}
            open={props.show}
            onClose={props.onHide}
            attributes={{
                title: 'New collection',
            }}>
            <SingleInputForm
                initialValue={''}
                callback={callback}
                placeholder={'Collection name'}
                buttonText={'Create'}
                fieldType="text"
                caption={''}
                secondaryButtonAction={props.onHide}
                submitButtonProps={{ sx: { mt: 1, mb: 2 } }}
            />
        </DialogBoxV2>
    );
};

export default NewCollectionModal;
