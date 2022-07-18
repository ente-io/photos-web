import { Subscription } from 'types/billing';

export interface KeyAttributes {
    kekSalt: string;
    encryptedKey: string;
    keyDecryptionNonce: string;
    opsLimit: number;
    memLimit: number;
    publicKey: string;
    encryptedSecretKey: string;
    secretKeyDecryptionNonce: string;
    masterKeyEncryptedWithRecoveryKey: string;
    masterKeyDecryptionNonce: string;
    recoveryKeyEncryptedWithMasterKey: string;
    recoveryKeyDecryptionNonce: string;
}
export interface KEK {
    key: string;
    opsLimit: number;
    memLimit: number;
}

export interface UpdatedKey {
    kekSalt: string;
    encryptedKey: string;
    keyDecryptionNonce: string;
    memLimit: number;
    opsLimit: number;
}
export interface RecoveryKey {
    masterKeyEncryptedWithRecoveryKey: string;
    masterKeyDecryptionNonce: string;
    recoveryKeyEncryptedWithMasterKey: string;
    recoveryKeyDecryptionNonce: string;
}
export interface User {
    id: number;
    name: string;
    email: string;
    token: string;
    encryptedToken: string;
    isTwoFactorEnabled: boolean;
    twoFactorSessionID: string;
    usage: number;
    fileCount: number;
    sharedCollectionCount: number;
}
export interface EmailVerificationResponse {
    id: number;
    keyAttributes?: KeyAttributes;
    encryptedToken?: string;
    token?: string;
    twoFactorSessionID: string;
}

export interface TwoFactorVerificationResponse {
    id: number;
    keyAttributes: KeyAttributes;
    encryptedToken?: string;
    token?: string;
}

export interface TwoFactorSecret {
    secretCode: string;
    qrCode: string;
}

export interface TwoFactorRecoveryResponse {
    encryptedSecret: string;
    secretDecryptionNonce: string;
}

export interface FamilyMember {
    email: string;
    usage: number;
    id: string;
    isAdmin: boolean;
}

export interface FamilyData {
    storage: number;
    expiry: number;
    members: FamilyMember[];
}

export interface UserDetails {
    email: string;
    usage: number;
    fileCount: number;
    sharedCollectionCount: number;
    subscription: Subscription;
    familyData?: FamilyData;
}

export interface EncryptedUserPreferences {
    version: number;
    data: string;
    header: string;
}

export interface UserPreferencesProps {
    isImgTranscodingEnabled?: boolean;
    isVidTranscodingEnabled?: boolean;
}

export interface UserPreferences
    extends Omit<EncryptedUserPreferences, 'data'> {
    data: UserPreferencesProps;
}
