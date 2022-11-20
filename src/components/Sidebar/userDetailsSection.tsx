import React, { useContext, useEffect, useMemo, useState } from 'react';
import SubscriptionCard from './SubscriptionCard';
import { getUserDetailsV2 } from 'services/userService';
import { UserDetails } from 'types/user';
import { getData, setData } from 'utils/storage/localStorage';
import { useLocalState } from 'hooks/useLocalState';
import Typography from '@mui/material/Typography';
import SubscriptionStatus from './SubscriptionStatus';
import { Box, Skeleton } from '@mui/material';
import { MemberSubscriptionManage } from '../MemberSubscriptionManage';
import { GalleryContext } from 'pages/gallery';
import { isPartOfFamily, isFamilyAdmin } from 'utils/billing';

export default function UserDetailsSection({ sidebarView }) {
    const galleryContext = useContext(GalleryContext);

    const [userDetails, setUserDetails] =
        useLocalState<UserDetails>('USER_DETAILS');
    const [memberSubscriptionManageView, setMemberSubscriptionManageView] =
        useState(false);

    const openMemberSubscriptionManage = () =>
        setMemberSubscriptionManageView(true);
    const closeMemberSubscriptionManage = () =>
        setMemberSubscriptionManageView(false);

    useEffect(() => {
        if (!sidebarView) {
            return;
        }
        const main = async () => {
            const userDetails = await getUserDetailsV2();
            setUserDetails(userDetails);
            setData('SUBSCRIPTION', userDetails.subscription);
            setData('FAMILY_DATA', userDetails.familyData);
            setData('USER', {
                ...getData('USER'),
                email: userDetails.email,
            });
        };
        main();
    }, [sidebarView]);

    const isMemberSubscription = useMemo(
        () =>
            userDetails &&
            isPartOfFamily(userDetails.familyData) &&
            !isFamilyAdmin(userDetails.familyData),
        [userDetails]
    );

    const handleSubscriptionCardClick = isMemberSubscription
        ? openMemberSubscriptionManage
        : galleryContext.showPlanSelectorModal;

    return (
        <>
            <Box px={0.5} mt={2} pb={1.5} mb={1}>
                <Typography px={1} pb={1} color="text.secondary">
                    {userDetails ? (
                        userDetails.email
                    ) : (
                        <Skeleton animation="wave" />
                    )}
                </Typography>

                <SubscriptionCard
                    userDetails={userDetails}
                    onClick={handleSubscriptionCardClick}
                />
                <SubscriptionStatus userDetails={userDetails} />
            </Box>
            {isMemberSubscription && (
                <MemberSubscriptionManage
                    userDetails={userDetails}
                    open={memberSubscriptionManageView}
                    onClose={closeMemberSubscriptionManage}
                />
            )}
        </>
    );
}
