import React from 'react';
import styled from 'styled-components';

/**
 * Global English constants.
 */

const dateString = function (date) {
    return new Date(date / 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const Strong = styled.strong`
    color: #ddd;
`;

const Logo = styled.img`
    height: 18px;
    vertical-align: middle;
    margin-top: -3px;
`;

const englishConstants = {
    HERO_HEADER: () => <div>with <Logo src='/icon.svg' /><br />your <Strong>memories</Strong> are</div>,
    HERO_SLIDE_1_TITLE: 'protected',
    HERO_SLIDE_1: 'end-to-end encrypted with your password, visible only to you',
    HERO_SLIDE_2_TITLE: 'synced',
    HERO_SLIDE_2: 'available across all your devices, web, android and ios',
    HERO_SLIDE_3_TITLE: 'preserved',
    HERO_SLIDE_3: 'reliably replicated to a fallout shelter, designed to outlive',
    COMPANY_NAME: 'ente',
    LOGIN: 'login',
    SIGN_UP: 'sign up',
    SIGN_IN: 'sign in',
    NAME: 'name',
    ENTER_NAME: 'your name',
    EMAIL: 'email',
    ENTER_EMAIL: 'email',
    DATA_DISCLAIMER: 'we\'ll never share your data with anyone else.',
    SUBMIT: 'submit',
    EMAIL_ERROR: 'enter a valid email',
    REQUIRED: 'required',
    VERIFY_EMAIL: 'verify email',
    EMAIL_SENT: ({ email }) => (
        <p>
            we have sent a mail to <b>{email}</b>
        </p>
    ),
    CHECK_INBOX: 'please check your inbox (and spam) to complete verification',
    ENTER_OTT: 'verification code',
    RESEND_MAIL: 'resend?',
    VERIFY: 'verify',
    UNKNOWN_ERROR: 'something went wrong, please try again',
    INVALID_CODE: 'invalid verification code',
    SENDING: 'sending...',
    SENT: 'sent!',
    PASSWORD: 'password',
    ENTER_PASSPHRASE: 'enter your password',
    RETURN_PASSPHRASE_HINT: 'password',
    SET_PASSPHRASE: 'set password',
    VERIFY_PASSPHRASE: 'sign in',
    INCORRECT_PASSPHRASE: 'incorrect password',
    ENTER_ENC_PASSPHRASE:
        'please enter a password that we can use to encrypt your data',
    PASSPHRASE_DISCLAIMER: () => (
        <p>
            we don't store your password, so if you forget,
            <strong> we will not be able to help you</strong>
            {' '}
            recover your data.
        </p>
    ),
    PASSPHRASE_HINT: 'password',
    RE_ENTER_PASSPHRASE: 'password again',
    CONFIRM_PASSPHRASE: 'confirm your password',
    PASSPHRASE_MATCH_ERROR: 'passwords don\'t match',
    CONSOLE_WARNING_STOP: 'STOP!',
    CONSOLE_WARNING_DESC: 'This is a browser feature intended for developers. Please don\'t copy-paste unverified code here.',
    SELECT_COLLECTION: 'select an album to upload to',
    CREATE_COLLECTION: 'create album',
    ENTER_ALBUM_NAME: 'album name',
    CLOSE: 'close',
    NO: 'no',
    NOTHING_HERE: 'nothing to see here, yet',
    UPLOAD: {
        0: 'preparing to upload',
        1: 'reading google metadata files',
        2: (fileCounter) => `${fileCounter.finished} / ${fileCounter.total} files backed up`,
        3: 'backup complete!',
    },
    UPLOADING_FILES: 'file upload',
    NOT_UPLOAD_FILE_LIST: 'list of files not uploaded',
    UNSUPPORTED_FILE_LIST: 'unsupported files',
    FILE_UPLOAD_PROGRESS: (name:string, progress:number) => (
        <div id={name}>
            <strong>{name}</strong>
            {' - '}
            {(() => {
                switch (progress) {
                    case -1:
                        return 'failed';
                    case -2:
                        return 'already uploaded, skipping...';
                    case -3:
                        return ',unsupported file format, skipping....';
                    default:
                        return `${progress}%`;
                }
            })()}
        </div>
    ),
    FILE_UPLOAD_RESULT: (name:string, progress:number) => (
        <div id={name}>
            <strong>{name}</strong>
            {' - '}
            {(() => {
                switch (progress) {
                    case -1:
                        return 'failed';
                    case -2:
                        return 'skipped duplicate';
                    case -3:
                        return 'skipped unsupported format';
                    default:
                        return `uploaded`;
                }
            })()}
        </div>
    ),
    SUBSCRIPTION_EXPIRED: 'your subscription has expired, please renew it',

    STORAGE_QUOTA_EXCEEDED:
        'you have exceeded your storage quota, please upgrade your plan',
    INITIAL_LOAD_DELAY_WARNING: 'the first load may take some time',
    USER_DOES_NOT_EXIST: 'sorry, could not find a user with that email',
    UPLOAD_BUTTON_TEXT: 'upload',
    NO_ACCOUNT: 'don\'t have an account?',
    ACCOUNT_EXISTS: 'already have an account?',
    ALBUM_NAME: 'album name',
    CREATE: 'create',
    DOWNLOAD: 'download',
    TOGGLE_FULLSCREEN: 'toggle fullscreen',
    ZOOM_IN_OUT: 'zoom in/out',
    PREVIOUS: 'previous (arrow left)',
    NEXT: 'next (arrow right)',
    NO_INTERNET_CONNECTION:
        'please check your internet connection and try again',
    TITLE: 'ente.io | encrypted photo storage',
    UPLOAD_FIRST_PHOTO: 'backup your first photo',
    UPLOAD_DROPZONE_MESSAGE: 'drop to backup your files',
    CONFIRM_DELETE_FILE: 'confirm file deletion',
    DELETE_FILE_MESSAGE: 'sure you want to delete selected files?',
    DELETE_FILE: 'delete files',
    DELETE: 'delete',
    MULTI_FOLDER_UPLOAD: 'choose upload strategy',
    UPLOAD_STRATEGY_CHOICE:
        'you are uploading multiple folders, would you like us to create',
    UPLOAD_STRATEGY_SINGLE_COLLECTION: 'a single album for everything',
    OR: 'or',
    UPLOAD_STRATEGY_COLLECTION_PER_FOLDER: 'separate albums for every folder',
    SESSION_EXPIRED_MESSAGE:
        'your session has expired, please login again to continue',
    SESSION_EXPIRED: 'session expired',
    SYNC_FAILED:
        'failed to sync with remote server, please refresh page to try again',
    PASSWORD_GENERATION_FAILED: 'your browser was unable to generate a strong enough password  that meets ente\'s encryption standards, please try using the mobile app or another browser',
    CHANGE_PASSWORD: 'change password',
    GO_BACK: 'go back',
    DOWNLOAD_RECOVERY_KEY: 'recovery key',
    SAVE_LATER: 'save later',
    SAVE: 'save',
    RECOVERY_KEY_DESCRIPTION:
        'if you forget your password, the only way you can recover your data is with this key',
    RECOVER_KEY_GENERATION_FAILED:
        'recovery code could be generated, please try again',
    KEY_NOT_STORED_DISCLAIMER:
        'we don\'t store this key, so please save this in a safe place',
    RECOVERY_KEY_FILENAME: 'ente-recovery-key.txt',
    FORGOT_PASSWORD: 'forgot password?',
    RECOVER_ACCOUNT: 'recover account',
    RETURN_RECOVERY_KEY_HINT: 'recovery key',
    RECOVER: 'recover',
    NO_RECOVERY_KEY: 'no recovery key?',
    INCORRECT_RECOVERY_KEY: 'incorrect recovery key',
    SORRY: 'sorry',
    NO_RECOVERY_KEY_MESSAGE:
        'due to the nature of our end-to-end encryption protocol, your data cannot be decrypted without your password or recovery key',
    NO_TWO_FACTOR_RECOVERY_KEY_MESSAGE: () => (<>
        please drop an email to <a href="mailto:support@ente.io">support@ente.io</a> from your registered email
    </>),
    CONTACT_SUPPORT: 'contact support',
    REQUEST_FEATURE: 'request feature',
    SUPPORT: 'support',
    CONFIRM: 'confirm',
    SKIP: 'skip',
    CANCEL: 'cancel',
    LOGOUT: 'logout',
    LOGOUT_MESSAGE: 'sure you want to logout?',
    CHANGE: 'change',
    CHANGE_EMAIL: 'change email ?',
    OK: 'ok',
    SUCCESS: 'success',
    ERROR: 'error',
    MESSAGE: 'message',
    INSTALL_MOBILE_APP: () => (
        <>
            install our{' '}
            <a
                href="https://play.google.com/store/apps/details?id=io.ente.photos"
                target="_blank"
                style={{ color: '#2dc262' }} rel="noreferrer"
            >
                android
            </a>
            {' '}
            or
            {' '}
            <a
                href="https://apps.apple.com/in/app/ente-photos/id1542026904"
                style={{ color: '#2dc262' }}
                target="_blank" rel="noreferrer"
            >
                ios app
                {' '}
            </a>
            to automatically backup all your photos
        </>
    ),
    DOWNLOAD_APP_MESSAGE: () => (
        <>
            <p>sorry, this operation is currently not supported on the web,</p>
            <p> do you want to download the desktop app</p>
        </>
    ),
    DOWNLOAD_APP: 'download desktop app',
    EXPORT: 'export data',

    // ========================
    // Subscription
    // ========================
    SUBSCRIBE: 'subscribe',
    SUBSCRIPTION_PLAN: 'subscription plan',
    USAGE_DETAILS: 'usage',
    MANAGE: 'manage',
    MANAGEMENT_PORTAL: 'manage payment method',
    CHOOSE_PLAN: 'choose your subscription plan',
    MANAGE_PLAN: 'manage your subscription',
    CHOOSE_PLAN_BTN: 'choose plan',

    OFFLINE_MSG: 'you are offline, cached memories are being shown',

    FREE_SUBSCRIPTION_INFO: (expiryTime) => (
        <>
            <p>
                you are on the <strong>free</strong>
                {' '}
                plan that expires on{' '}
                {dateString(expiryTime)}
            </p>
        </>
    ),
    RENEWAL_ACTIVE_SUBSCRIPTION_INFO: (expiryTime) => (
        <p>
            your subscription will renew on {dateString(expiryTime)}
        </p>
    ),

    RENEWAL_CANCELLED_SUBSCRIPTION_INFO: (expiryTime) => (
        <>
            <p>
                your subscription will be cancelled on {dateString(expiryTime)}
            </p>
        </>
    ),

    USAGE_INFO: (usage, quota) => (
        <p>
            you have used {usage}
            {' '}
            out of your {quota}
            {' '}
            GB quota
        </p>
    ),

    SUBSCRIPTION_PURCHASE_SUCCESS: (expiryTime) => (
        <>
            <p>we've received your payment</p>
            your subscription is valid till{' '}
            <strong>{dateString(expiryTime)}</strong>
        </>
    ),
    SUBSCRIPTION_PURCHASE_CANCELLED:
        'your purchase was canceled, please try again if you want to subscribe',
    SUBSCRIPTION_VERIFICATION_FAILED: 'we were not able to verify your purchase, verification can take few hours',
    SUBSCRIPTION_PURCHASE_FAILED:
        'subscription purchase failed , please try again later',

    UPDATE_PAYMENT_METHOD_MESSAGE:
        'we are sorry, payment failed when we tried to charge your card, please update your payment method and try again',
    UPDATE_PAYMENT_METHOD: 'update payment method',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    UPDATE_SUBSCRIPTION_MESSAGE: 'are you sure you want to change your plan?',
    UPDATE_SUBSCRIPTION: 'change plan',

    CONFIRM_CANCEL_SUBSCRIPTION: 'confirm unsubscription',
    CANCEL_SUBSCRIPTION: 'unsubscribe',
    CANCEL_SUBSCRIPTION_MESSAGE: () => (
        <>
            <p>
                all of your data will be deleted from our servers at the end of
                this billing period.
            </p>
            <p>are you sure that you want to unsubscribe?</p>
        </>
    ),
    SUBSCRIPTION_CANCEL_FAILED: 'failed to cancel subscription',
    SUBSCRIPTION_CANCEL_SUCCESS: 'subscription successfully canceled',

    ACTIVATE_SUBSCRIPTION: 'reactivate subscription',
    CONFIRM_ACTIVATE_SUBSCRIPTION: 'confirm subscription activation',
    ACTIVATE_SUBSCRIPTION_MESSAGE: (expiryTime) => `once reactivated, you will be billed on ${dateString(expiryTime)}`,
    SUBSCRIPTION_ACTIVATE_SUCCESS: 'subscription successfully activated',
    SUBSCRIPTION_ACTIVATE_FAILED: 'failed to reactivate subscription renewals',

    SUBSCRIPTION_PURCHASE_SUCCESS_TITLE: 'thank you',
    CANCEL_SUBSCRIPTION_ON_MOBILE: 'please cancel your subscription from the mobile app to activate a subscription here',
    RENAME: 'rename',
    RENAME_COLLECTION: 'rename album',
    CONFIRM_DELETE_COLLECTION: 'confirm album deletion',
    DELETE_COLLECTION: 'delete album',
    DELETE_COLLECTION_FAILED: 'album deletion failed , please try again',
    DELETE_COLLECTION_MESSAGE: () => (
        <>
            <p>are you sure you want to delete this album?</p>
            <p>
                all files that are present only in this album will be
                permanently deleted
            </p>
        </>
    ),
    SHARE: 'share',
    SHARE_COLLECTION: 'share album',
    SHARE_WITH_PEOPLE: 'share with your loved ones',
    SHAREES: 'shared with',
    ZERO_SHAREES: () => (
        <>
            <h6>currently shared with no one 😔</h6>
            <em style={{ color: '#777' }}>"memories are fonder when shared"</em>
        </>
    ),
    SHARE_WITH_SELF: 'oops, you cannot share with yourself',
    ALREADY_SHARED: (email) => `oops, you're already sharing this with ${email}`,
    SHARING_BAD_REQUEST_ERROR: 'sharing album not allowed',
    SHARING_DISABLED_FOR_FREE_ACCOUNTS: 'sharing is disabled for free accounts',
    CREATE_ALBUM_FAILED: 'failed to create album , please try again',
    SEARCH_HINT: () => <span>try searching for New York, April 14, Christmas...</span>,
    TERMS_AND_CONDITIONS: () => (
        <p>
            I agree to the{' '}
            <a href="https://ente.io/terms" target="_blank" rel="noreferrer">
                terms
            </a>
            {' '}
            and
            {' '}
            <a href="https://ente.io/privacy" target="_blank" rel="noreferrer">
                privacy policy
            </a>
            {' '}
        </p>
    ),
    CONFIRM_PASSWORD_NOT_SAVED: () => (
        <p>
            i understand that if i lose my password , i may lose my data since
            my data is{' '}
            <a href="https://ente.io/encryption" target="_blank" rel="noreferrer">
                end-to-end encrypted
            </a>
            {' '}
            with ente
        </p>
    ),
    SEARCH_STATS: ({ resultCount, timeTaken }) => (
        <span>
            found <span style={{ color: '#2dc262' }}>{resultCount}</span>
            {' '}
            memories (
            {' '}
            <span style={{ color: '#2dc262' }}>
                {' '}
                {timeTaken}
            </span>
            {' '}
            seconds )
        </span>
    ),
    NOT_FILE_OWNER: 'deleting shared collection files is not allowed',
    ADD_TO_COLLECTION: 'add to collection',
    SELECTED: 'selected',
    VIDEO_PLAYBACK_FAILED: 'video format not supported',
    VIDEO_PLAYBACK_FAILED_DOWNLOAD_INSTEAD: 'this video cannot be played on your browser',
    METADATA: 'metadata',
    INFO: 'information',
    FILE_ID: 'file id',
    FILE_NAME: 'file name',
    CREATION_TIME: 'creation time',
    UPDATED_ON: 'updated on',
    LOCATION: 'location',
    SHOW_MAP: 'show on map',
    EXIF: 'exif',
    DEVICE: 'device',
    IMAGE_SIZE: 'image size',
    FLASH: 'flash',
    FOCAL_LENGTH: 'focal length',
    APERTURE: 'aperture',
    ISO: 'iso',
    SHOW_ALL: 'show all',
    LOGIN_TO_UPLOAD_FILES: (count: number) => count === 1 ? `1 file received. login to upload` : `${count} files received. login to upload`,
    FILES_TO_BE_UPLOADED: (count: number) => count === 1 ? `1 file received. uploading in a jiffy` : `${count} files received. Uploading in a jiffy`,
    TWO_FACTOR: 'two-factor',
    TWO_FACTOR_AUTHENTICATION: 'two-factor authentication',
    TWO_FACTOR_QR_INSTRUCTION: 'scan the QR code below with your favorite authenticator app',
    ENTER_CODE_MANUALLY: 'enter the code manually',
    TWO_FACTOR_MANUAL_CODE_INSTRUCTION: 'please enter this code in your favorite authenticator app',
    SCAN_QR_CODE: 'scan QR code instead',
    CONTINUE: 'continue',
    BACK: 'back',
    ENABLE_TWO_FACTOR: 'enable two-factor',
    ENABLE: 'enable',
    LOST_DEVICE: 'lost two-factor device?',
    INCORRECT_CODE: 'incorrect code',
    RECOVER_TWO_FACTOR: 'recover two-factor',
    TWO_FACTOR_INFO: 'add an additional layer of security by requiring more than your email and password to log in to your account',
    DISABLE_TWO_FACTOR_HINT: 'disable two-factor authentication',
    UPDATE_TWO_FACTOR_HINT: 'update your authenticator device',
    DISABLE: 'disable',
    RECONFIGURE: 'reconfigure',
    UPDATE_TWO_FACTOR: 'update two-factor',
    UPDATE_TWO_FACTOR_MESSAGE: 'continuing forward will void any previously configured authenticators',
    UPDATE: 'update',
    DISABLE_TWO_FACTOR: 'disable two-factor',
    DISABLE_TWO_FACTOR_MESSAGE: 'are you sure you want to disable your two-factor authentication',
    TWO_FACTOR_SETUP_FAILED: 'failed to setup two factor, please try again',
    TWO_FACTOR_SETUP_SUCCESS: 'two factor authentication successfully configured',
    TWO_FACTOR_DISABLE_SUCCESS: 'two factor authentication disabled',
    TWO_FACTOR_DISABLE_FAILED: 'failed to disable two factor, please try again',
    EXPORT_DATA: 'export data',
    SELECT_FOLDER: 'select folder',
    DESTINATION: 'destination',
    TOTAL_EXPORT_SIZE: 'total export size',
    START: 'start',
    EXPORT_IN_PROGRESS: 'export in progress...',
    PAUSE: 'pause',
    RESUME: 'resume',
    MINIMIZE: 'minimize',
    LAST_EXPORT_TIME: 'last export time',
    SUCCESSFULLY_EXPORTED_FILES: 'successful exports',
    FAILED_EXPORTED_FILES: 'failed exports',
    EXPORT_AGAIN: 'resync',
    RETRY_EXPORT_: 'retry failed exports',
    LOCAL_STORAGE_NOT_ACCESSIBLE: 'local storage not accessible',
    LOCAL_STORAGE_NOT_ACCESSIBLE_MESSAGE: 'your browser or an addon is blocking ente from saving data into local storage. please try loading this page after switching your browsing mode.',
    RETRY_FAILED: 'retry failed files',
};

export default englishConstants;
