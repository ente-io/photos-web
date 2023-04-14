import { GalleryContext } from 'pages/gallery';
import React, { MouseEventHandler, useContext, useMemo } from 'react';
import {
    hasPaidSubscription,
    isOnFreePlan,
    hasExceededStorageQuota,
    isSubscriptionActive,
    isSubscriptionCancelled,
    hasStripeSubscription,
} from 'utils/billing';
import Box from '@mui/material/Box';
import { UserDetails } from 'types/user';
import { Trans } from 'react-i18next';
import { t } from 'i18next';

import { Typography } from '@mui/material';
import billingService from 'services/billingService';
import { isPartOfFamily, isFamilyAdmin } from 'utils/user/family';
import LinkButton from 'components/pages/gallery/LinkButton';

export default function SubscriptionStatus({
    userDetails,
}: {
    userDetails: UserDetails;
}) {
    const { showPlanSelectorModal } = useContext(GalleryContext);

    const hasAMessage = useMemo(() => {
        if (!userDetails) {
            return false;
        }
        if (
            isPartOfFamily(userDetails.familyData) &&
            !isFamilyAdmin(userDetails.familyData)
        ) {
            return false;
        }
        if (
            hasPaidSubscription(userDetails.subscription) &&
            !isSubscriptionCancelled(userDetails.subscription)
        ) {
            return false;
        }
        return true;
    }, [userDetails]);

    const handleClick = useMemo(() => {
        const eventHandler: MouseEventHandler<HTMLSpanElement> = (e) => {
            e.stopPropagation();
            if (userDetails) {
                if (isSubscriptionActive(userDetails.subscription)) {
                    if (hasExceededStorageQuota(userDetails)) {
                        showPlanSelectorModal();
                    }
                } else {
                    if (hasStripeSubscription(userDetails.subscription)) {
                        billingService.redirectToCustomerPortal();
                    } else {
                        showPlanSelectorModal();
                    }
                }
            }
        };
        return eventHandler;
    }, [userDetails]);

    if (!hasAMessage) {
        return <></>;
    }

    return (
        <Box px={1} pt={0.5}>
            <Typography
                variant="body2"
                color={'text.secondary'}
                onClick={handleClick && handleClick}
                sx={{ cursor: handleClick && 'pointer' }}>
                {isSubscriptionActive(userDetails.subscription) ? (
                    isOnFreePlan(userDetails.subscription) ? (
                        <Trans
                            i18nKey={'FREE_SUBSCRIPTION_INFO'}
                            values={{
                                date: userDetails.subscription?.expiryTime,
                            }}
                        />
                    ) : isSubscriptionCancelled(userDetails.subscription) ? (
                        t('RENEWAL_CANCELLED_SUBSCRIPTION_INFO', {
                            date: userDetails.subscription?.expiryTime,
                        })
                    ) : (
                        hasExceededStorageQuota(userDetails) && (
                            <Trans
                                i18nKey={
                                    'STORAGE_QUOTA_EXCEEDED_SUBSCRIPTION_INFO'
                                }
                                components={{
                                    a: <LinkButton onClick={handleClick} />,
                                }}
                            />
                        )
                    )
                ) : (
                    <Trans
                        i18nKey={'SUBSCRIPTION_EXPIRED_MESSAGE'}
                        components={{
                            a: <LinkButton onClick={handleClick} />,
                        }}
                    />
                )}
            </Typography>
        </Box>
    );
}
