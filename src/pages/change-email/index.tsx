import VerticallyCentered from 'components/Container';
import React, { useEffect } from 'react';
import constants from 'utils/strings/constants';
import ChangeEmailForm from 'components/ChangeEmail';
import { getData, LS_KEYS } from 'utils/storage/localStorage';
import FormPaper from 'components/Form/FormPaper';
import FormPaperTitle from 'components/Form/FormPaper/Title';
import { logoutUser } from 'services/userService';

function ChangeEmailPage() {
    useEffect(() => {
        const user = getData(LS_KEYS.USER);
        if (!user?.token) {
            logoutUser();
        }
    }, []);

    return (
        <VerticallyCentered>
            <FormPaper>
                <FormPaperTitle>{constants.CHANGE_EMAIL}</FormPaperTitle>
                <ChangeEmailForm />
            </FormPaper>
        </VerticallyCentered>
    );
}

export default ChangeEmailPage;
