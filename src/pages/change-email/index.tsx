import VerticallyCentered from 'components/Container';
import React, { useEffect } from 'react';
import constants from 'utils/strings/constants';
import router from 'next/router';
import ChangeEmailForm from 'components/ChangeEmail';
import { PAGES } from 'constants/pages';
import { getData } from 'utils/storage/localStorage';
import FormPaper from 'components/Form/FormPaper';
import FormPaperTitle from 'components/Form/FormPaper/Title';

function ChangeEmailPage() {
    useEffect(() => {
        const user = getData('USER');
        if (!user?.token) {
            router.push(PAGES.ROOT);
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
