import { TimeStampListItem } from 'components/PhotoList';
import { REPORT_REASON } from 'constants/publicCollection';
import { EnteFile } from 'types/file';

export interface PublicCollectionGalleryContextType {
    token: string;
    passwordToken: string;
    accessedThroughSharedURL: boolean;
    openReportForm: () => void;
    photoListHeader: TimeStampListItem;
}

export interface LocalSavedPublicCollectionFiles {
    collectionUID: string;
    files: EnteFile[];
}

export interface AbuseReportRequest {
    url: string;
    reason: REPORT_REASON;
    details: AbuseReportDetails;
}

export interface AbuseReportDetails {
    fullName: string;
    email: string;
    comment: string;
    signature: string;
    onBehalfOf: string;
    jobTitle: string;
    address: Address;
}

export interface Address {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone: string;
}
