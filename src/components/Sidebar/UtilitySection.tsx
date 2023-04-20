import { useContext, useState } from 'react';
import { t } from 'i18next';

// import FixLargeThumbnails from 'components/FixLargeThumbnail';
import RecoveryKey from 'components/RecoveryKey';
import TwoFactorModal from 'components/TwoFactor/Modal';
import { PAGES } from 'constants/pages';
import { useRouter } from 'next/router';
import { AppContext } from 'pages/_app';
// import mlIDbStorage from 'utils/storage/mlIDbStorage';
import isElectron from 'is-electron';
import WatchFolder from 'components/WatchFolder';
import { getDownloadAppMessage } from 'utils/ui';

import { isInternalUser } from 'utils/user';
import Preferences from './Preferences';
import { EnteMenuItem } from 'components/Menu/EnteMenuItem';
import ThemeSwitcher from './ThemeSwitcher';
import { THEME_COLOR } from 'constants/theme';
import { LS_KEYS, setData } from 'utils/storage/localStorage';

export default function UtilitySection({ closeSidebar }) {
    const router = useRouter();
    const {
        setDialogMessage,
        startLoading,
        watchFolderView,
        setWatchFolderView,
        themeColor,
        setThemeColor,
    } = useContext(AppContext);

    const [recoverModalView, setRecoveryModalView] = useState(false);
    const [twoFactorModalView, setTwoFactorModalView] = useState(false);
    const [preferencesView, setPreferencesView] = useState(false);

    const openPreferencesOptions = () => setPreferencesView(true);
    const closePreferencesOptions = () => setPreferencesView(false);

    const openRecoveryKeyModal = () => setRecoveryModalView(true);
    const closeRecoveryKeyModal = () => setRecoveryModalView(false);

    const openTwoFactorModal = () => setTwoFactorModalView(true);
    const closeTwoFactorModal = () => setTwoFactorModalView(false);

    const openWatchFolder = () => {
        if (isElectron()) {
            setWatchFolderView(true);
        } else {
            setDialogMessage(getDownloadAppMessage());
        }
    };
    const closeWatchFolder = () => setWatchFolderView(false);

    const redirectToChangePasswordPage = () => {
        closeSidebar();
        setData(LS_KEYS.HIDE_BACK_BUTTON, { value: false });
        router.push(PAGES.CHANGE_PASSWORD);
    };

    const redirectToChangeEmailPage = () => {
        closeSidebar();
        router.push(PAGES.CHANGE_EMAIL);
    };

    const redirectToDeduplicatePage = () => router.push(PAGES.DEDUPLICATE);

    const redirectToAuthenticatorPage = () => router.push(PAGES.AUTH);

    const somethingWentWrong = () =>
        setDialogMessage({
            title: t('ERROR'),
            content: t('RECOVER_KEY_GENERATION_FAILED'),
            close: { variant: 'critical' },
        });

    const toggleTheme = () => {
        setThemeColor((themeColor) =>
            themeColor === THEME_COLOR.DARK
                ? THEME_COLOR.LIGHT
                : THEME_COLOR.DARK
        );
    };

    return (
        <>
            {isElectron() && (
                <EnteMenuItem
                    onClick={openWatchFolder}
                    variant="secondary"
                    label={t('WATCH_FOLDERS')}
                />
            )}
            <EnteMenuItem
                variant="secondary"
                onClick={openRecoveryKeyModal}
                label={t('RECOVERY_KEY')}
            />
            {isInternalUser() && (
                <EnteMenuItem
                    onClick={toggleTheme}
                    variant="secondary"
                    label={t('CHOSE_THEME')}
                    endIcon={
                        <ThemeSwitcher
                            themeColor={themeColor}
                            setThemeColor={setThemeColor}
                        />
                    }
                />
            )}
            <EnteMenuItem
                variant="secondary"
                onClick={openTwoFactorModal}
                label={t('TWO_FACTOR')}
            />

            <EnteMenuItem
                variant="secondary"
                onClick={redirectToChangePasswordPage}
                label={t('CHANGE_PASSWORD')}
            />

            <EnteMenuItem
                variant="secondary"
                onClick={redirectToChangeEmailPage}
                label={t('CHANGE_EMAIL')}
            />

            <EnteMenuItem
                variant="secondary"
                onClick={redirectToDeduplicatePage}
                label={t('DEDUPLICATE_FILES')}
            />

            {isInternalUser() && (
                <EnteMenuItem
                    variant="secondary"
                    onClick={redirectToAuthenticatorPage}
                    label={t('AUTHENTICATOR_SECTION')}
                />
            )}
            <EnteMenuItem
                variant="secondary"
                onClick={openPreferencesOptions}
                label={t('PREFERENCES')}
            />
            <RecoveryKey
                show={recoverModalView}
                onHide={closeRecoveryKeyModal}
                somethingWentWrong={somethingWentWrong}
            />
            <TwoFactorModal
                show={twoFactorModalView}
                onHide={closeTwoFactorModal}
                closeSidebar={closeSidebar}
                setLoading={startLoading}
            />
            <WatchFolder open={watchFolderView} onClose={closeWatchFolder} />
            <Preferences
                open={preferencesView}
                onClose={closePreferencesOptions}
                onRootClose={closeSidebar}
            />
        </>
    );
}
