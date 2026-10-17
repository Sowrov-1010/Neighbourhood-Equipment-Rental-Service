export type PricingType = 'free' | 'hourly' | 'daily' | 'per_use';

export type AssetCondition = 'Like New' | 'Good' | 'Fair' | 'Heavy Wear';

export type PaymentMethod = 'cash' | 'mobile_banking' | 'both';

export type PaymentChannel = 'bkash' | 'nagad' | 'rocket' | 'bank_account' | 'cash' | 'none';

export type RentalStatus = 
  | 'requested'
  | 'approved'
  | 'payment_sent'
  | 'payment_confirmed'
  | 'active'
  | 'returned'
  | 'overdue'
  | 'disputed'
  | 'blacklisted'
  | 'expired'
  | 'rejected'
  | 'resolved';

export interface UserReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  targetUserId: string;
  rating: number; // 1-5
  comment: string;
  tags: string[];
  createdAt: string;
}

export interface ProductReview {
  id: string;
  assetId: string;
  assetTitle: string;
  rentalId?: string;
  reviewerId: string;
  reviewerName: string;
  rating: number; // 1-5
  qualityScore: number; // 1-5
  comment: string;
  verifiedBorrower: boolean;
  createdAt: string;
  aspects: {
    powerHealth: boolean;
    safetyGuard: boolean;
    cleanliness: boolean;
    operationalAccuracy: boolean;
  };
}

export interface PointOfInterest {
  id: string;
  name: string;
  type: 'depot' | 'repair_hub' | 'locker_station' | 'hardware_partner';
  categoryLabel: string;
  neighborhood: string;
  distanceKm: number;
  coordinates: { lat: number; lng: number };
  address: string;
  hours: string;
  services: string[];
  phone: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  securityPin?: string; // 4-6 digit recovery & authentication PIN
  phone?: string;
  role: 'user' | 'admin';
  avatar?: string;
  neighborhood: string;
  coordinates: { lat: number; lng: number };
  rating: number; // 1.0 - 5.0
  totalBorrowed: number;
  totalLent: number;
  onTimeReturnCount: number;
  overdueInstances: number;
  isBlacklisted: boolean;
  blacklistedReason?: string;
  adminFinePending?: number;
  joinedDate?: string;
  lenderPaymentDetails?: {
    mobileBankingProvider?: string; // 'bKash' | 'Nagad' | 'Rocket' | 'Bank Account'
    mobileBankingHandle?: string;
    bankName?: string;
    branchName?: string;
    accountNumber?: string;
    accountTitle?: string;
    cashAccepted?: boolean;
  };
  flags: {
    lateReturn: number;
    paymentIssue: number;
    equipmentDamage: number;
    unresponsive: number;
  };
  recentFeedback?: string;
}

export interface Asset {
  id: string;
  title: string;
  category: 'Power Tools' | 'Ladders & Access' | 'Household Appliances' | 'Outdoor & Garden' | 'Plumbing & Mechanical' | 'Cleaning Equipment';
  description: string;
  imageUrl: string;
  pricingType: PricingType;
  priceAmount: number; // 0 for free
  condition: AssetCondition;
  isAvailable: boolean;
  ownerId: string;
  ownerName: string;
  neighborhood: string;
  distanceKm: number;
  acceptedPayments: PaymentMethod;
  lenderPaymentDetails: {
    mobileBankingProvider?: string; // e.g. "bKash" | "Nagad" | "Rocket" | "Bank Account"
    mobileBankingHandle?: string;
    bankName?: string;
    branchName?: string;
    accountNumber?: string;
    accountTitle?: string;
    cashInstructions?: string;
  };
  features: string[];
  isNonConsumableVerified: boolean;
  unavailableUntil?: string;
}

export interface BorrowerQualityCheck {
  verified: boolean;
  conditionRating: number; // 1-5
  checklist: {
    powerHealth: boolean;
    safetyGuardPresent: boolean;
    noDamage: boolean;
    cleanCondition: boolean;
  };
  notes?: string;
  verifiedAt?: string;
  productRating?: number;
  productComment?: string;
}

export interface RentalRequest {
  id: string;
  assetId: string;
  assetTitle: string;
  assetImage: string;
  lenderId: string;
  lenderName: string;
  borrowerId: string;
  borrowerName: string;
  borrowerRating: number;
  status: RentalStatus;
  pricingType: PricingType;
  rate: number;
  durationHours: number;
  durationDays: number;
  totalCost: number;
  requestedAt: string;
  expiresAt: string; // 24-hr TTL
  startDate: string;
  endDate: string;
  paymentMethodChosen: 'cash' | 'mobile_banking' | 'bkash' | 'nagad' | 'rocket' | 'bank_account' | 'none';
  mobileBankingTxnId?: string;
  paymentAccountUsed?: string;
  paymentBankDetails?: {
    bankName?: string;
    branchName?: string;
    accountNumber?: string;
    accountTitle?: string;
  };
  paymentSentAt?: string;
  paymentConfirmedAt?: string;
  handoverChecklistSigned?: boolean;
  handoverTime?: string;
  borrowerQualityCheck?: BorrowerQualityCheck;
  returnedTime?: string;
  overdueNotified?: boolean;
  rejectionReason?: string;
  disputeId?: string;
  
  // Early return penalty / fee percentage
  earlyReturnRequestedBy?: 'owner' | 'borrower';
  earlyReturnInitiatedAt?: string;
  earlyReturnPenaltyPercent?: number; // e.g. 20%
  earlyReturnCompensationAmount?: number; // compensation credit to borrower
  earlyReturnReason?: string;
}

export interface DisputeTicket {
  id: string;
  rentalId: string;
  assetTitle: string;
  complainantId: string;
  complainantName: string;
  complainantRole: 'lender' | 'borrower';
  defendantId: string;
  defendantName: string;
  reason: string;
  details: string;
  evidenceAttachments: string[]; // Mock photos or text screenshot references
  createdAt: string;
  status: 'under_investigation' | 'directive_issued' | 'penalized' | 'resolved';
  adminDirective?: string;
  adminFineLevied?: number;
  adminNotes?: string;
  resolvedAt?: string;
}

export interface BroadcastRequirement {
  id: string;
  borrowerId: string;
  borrowerName: string;
  requiredItem: string;
  category: string;
  neededFor: string;
  maxDistanceKm: number;
  preferredDate: string;
  createdAt: string;
  matchedLenderCount: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'request' | 'approval' | 'payment' | 'handover' | 'dispute' | 'broadcast' | 'system';
  createdAt: string;
  read: boolean;
  linkTab?: 'directory' | 'requests' | 'broadcast' | 'admin' | 'map';
  relatedId?: string;
}

export interface CloudSyncInfo {
  status: 'connected' | 'syncing' | 'offline' | 'connecting';
  projectId: string;
  databaseId: string;
  lastSyncedAt: string | null;
  syncedCounts: {
    assets: number;
    requests: number;
    users: number;
    disputes: number;
    broadcasts: number;
  };
}
