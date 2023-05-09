import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import EnteSpinner from '@ente/ui/EnteSpinner';
// import { AppContext } from 'pages/_app';
import Login from '@ente/ui/Login';
import VerticallyCentered from '@ente/ui/Container';
import { getData, LS_KEYS } from '@ente/utils/storage/localStorage';
// import { PAGES } from '@ente/constants/pages';
import FormContainer from '@ente/ui/Form/FormContainer';
import FormPaper from '@ente/ui/Form/FormPaper';

export default function Home() {
    const router = useRouter();
    // const appContext = useContext(AppContext);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // router.prefetch(PAGES.VERIFY);
        // router.prefetch(PAGES.SIGNUP);
        // const user = getData(LS_KEYS.USER);
        // if (user?.email) {
        //     router.push(PAGES.VERIFY);
        // }
        setLoading(false);
        // appContext.showNavBar(true);
    }, []);

    const register = () => {
        // router.push(PAGES.SIGNUP);
    };

    return loading ? (
        <VerticallyCentered>
            <EnteSpinner>
                <span className="sr-only">Loading...</span>
            </EnteSpinner>
        </VerticallyCentered>
    ) : (
        <FormContainer>
            <FormPaper>
                <Login signUp={register} />
            </FormPaper>
        </FormContainer>
    );
}
