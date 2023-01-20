/**
 * Global English constants.
 */

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import LinkButton from 'components/pages/gallery/LinkButton';
import { formatDate } from 'utils/time/format';

const englishComponents = {
    HERO_SLIDE_1_TITLE: () => (
        <>
            <div>Private backups</div>
            <div> for your memories</div>
        </>
    ),
    HERO_SLIDE_2_TITLE: () => (
        <>
            <div>Safely stored </div>
            <div>at a fallout shelter</div>
        </>
    ),
    HERO_SLIDE_3_TITLE: () => (
        <>
            <div>Available</div>
            <div> everywhere</div>
        </>
    ),
    EMAIL_SENT: ({ email }) => (
        <span>
            Verification code sent to{' '}
            <Typography
                component={'span'}
                fontSize="inherit"
                color="text.secondary">
                {email}
            </Typography>
        </span>
    ),
    PASSPHRASE_DISCLAIMER: () => (
        <>
            We don't store your password, so if you forget it,{' '}
            <strong>we will not be able to help you </strong>
            recover your data without a recovery key.
        </>
    ),
    SUBSCRIPTION_EXPIRED_MESSAGE: (onClick) => (
        <>
            Your subscription has expired, please{' '}
            <LinkButton onClick={onClick}> renew </LinkButton>
        </>
    ),
    UPLOAD_FIRST_PHOTO_DESCRIPTION: () => (
        <>
            Preserve your first memory with <strong> ente </strong>
        </>
    ),
    NO_TWO_FACTOR_RECOVERY_KEY_MESSAGE: () => (
        <>
            Please drop an email to{' '}
            <a href="mailto:support@ente.io">support@ente.io</a> from your
            registered email address
        </>
    ),
    DELETE_ACCOUNT_MESSAGE: () => (
        <>
            <p>
                Please send an email to{' '}
                <Link href="mailto:account-deletion@ente.io">
                    account-deletion@ente.io
                </Link>{' '}
                from your registered email address.{' '}
            </p>
            <p>Your request will be processed within 72 hours.</p>
        </>
    ),
    INSTALL_MOBILE_APP: () => (
        <>
            Install our{' '}
            <a
                href="https://play.google.com/store/apps/details?id=io.ente.photos"
                target="_blank"
                style={{ color: '#51cd7c' }}
                rel="noreferrer">
                Android
            </a>{' '}
            or{' '}
            <a
                href="https://apps.apple.com/in/app/ente-photos/id1542026904"
                style={{ color: '#51cd7c' }}
                target="_blank"
                rel="noreferrer">
                iOS app{' '}
            </a>
            to automatically backup all your photos
        </>
    ),
    FREE_SUBSCRIPTION_INFO: (expiryTime) => (
        <>
            You are on the <strong>free</strong> plan that expires on{' '}
            {formatDate(expiryTime)}
        </>
    ),
    STORAGE_QUOTA_EXCEEDED_SUBSCRIPTION_INFO: (onClick) => (
        <>
            You have exceeded your storage quota,, please{' '}
            <LinkButton onClick={onClick}> upgrade </LinkButton>
        </>
    ),
    SUBSCRIPTION_PURCHASE_SUCCESS: (expiryTime) => (
        <>
            <p>We've received your payment</p>
            <p>
                Your subscription is valid till{' '}
                <strong>{formatDate(expiryTime)}</strong>
            </p>
        </>
    ),
    CANCEL_SUBSCRIPTION_MESSAGE: () => (
        <>
            <p>
                All of your data will be deleted from our servers at the end of
                this billing period.
            </p>
            <p>Are you sure that you want to cancel your subscription?</p>
        </>
    ),
    MAIL_TO_MANAGE_SUBSCRIPTION: (
        <>
            Please contact us at{' '}
            <Link href={`mailto:support@ente.io`}>support@ente.io</Link> to
            manage your subscription
        </>
    ),
    DOWNLOAD_COLLECTION_MESSAGE: () => (
        <>
            <p>Are you sure you want to download the complete album?</p>
            <p>All files will be queued for download sequentially</p>
        </>
    ),
    TERMS_AND_CONDITIONS: () => (
        <Typography variant="body2">
            I agree to the{' '}
            <Link href="https://ente.io/terms" target="_blank" rel="noreferrer">
                terms
            </Link>{' '}
            and{' '}
            <Link
                href="https://ente.io/privacy"
                target="_blank"
                rel="noreferrer">
                privacy policy
            </Link>{' '}
        </Typography>
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
    ETAGS_BLOCKED: (link: string) => (
        <>
            <Box mb={1}>
                We were unable to upload the following files because of your
                browser configuration.
            </Box>
            <Box>
                Please disable any addons that might be preventing ente from
                using <code>eTags</code> to upload large files, or use our{' '}
                <Link href={link} target="_blank">
                    desktop app
                </Link>{' '}
                for a more reliable import experience.
            </Box>
        </>
    ),
    SKIPPED_VIDEOS_INFO: (link: string) => (
        <>
            <Box mb={1}>
                Presently we do not support adding videos via public links.{' '}
            </Box>
            <Box>
                To share videos, please{' '}
                <Link href={link} target="_blank">
                    signup
                </Link>{' '}
                for ente and share with the intended recipients using their
                email.
            </Box>
        </>
    ),
    CONFIRM_REMOVE_MESSAGE: () => (
        <>
            <p>Are you sure you want to remove these files from the album?</p>
            <p>
                All files that are unique to this album will be moved to trash
            </p>
        </>
    ),
    DISABLE_FILE_DOWNLOAD_MESSAGE: () => (
        <>
            <p>
                Are you sure that you want to disable the download button for
                files?{' '}
            </p>{' '}
            <p>
                Viewers can still take screenshots or save a copy of your photos
                using external tools{' '}
            </p>
        </>
    ),
    JUDICIAL_DESCRIPTION: () => (
        <>
            By checking the following boxes, I state{' '}
            <strong>UNDER PENALTY OF PERJURY </strong>of law that:
        </>
    ),
    CANVAS_BLOCKED_MESSAGE: () => (
        <>
            <p>
                It looks like your browser has disabled access to canvas, which
                is necessary to generate thumbnails for your photos
            </p>
            <p>
                Please enable access to your browser's canvas, or check out our
                desktop app
            </p>
        </>
    ),
    DOWNLOAD_LOGS_MESSAGE: () => (
        <>
            <p>
                This will download debug logs, which you can email to us to help
                debug your issue.
            </p>
            <p>
                Please note that file names will be included to help track
                issues with specific files.
            </p>
        </>
    ),
    CURRENT_USAGE: (usage) => (
        <>
            Current usage is <strong>{usage}</strong>
        </>
    ),
    ASK_FOR_FEEDBACK: (
        <>
            <p>We'll be sorry to see you go. Are you facing some issue?</p>
            <p>
                Please write to us at{' '}
                <Link href="mailto:feedback@ente.io">feedback@ente.io</Link>,
                maybe there is a way we can help.
            </p>
        </>
    ),
    CONFIRM_ACCOUNT_DELETION_MESSAGE: (
        <>
            <p>
                Your uploaded data will be scheduled for deletion, and your
                account will be permanently deleted.
            </p>
            <p>This action is not reversible.</p>
        </>
    ),
    ROOT_LEVEL_FILE_WITH_FOLDER_NOT_ALLOWED_MESSAGE: () => (
        <>
            <p>You have dragged and dropped a mixture of files and folders.</p>
            <p>
                Please provide either only files, or only folders when selecting
                option to create separate albums
            </p>
        </>
    ),
};

export default englishComponents;
