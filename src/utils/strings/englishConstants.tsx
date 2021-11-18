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

const Trigger = styled.span`
    :hover {
        text-decoration: underline;
        cursor: pointer;
    }
    color: #51cd7c;
`;

const englishConstants = {
    HERO_HEADER: () => (
        <div>
            with <Logo src="/icon.svg" />
            <br />
            your <Strong>memories</Strong> are
        </div>
    ),
    HERO_SLIDE_1_TITLE: 'protected',
    HERO_SLIDE_1:
        'end-to-end encrypted with your password, visible only to you',
    HERO_SLIDE_2_TITLE: 'synced',
    HERO_SLIDE_2: 'available across all your devices, web, android and ios',
    HERO_SLIDE_3_TITLE: 'preserved',
    HERO_SLIDE_3:
        'reliably replicated to a fallout shelter, designed to outlive',
    COMPANY_NAME: 'ente',
    LOGIN: 'log in',
    SIGN_UP: 'sign up',
    NAME: 'name',
    ENTER_NAME: 'your name',
    EMAIL: 'email',
    ENTER_EMAIL: 'email',
    DATA_DISCLAIMER: "we'll never share your data with anyone else.",
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
    EXPIRED_CODE: 'your verification code has expired',
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
            <strong> we will not be able to help you</strong> recover your data.
        </p>
    ),
    PASSPHRASE_HINT: 'password',
    RE_ENTER_PASSPHRASE: 'password again',
    CONFIRM_PASSPHRASE: 'confirm your password',
    PASSPHRASE_MATCH_ERROR: "passwords don't match",
    CONSOLE_WARNING_STOP: 'STOP!',
    CONSOLE_WARNING_DESC:
        "This is a browser feature intended for developers. Please don't copy-paste unverified code here.",
    SELECT_COLLECTION: 'select an album to upload to',
    CREATE_COLLECTION: 'new album',
    ENTER_ALBUM_NAME: 'album name',
    CLOSE: 'close',
    NO: 'no',
    NOTHING_HERE: 'nothing to see here, yet',
    UPLOAD: {
        0: 'preparing to upload',
        1: 'reading google metadata files',
        2: (fileCounter) =>
            `${fileCounter.finished} / ${fileCounter.total} files backed up`,
        3: 'backup complete',
    },
    UPLOADING_FILES: 'file upload',
    FILE_NOT_UPLOADED_LIST: 'the following files were not uploaded',
    FILE_UPLOAD_PROGRESS: (name: string, progress: number) => (
        <div id={name}>
            {name}
            {' - '}
            <span style={{ color: '#eee' }}>
                {(() => {
                    switch (progress) {
                        case -1:
                            return 'failed';
                        case -2:
                            return 'already uploaded, skipping...';
                        case -3:
                            return 'unsupported file format, skipping....';
                        default:
                            return `${progress}%`;
                    }
                })()}
            </span>
        </div>
    ),
    SUBSCRIPTION_EXPIRED: (action) => (
        <>
            your subscription has expired, please a{' '}
            <Trigger onClick={action}>renew</Trigger>
        </>
    ),
    STORAGE_QUOTA_EXCEEDED: (action) => (
        <>
            you have exceeded your storage quota, please{' '}
            <Trigger onClick={action}>upgrade</Trigger> your plan
        </>
    ),
    INITIAL_LOAD_DELAY_WARNING: 'the first load may take some time',
    USER_DOES_NOT_EXIST: 'sorry, could not find a user with that email',
    UPLOAD_BUTTON_TEXT: 'upload',
    NO_ACCOUNT: "don't have an account?",
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
    UPLOAD_FIRST_PHOTO_DESCRIPTION: 'preserve your first memory with ente',
    UPLOAD_FIRST_PHOTO: 'preserve',
    UPLOAD_DROPZONE_MESSAGE: 'drop to backup your files',
    CONFIRM_DELETE: 'confirm deletion',
    DELETE_MESSAGE: `the selected files will be permanently deleted and can't be restored `,
    DELETE_FILE: 'delete files',
    DELETE: 'delete',
    MULTI_FOLDER_UPLOAD: 'multiple folders detected',
    UPLOAD_STRATEGY_CHOICE: 'would you like to upload them into',
    UPLOAD_STRATEGY_SINGLE_COLLECTION: 'a single album',
    OR: 'or',
    UPLOAD_STRATEGY_COLLECTION_PER_FOLDER: 'separate albums',
    SESSION_EXPIRED_MESSAGE:
        'your session has expired, please login again to continue',
    SESSION_EXPIRED: 'session expired',
    SYNC_FAILED: 'failed to sync with server, please refresh this page',
    PASSWORD_GENERATION_FAILED:
        "your browser was unable to generate a strong key that meets ente's encryption standards, please try using the mobile app or another browser",
    CHANGE_PASSWORD: 'change password',
    GO_BACK: 'go back',
    DOWNLOAD_RECOVERY_KEY: 'recovery key',
    SAVE_LATER: 'save later',
    SAVE: 'save',
    RECOVERY_KEY_DESCRIPTION:
        'if you forget your password, the only way you can recover your data is with this key',
    RECOVER_KEY_GENERATION_FAILED:
        'recovery code could not be generated, please try again',
    KEY_NOT_STORED_DISCLAIMER:
        "we don't store this key, so please save this in a safe place",
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
    NO_TWO_FACTOR_RECOVERY_KEY_MESSAGE: () => (
        <>
            please drop an email to{' '}
            <a href="mailto:support@ente.io">support@ente.io</a> from your
            registered email address
        </>
    ),
    CONTACT_SUPPORT: 'contact support',
    REQUEST_FEATURE: 'request feature',
    SUPPORT: 'support',
    CONFIRM: 'confirm',
    SKIP: 'skip',
    CANCEL: 'cancel',
    LOGOUT: 'logout',
    DELETE_ACCOUNT: 'delete account',
    DELETE_ACCOUNT_MESSAGE: () => (
        <>
            <p>
                please send an email to{' '}
                <a href="mailto:account-deletion@ente.io">
                    account-deletion@ente.io
                </a>{' '}
                from your registered email address.{' '}
            </p>
            your request will be processed within 72 hours.
        </>
    ),
    LOGOUT_MESSAGE: 'sure you want to logout?',
    CHANGE: 'change',
    CHANGE_EMAIL: 'change email?',
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
                style={{ color: '#51cd7c' }}
                rel="noreferrer">
                android
            </a>{' '}
            or{' '}
            <a
                href="https://apps.apple.com/in/app/ente-photos/id1542026904"
                style={{ color: '#51cd7c' }}
                target="_blank"
                rel="noreferrer">
                ios app{' '}
            </a>
            to automatically backup all your photos
        </>
    ),
    DOWNLOAD_APP_MESSAGE: () => (
        <>
            <p>
                sorry, this operation is currently only supported on our desktop
                app
            </p>
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
                you are on the <strong>free</strong> plan that expires on{' '}
                {dateString(expiryTime)}
            </p>
        </>
    ),
    RENEWAL_ACTIVE_SUBSCRIPTION_INFO: (expiryTime) => (
        <p>your subscription will renew on {dateString(expiryTime)}</p>
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
            you have used {usage} out of your {quota} quota
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
    SUBSCRIPTION_VERIFICATION_FAILED:
        'we were not able to verify your purchase, verification can take few hours',
    SUBSCRIPTION_PURCHASE_FAILED:
        'subscription purchase failed , please try again',
    SUBSCRIPTION_UPDATE_FAILED:
        'subscription updated failed , please try again',
    UPDATE_PAYMENT_METHOD_MESSAGE:
        'we are sorry, payment failed when we tried to charge your card, please update your payment method and try again',
    STRIPE_AUTHENTICATION_FAILED:
        'we are unable to authenticate your payment method. please choose a different payment method and try again',
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
    ACTIVATE_SUBSCRIPTION_MESSAGE: (expiryTime) =>
        `once reactivated, you will be billed on ${dateString(expiryTime)}`,
    SUBSCRIPTION_ACTIVATE_SUCCESS: 'subscription successfully activated',
    SUBSCRIPTION_ACTIVATE_FAILED: 'failed to reactivate subscription renewals',

    SUBSCRIPTION_PURCHASE_SUCCESS_TITLE: 'thank you',
    CANCEL_SUBSCRIPTION_ON_MOBILE:
        'please cancel your subscription from the mobile app to activate a subscription here',
    RENAME: 'rename',
    RENAME_COLLECTION: 'rename album',
    CONFIRM_DELETE_COLLECTION: 'confirm album deletion',
    DELETE_COLLECTION: 'delete album',
    DELETE_COLLECTION_FAILED: 'album deletion failed, please try again',
    DELETE_COLLECTION_MESSAGE: () => (
        <>
            <p>are you sure you want to delete this album?</p>
            <p>
                all files that are unique to this album will be moved to trash
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
            <div style={{ marginTop: '16px' }}>
                <em style={{ color: '#3c3c3c' }}>
                    memories are fonder when shared
                </em>
            </div>
        </>
    ),
    SHARE_WITH_SELF: 'oops, you cannot share with yourself',
    ALREADY_SHARED: (email) =>
        `oops, you're already sharing this with ${email}`,
    SHARING_BAD_REQUEST_ERROR: 'sharing album not allowed',
    SHARING_DISABLED_FOR_FREE_ACCOUNTS: 'sharing is disabled for free accounts',
    CREATE_ALBUM_FAILED: 'failed to create album , please try again',
    SEARCH_HINT: () => (
        <span>try searching for New York, April 14, Christmas...</span>
    ),
    TERMS_AND_CONDITIONS: () => (
        <p>
            I agree to the{' '}
            <a href="https://ente.io/terms" target="_blank" rel="noreferrer">
                terms
            </a>{' '}
            and{' '}
            <a href="https://ente.io/privacy" target="_blank" rel="noreferrer">
                privacy policy
            </a>{' '}
        </p>
    ),
    CONFIRM_PASSWORD_NOT_SAVED: () => (
        <p>
            I understand that if I lose my password , I may lose my data since
            my data is{' '}
            <a
                href="https://ente.io/architecture"
                target="_blank"
                rel="noreferrer">
                end-to-end encrypted
            </a>{' '}
            with ente
        </p>
    ),
    SEARCH_STATS: ({ resultCount, timeTaken }) => (
        <span>
            found <span style={{ color: '#51cd7c' }}>{resultCount}</span>{' '}
            memories ( <span style={{ color: '#51cd7c' }}> {timeTaken}</span>{' '}
            seconds )
        </span>
    ),
    NOT_FILE_OWNER: 'you cannot delete files in a shared album',
    ADD_TO_COLLECTION: 'add to album',
    SELECTED: 'selected',
    VIDEO_PLAYBACK_FAILED: 'video format not supported',
    VIDEO_PLAYBACK_FAILED_DOWNLOAD_INSTEAD:
        'this video cannot be played on your browser',
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
    LOGIN_TO_UPLOAD_FILES: (count: number) =>
        count === 1
            ? `1 file received. login to upload`
            : `${count} files received. login to upload`,
    FILES_TO_BE_UPLOADED: (count: number) =>
        count === 1
            ? `1 file received. uploading in a jiffy`
            : `${count} files received. uploading in a jiffy`,
    TWO_FACTOR: 'two-factor',
    TWO_FACTOR_AUTHENTICATION: 'two-factor authentication',
    TWO_FACTOR_QR_INSTRUCTION:
        'scan the QR code below with your favorite authenticator app',
    ENTER_CODE_MANUALLY: 'enter the code manually',
    TWO_FACTOR_MANUAL_CODE_INSTRUCTION:
        'please enter this code in your favorite authenticator app',
    SCAN_QR_CODE: 'scan QR code instead',
    CONTINUE: 'continue',
    BACK: 'back',
    ENABLE_TWO_FACTOR: 'enable two-factor',
    ENABLE: 'enable',
    LOST_DEVICE: 'lost two-factor device?',
    INCORRECT_CODE: 'incorrect code',
    RECOVER_TWO_FACTOR: 'recover two-factor',
    TWO_FACTOR_INFO:
        'add an additional layer of security by requiring more than your email and password to log in to your account',
    DISABLE_TWO_FACTOR_HINT: 'disable two-factor authentication',
    UPDATE_TWO_FACTOR_HINT: 'update your authenticator device',
    DISABLE: 'disable',
    RECONFIGURE: 'reconfigure',
    UPDATE_TWO_FACTOR: 'update two-factor',
    UPDATE_TWO_FACTOR_MESSAGE:
        'continuing forward will void any previously configured authenticators',
    UPDATE: 'update',
    DISABLE_TWO_FACTOR: 'disable two-factor',
    DISABLE_TWO_FACTOR_MESSAGE:
        'are you sure you want to disable your two-factor authentication',
    TWO_FACTOR_SETUP_FAILED: 'failed to setup two factor, please try again',
    TWO_FACTOR_SETUP_SUCCESS:
        'two factor authentication successfully configured',
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
    LOCAL_STORAGE_NOT_ACCESSIBLE_MESSAGE:
        'your browser or an addon is blocking ente from saving data into local storage. please try loading this page after switching your browsing mode.',
    RETRY: 'retry',
    UPDATE_EMAIL: 'change email',
    SEND_OTT: 'send otp',
    EMAIl_ALREADY_OWNED: 'email already taken',
    EMAIL_UDPATE_SUCCESSFUL: 'your email has been udpated successfully',
    UPLOAD_FAILED: 'upload failed',
    ETAGS_BLOCKED: (url: string) => (
        <>
            <p>
                {' '}
                we were unable to upload the following files because of your
                browser configuration.
            </p>
            <p>
                {' '}
                please disable any addons that might be preventing ente from
                using <code>eTags</code> to upload large files, or use our{' '}
                <a
                    href={url}
                    style={{ color: '#51cd7c', textDecoration: 'underline' }}
                    target="_blank"
                    rel="noreferrer">
                    desktop app
                </a>{' '}
                for a more reliable import experience.
            </p>
        </>
    ),

    RETRY_FAILED: 'retry failed uploads',
    FAILED_UPLOADS: 'failed uploads ',
    SKIPPED_FILES: 'ignored uploads',
    UNSUPPORTED_FILES: 'unsupported files',
    SUCCESSFUL_UPLOADS: 'successful uploads',
    SKIPPED_INFO:
        'skipped these as there are files with matching names in the same album',
    UNSUPPORTED_INFO: 'ente does not support these file formats yet',
    BLOCKED_UPLOADS: 'blocked uploads',
    INPROGRESS_UPLOADS: 'uploads in progress',
    TOO_LARGE_UPLOADS: 'large files',
    TOO_LARGE_INFO:
        'these files were not uploaded as they exceed the maximum size limit for your storage plan',
    UPLOAD_TO_COLLECTION: 'upload to album',
    ARCHIVE: 'archive',
    ALL: 'all',
    MOVE_TO_COLLECTION: 'move to album',
    UNARCHIVE: 'un-archive',
    MOVE: 'move',
    ADD: 'add',
    SORT: 'sort',
    REMOVE: 'remove',
    CONFIRM_REMOVE: 'confirm removal',
    TRASH: 'trash',
    MOVE_TO_TRASH: 'move to trash',
    TRASH_MESSAGE:
        'the selected files will be removed from all albums and moved to trash ',
    DELETE_PERMANENTLY: 'delete permanently',
    RESTORE: 'restore',
    CONFIRM_RESTORE: 'confirm restoration',
    RESTORE_MESSAGE: 'restore selected files ?',
    RESTORE_TO_COLLECTION: 'restore to album',
    AUTOMATIC_BIN_DELETE_MESSAGE: (relativeTime: string) =>
        `permanently deleted ${relativeTime}`,
    EMPTY_TRASH: 'empty trash',
    CONFIRM_EMPTY_TRASH: 'empty trash?',
    EMPTY_TRASH_MESSAGE:
        'all files will be permanently removed from your ente account',

    CONFIRM_REMOVE_MESSAGE: () => (
        <>
            <p>are you sure you want to remove these files from the album?</p>
            <p>
                all files that are unique to this album will be moved to trash
            </p>
        </>
    ),
    SORT_BY_LATEST_PHOTO: 'recent photo',
    SORT_BY_MODIFICATION_TIME: 'last updated',
    SORT_BY_COLLECTION_NAME: 'album name',
    FIX_LARGE_THUMBNAILS: 'compress thumbnails',
    THUMBNAIL_REPLACED: 'thumbnails compressed',
    FIX_THUMBNAIL: 'compress',
    FIX_THUMBNAIL_LATER: 'compress later',
    REPLACE_THUMBNAIL_NOT_STARTED: () => (
        <>
            some of your videos thumbnails can be compressed to save space.
            would you like ente to compress them?
        </>
    ),
    REPLACE_THUMBNAIL_COMPLETED: () => (
        <>successfully compressed all thumbnails</>
    ),
    REPLACE_THUMBNAIL_NOOP: () => (
        <>you have no thumbnails that can be compressed further</>
    ),
    REPLACE_THUMBNAIL_COMPLETED_WITH_ERROR: () => (
        <>could not compress some of your thumbnails, please retry</>
    ),
    FIX_CREATION_TIME: 'fix time',
    FIX_CREATION_TIME_IN_PROGRESS: 'fixing time',
    CREATION_TIME_UPDATED: `file time updated`,

    UPDATE_CREATION_TIME_NOT_STARTED: () => (
        <>select the option you want to use to fix creation time</>
    ),
    UPDATE_CREATION_TIME_COMPLETED: () => <>successfully updated all files</>,

    UPDATE_CREATION_TIME_COMPLETED_WITH_ERROR: () => (
        <>file time updation failed for some files, please retry</>
    ),
    FILE_NAME_CHARACTER_LIMIT: '100 characters max',

    CREATION_DATE_TIME: 'creation date original ',
    DATE_TIME_DIGITIZED: 'date time digitized',
    CUSTOM_TIME: 'custom time',
};

export default englishConstants;
