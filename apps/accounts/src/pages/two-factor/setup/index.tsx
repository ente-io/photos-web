import TwoFactorSetupPage from '@ente/accounts/pages/two-factor/setup';
import { useRouter } from 'next/router';
import { AppContext } from 'pages/_app';
import { useContext } from 'react';
import { APPS } from '@ente/shared/apps/constants';

export default function TwoFactorSetup() {
    const appContext = useContext(AppContext);
    const router = useRouter();
    return (
        <TwoFactorSetupPage
            appContext={appContext}
            router={router}
            appName={APPS.ACCOUNTS}
        />
    );
}
