import constants from 'utils/strings/constants';
import Container from './Container';
import MessageDialog from './MessageDialog';
import SingleInputForm from './SingleInputForm';

interface Props {
    show: boolean;
    onHide: () => void;
}
const AccountDeleteModal = (props: Props) => (
    <MessageDialog
        {...props}
        attributes={{
            title: constants.CONFIRM_ACCOUNT_DELETE,
        }}
    >
        <h5>{constants.CONFIRM_ACCOUNT_DELETE_MESSAGE()}</h5>
        <div
            style={{
                height: '1px',
                marginTop: '40px',
                marginBottom: '20px',
                background: '#383838',
                width: '100%',
            }}
        ></div>
        <h5 style={{ marginBottom: '20px', textAlign: 'center' }}>
            <strong>{constants.CONFIRM_PASSPHRASE}</strong>
        </h5>
        <SingleInputForm
            callback={() => null}
            placeholder={constants.RETURN_PASSPHRASE_HINT}
            buttonText={constants.DELETE_ACCOUNT}
            fieldType="password"
            variant="danger"
        />
    </MessageDialog>
);

export default AccountDeleteModal;
