import TwoFactorRecoverPage from '@ente/accounts/pages/two-factor/recover';
import { useRouter } from 'next/router';
import { AppContext } from 'pages/_app';
import { useContext } from 'react';
import { APPS } from '@ente/shared/apps/constants';

export default function TwoFactorRecover() {
    const appContext = useContext(AppContext);
    const router = useRouter();
    return (
        <TwoFactorRecoverPage
            appContext={appContext}
            router={router}
            appName={APPS.ACCOUNTS}
        />
    );
}
