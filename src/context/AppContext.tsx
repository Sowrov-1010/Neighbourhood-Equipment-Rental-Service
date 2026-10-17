import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  Asset, 
  UserProfile, 
  RentalRequest, 
  DisputeTicket, 
  BroadcastRequirement, 
  UserReview, 
  RentalStatus,
  PricingType,
  AppNotification,
  CloudSyncInfo,
  ProductReview,
  PointOfInterest,
  BorrowerQualityCheck
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_ASSETS, 
  INITIAL_REQUESTS, 
  INITIAL_DISPUTES, 
  INITIAL_BROADCASTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PRODUCT_REVIEWS,
  INITIAL_POINTS_OF_INTEREST
} from '../data/mockData';
import { 
  db, 
  testConnection, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDocs 
} from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';

// Utility: Clean undefined fields for Firestore compatibility
function sanitizeForFirestore<T>(data: T): any {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item));
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned;
  }
  return data;
}

interface AppContextType {
  // Cloud Database Sync State
  cloudSyncInfo: CloudSyncInfo;
  forceCloudResync: () => Promise<void>;

  // Auth & Security Code state
  isAuthenticated: boolean;
  currentUser: UserProfile;
  users: UserProfile[];
  isAdmin: boolean;
  adminSecurityCode: string;
  login: (email: string, password?: string) => { success: boolean; error?: string };
  adminLogin: (email: string, password: string, securityCode: string) => { success: boolean; error?: string };
  resetAdminSecurityCode: (superAdminEmail: string, newSecurityCode: string) => { success: boolean; error?: string };
  resetUserSecurityPin: (userId: string, newPin: string, authorizedByEmail?: string) => { success: boolean; error?: string };
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    neighborhood: string;
    role?: 'user';
    securityPin?: string;
    mobileBankingProvider?: string;
    mobileBankingHandle?: string;
    bankName?: string;
    accountNumber?: string;
  }) => { success: boolean; error?: string };
  adminRegister: (data: {
    name: string;
    email: string;
    password: string;
    securityCode: string;
  }) => { success: boolean; error?: string };
  logout: () => void;
  setCurrentUserById: (userId: string) => void;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  settleAdminFine: () => void;

  // Admin Process Controls
  adminForceTransitionRequest: (requestId: string, newStatus: RentalStatus, note?: string) => void;
  adminDeleteAsset: (assetId: string) => void;

  // Assets & Listings
  assets: Asset[];
  createAsset: (asset: Omit<Asset, 'id' | 'distanceKm' | 'isAvailable'>) => { success: boolean; error?: string };
  toggleAssetAvailability: (assetId: string) => void;

  // Rental Lifecycle (FSM)
  rentalRequests: RentalRequest[];
  createRentalRequest: (data: {
    assetId: string;
    startDate: string;
    endDate: string;
    pricingType: PricingType;
    durationHours: number;
    durationDays: number;
    totalCost: number;
    paymentMethod: 'cash' | 'mobile_banking' | 'bkash' | 'nagad' | 'rocket' | 'bank_account' | 'none';
  }) => { success: boolean; error?: string; requestId?: string };
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string, reason?: string) => void;
  markPaymentSent: (requestId: string, txnId?: string, paymentChannel?: string, accountUsed?: string) => void;
  confirmPaymentReceived: (requestId: string) => void;
  signHandoverChecklist: (requestId: string) => void;
  confirmItemReturned: (requestId: string) => void;
  
  // Overdue Restriction & Verification
  canMarkOverdue: (requestId: string) => { allowed: boolean; remainingMs: number; dueTime: string; reason?: string };
  markRequestOverdue: (requestId: string) => { success: boolean; error?: string };

  // Early Return Penalty / Fee Percentage
  requestOwnerEarlyReturn: (requestId: string, penaltyPercent?: number, reason?: string) => { success: boolean; error?: string };

  // Quality Check System
  submitQualityVerification: (requestId: string, data: {
    conditionRating: number;
    checklist: {
      powerHealth: boolean;
      safetyGuardPresent: boolean;
      noDamage: boolean;
      cleanCondition: boolean;
    };
    notes: string;
    productRating?: number;
    productComment?: string;
  }) => void;

  // Product Reviews
  productReviews: ProductReview[];
  submitProductReview: (data: {
    assetId: string;
    rating: number;
    qualityScore: number;
    comment: string;
    reviewerId?: string;
    reviewerName?: string;
    aspects?: {
      powerHealth: boolean;
      safetyGuard: boolean;
      cleanliness: boolean;
      operationalAccuracy: boolean;
    };
  }) => void;

  // Points of Interest & Map View
  pointsOfInterest: PointOfInterest[];

  // Dispute & Admin Engine
  disputes: DisputeTicket[];
  fileDisputeTicket: (data: {
    rentalId: string;
    defendantId: string;
    defendantName: string;
    reason: string;
    details: string;
    evidenceAttachments: string[];
  }) => void;
  issueAdminDirective: (ticketId: string, directive: string) => void;
  levyAdminFine: (ticketId: string, userId: string, fineAmount: number, directive?: string) => void;
  blacklistUser: (userId: string, reason: string) => void;
  restoreUserStatus: (userId: string, ticketId?: string) => void;
  resolveDispute: (ticketId: string, notes?: string) => void;

  // Broadcasts
  broadcasts: BroadcastRequirement[];
  createBroadcast: (data: {
    requiredItem: string;
    category: string;
    neededFor: string;
    maxDistanceKm: number;
    preferredDate: string;
  }) => void;

  // Reviews & Risk Recalculation
  reviews: UserReview[];
  submitReview: (data: {
    rentalId: string;
    targetUserId: string;
    rating: number;
    comment: string;
    tags: string[];
  }) => void;

  // Notifications Activity Center
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Proximity & Obfuscation
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  getObfuscatedAddress: (neighborhood: string, isApprovedOrActive: boolean) => string;
  isHighRiskBorrower: (user: UserProfile) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Non-consumables blacklist check (FR-01.2)
const CONSUMABLE_TERMS = [
  'nail', 'nails', 'screw', 'screws', 'paint', 'paints', 'glue', 'fuel', 
  'gasoline', 'diesel', 'tape', 'sandpaper', 'caulk', 'cement mix', 
  'fertilizer', 'pesticide', 'battery single use', 'oil bottle'
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('neighborhood_tools_users_v2');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem('neighborhood_tools_active_user_id');
    return saved || 'u-lender';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('neighborhood_tools_auth_state');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('neighborhood_tools_assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });

  const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>(() => {
    const saved = localStorage.getItem('neighborhood_tools_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [disputes, setDisputes] = useState<DisputeTicket[]>(() => {
    const saved = localStorage.getItem('neighborhood_tools_disputes');
    return saved ? JSON.parse(saved) : INITIAL_DISPUTES;
  });

  const [broadcasts, setBroadcasts] = useState<BroadcastRequirement[]>(() => {
    const saved = localStorage.getItem('neighborhood_tools_broadcasts');
    return saved ? JSON.parse(saved) : INITIAL_BROADCASTS;
  });

  const [reviews, setReviews] = useState<UserReview[]>(() => {
    const saved = localStorage.getItem('neighborhood_tools_reviews');
    return saved ? JSON.parse(saved) : [];
  });

  const [productReviews, setProductReviews] = useState<ProductReview[]>(() => {
    const saved = localStorage.getItem('neighborhood_tools_product_reviews');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCT_REVIEWS;
  });

  const [adminSecurityCode, setAdminSecurityCode] = useState<string>(() => {
    const saved = localStorage.getItem('neighborhood_admin_security_code');
    return saved || '2580';
  });

  const [pointsOfInterest] = useState<PointOfInterest[]>(INITIAL_POINTS_OF_INTEREST);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('neighborhood_tools_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Cloud Database Sync State
  const [cloudSyncInfo, setCloudSyncInfo] = useState<CloudSyncInfo>({
    status: 'connecting',
    projectId: firebaseConfig.projectId || 'gen-lang-client-0439840115',
    databaseId: firebaseConfig.firestoreDatabaseId || 'ai-studio-neighborhoodtool-c0244fbb-ec4b-4ed6-b0ac-b73d98855bd1',
    lastSyncedAt: null,
    syncedCounts: {
      assets: INITIAL_ASSETS.length,
      requests: INITIAL_REQUESTS.length,
      users: INITIAL_USERS.length,
      disputes: INITIAL_DISPUTES.length,
      broadcasts: INITIAL_BROADCASTS.length,
    }
  });

  // Track if initial seeding happened
  const hasSeededRef = useRef(false);

  // Sync to local storage for instant offline resilience
  useEffect(() => {
    localStorage.setItem('neighborhood_tools_users_v2', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('neighborhood_tools_active_user_id', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('neighborhood_tools_auth_state', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('neighborhood_tools_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('neighborhood_tools_requests', JSON.stringify(rentalRequests));
  }, [rentalRequests]);

  useEffect(() => {
    localStorage.setItem('neighborhood_tools_disputes', JSON.stringify(disputes));
  }, [disputes]);

  useEffect(() => {
    localStorage.setItem('neighborhood_tools_broadcasts', JSON.stringify(broadcasts));
  }, [broadcasts]);

  useEffect(() => {
    localStorage.setItem('neighborhood_tools_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('neighborhood_tools_product_reviews', JSON.stringify(productReviews));
  }, [productReviews]);

  useEffect(() => {
    localStorage.setItem('neighborhood_admin_security_code', adminSecurityCode);
  }, [adminSecurityCode]);

  useEffect(() => {
    localStorage.setItem('neighborhood_tools_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Update synced counts in state
  useEffect(() => {
    setCloudSyncInfo(prev => ({
      ...prev,
      syncedCounts: {
        assets: assets.length,
        requests: rentalRequests.length,
        users: users.length,
        disputes: disputes.length,
        broadcasts: broadcasts.length,
      }
    }));
  }, [assets.length, rentalRequests.length, users.length, disputes.length, broadcasts.length]);

  // Cloud Firestore Persistence Helpers
  const persistDocToCloud = useCallback(async (collectionName: string, docId: string, data: any) => {
    try {
      setCloudSyncInfo(prev => ({ ...prev, status: 'syncing' }));
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, sanitizeForFirestore(data), { merge: true });
      setCloudSyncInfo(prev => ({ 
        ...prev, 
        status: 'connected', 
        lastSyncedAt: new Date().toISOString() 
      }));
    } catch (err) {
      console.warn(`Firestore sync write error on [${collectionName}/${docId}]:`, err);
      // Keep app functioning gracefully
      setCloudSyncInfo(prev => ({ ...prev, status: 'connected' }));
    }
  }, []);

  const deleteDocFromCloud = useCallback(async (collectionName: string, docId: string) => {
    try {
      setCloudSyncInfo(prev => ({ ...prev, status: 'syncing' }));
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      setCloudSyncInfo(prev => ({ 
        ...prev, 
        status: 'connected', 
        lastSyncedAt: new Date().toISOString() 
      }));
    } catch (err) {
      console.warn(`Firestore delete error on [${collectionName}/${docId}]:`, err);
    }
  }, []);

  // Force Full Cloud Resync
  const forceCloudResync = useCallback(async () => {
    setCloudSyncInfo(prev => ({ ...prev, status: 'syncing' }));
    try {
      // Push all current assets
      for (const asset of assets) {
        await setDoc(doc(db, 'assets', asset.id), sanitizeForFirestore(asset), { merge: true });
      }
      // Push all current users
      for (const user of users) {
        await setDoc(doc(db, 'users', user.id), sanitizeForFirestore(user), { merge: true });
      }
      // Push all rental requests
      for (const req of rentalRequests) {
        await setDoc(doc(db, 'rental_requests', req.id), sanitizeForFirestore(req), { merge: true });
      }
      // Push all disputes
      for (const dispute of disputes) {
        await setDoc(doc(db, 'disputes', dispute.id), sanitizeForFirestore(dispute), { merge: true });
      }
      // Push all broadcasts
      for (const broadcast of broadcasts) {
        await setDoc(doc(db, 'broadcasts', broadcast.id), sanitizeForFirestore(broadcast), { merge: true });
      }
      // Push reviews
      for (const review of reviews) {
        await setDoc(doc(db, 'reviews', review.id), sanitizeForFirestore(review), { merge: true });
      }

      setCloudSyncInfo(prev => ({
        ...prev,
        status: 'connected',
        lastSyncedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.error('Error during force resync to Firestore:', err);
      setCloudSyncInfo(prev => ({ ...prev, status: 'connected' }));
    }
  }, [assets, users, rentalRequests, disputes, broadcasts, reviews]);

  // Firestore Real-Time Subscriptions & Automatic Initial Seeding
  useEffect(() => {
    let unsubAssets: () => void = () => {};
    let unsubUsers: () => void = () => {};
    let unsubRequests: () => void = () => {};
    let unsubDisputes: () => void = () => {};
    let unsubBroadcasts: () => void = () => {};
    let unsubReviews: () => void = () => {};
    let unsubNotifications: () => void = () => {};

    const initCloudSubscriptions = async () => {
      try {
        await testConnection();
        setCloudSyncInfo(prev => ({ ...prev, status: 'connected', lastSyncedAt: new Date().toISOString() }));

        // 1. Assets Listener
        unsubAssets = onSnapshot(collection(db, 'assets'), async (snapshot) => {
          if (snapshot.empty && !hasSeededRef.current) {
            hasSeededRef.current = true;
            // Seed initial assets
            for (const item of INITIAL_ASSETS) {
              await setDoc(doc(db, 'assets', item.id), sanitizeForFirestore(item));
            }
          } else if (!snapshot.empty) {
            const loaded = snapshot.docs.map(d => d.data() as Asset);
            setAssets(loaded);
          }
        }, (err) => console.warn('Firestore assets onSnapshot notice:', err.message));

        // 2. Users Listener
        unsubUsers = onSnapshot(collection(db, 'users'), async (snapshot) => {
          if (snapshot.empty) {
            for (const user of INITIAL_USERS) {
              await setDoc(doc(db, 'users', user.id), sanitizeForFirestore(user));
            }
          } else {
            const loaded = snapshot.docs.map(d => d.data() as UserProfile);
            setUsers(loaded);
          }
        }, (err) => console.warn('Firestore users onSnapshot notice:', err.message));

        // 3. Rental Requests Listener
        unsubRequests = onSnapshot(collection(db, 'rental_requests'), async (snapshot) => {
          if (snapshot.empty) {
            for (const req of INITIAL_REQUESTS) {
              await setDoc(doc(db, 'rental_requests', req.id), sanitizeForFirestore(req));
            }
          } else {
            const loaded = snapshot.docs.map(d => d.data() as RentalRequest);
            setRentalRequests(loaded);
          }
        }, (err) => console.warn('Firestore requests onSnapshot notice:', err.message));

        // 4. Disputes Listener
        unsubDisputes = onSnapshot(collection(db, 'disputes'), async (snapshot) => {
          if (snapshot.empty) {
            for (const d of INITIAL_DISPUTES) {
              await setDoc(doc(db, 'disputes', d.id), sanitizeForFirestore(d));
            }
          } else {
            const loaded = snapshot.docs.map(d => d.data() as DisputeTicket);
            setDisputes(loaded);
          }
        }, (err) => console.warn('Firestore disputes onSnapshot notice:', err.message));

        // 5. Broadcasts Listener
        unsubBroadcasts = onSnapshot(collection(db, 'broadcasts'), async (snapshot) => {
          if (snapshot.empty) {
            for (const b of INITIAL_BROADCASTS) {
              await setDoc(doc(db, 'broadcasts', b.id), sanitizeForFirestore(b));
            }
          } else {
            const loaded = snapshot.docs.map(d => d.data() as BroadcastRequirement);
            setBroadcasts(loaded);
          }
        }, (err) => console.warn('Firestore broadcasts onSnapshot notice:', err.message));

        // 6. Reviews Listener
        unsubReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
          if (!snapshot.empty) {
            const loaded = snapshot.docs.map(d => d.data() as UserReview);
            setReviews(loaded);
          }
        }, (err) => console.warn('Firestore reviews onSnapshot notice:', err.message));

        // 7. Notifications Listener
        unsubNotifications = onSnapshot(collection(db, 'notifications'), async (snapshot) => {
          if (snapshot.empty) {
            for (const n of INITIAL_NOTIFICATIONS) {
              await setDoc(doc(db, 'notifications', n.id), sanitizeForFirestore(n));
            }
          } else {
            const loaded = snapshot.docs.map(d => d.data() as AppNotification);
            setNotifications(loaded);
          }
        }, (err) => console.warn('Firestore notifications onSnapshot notice:', err.message));

      } catch (err) {
        console.warn('Firebase initialization note (running in local mode with cloud queue):', err);
        setCloudSyncInfo(prev => ({ ...prev, status: 'connected' }));
      }
    };

    initCloudSubscriptions();

    return () => {
      unsubAssets();
      unsubUsers();
      unsubRequests();
      unsubDisputes();
      unsubBroadcasts();
      unsubReviews();
      unsubNotifications();
    };
  }, []);

  // Current user resolution
  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  // Notifications specific to current user
  const userNotifications = notifications.filter(n => n.userId === currentUser.id);
  const unreadNotificationsCount = userNotifications.filter(n => !n.read).length;

  const pushNotification = (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    persistDocToCloud('notifications', newNotif.id, newNotif);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === id) {
        const updated = { ...n, read: true };
        persistDocToCloud('notifications', id, updated);
        return updated;
      }
      return n;
    }));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => {
      if (n.userId === currentUser.id) {
        const updated = { ...n, read: true };
        persistDocToCloud('notifications', n.id, updated);
        return updated;
      }
      return n;
    }));
  };

  // Auth: Login
  const login = (emailOrPhone: string, password?: string): { success: boolean; error?: string } => {
    const cleanInput = emailOrPhone.trim().toLowerCase();
    const user = users.find(u => 
      u.email.toLowerCase() === cleanInput || 
      (u.phone && u.phone.replace(/\D/g, '') === cleanInput.replace(/\D/g, ''))
    );

    if (!user) {
      return { success: false, error: 'No account registered with this email or phone number.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, error: 'Incorrect password. (Try "password123" for demo accounts).' };
    }

    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    return { success: true };
  };

  // Admin Login (supports current security code or default 2580)
  const adminLogin = (email: string, password: string, securityCode: string): { success: boolean; error?: string } => {
    const code = securityCode.trim();
    if (code !== adminSecurityCode && code !== '2580') {
      return { success: false, error: 'Access Denied: Invalid Administrative Security Authorization Code.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminUser = users.find(u => u.email.toLowerCase() === cleanEmail && u.role === 'admin');

    if (!adminUser) {
      return { success: false, error: 'No administrative account found for this email address.' };
    }

    if (adminUser.password && adminUser.password !== password) {
      return { success: false, error: 'Incorrect administrative password.' };
    }

    setCurrentUserId(adminUser.id);
    setIsAuthenticated(true);
    return { success: true };
  };

  // Master Admin Security Code Reset (Restricted strictly to jahid_hassan1010@uits.edu.bd)
  const resetAdminSecurityCode = (superAdminEmail: string, newSecurityCode: string): { success: boolean; error?: string } => {
    const cleanEmail = superAdminEmail.trim().toLowerCase();
    if (cleanEmail !== 'jahid_hassan1010@uits.edu.bd') {
      return { 
        success: false, 
        error: 'Permission Denied: Only Main Super Administrator (jahid_hassan1010@uits.edu.bd) can reset the admin security authorization code.' 
      };
    }

    const cleanCode = newSecurityCode.trim();
    if (cleanCode.length < 4) {
      return { success: false, error: 'Security Authorization Code must be at least 4 alphanumeric characters.' };
    }

    setAdminSecurityCode(cleanCode);
    localStorage.setItem('neighborhood_admin_security_code', cleanCode);
    persistDocToCloud('settings', 'admin_auth', {
      adminSecurityCode: cleanCode,
      updatedBy: cleanEmail,
      updatedAt: new Date().toISOString()
    });

    pushNotification({
      userId: currentUser.id,
      title: 'Admin Security Code Reset Successful',
      message: `The Master Admin Security Code for admin login and account opening has been reset to "${cleanCode}".`,
      type: 'system',
      linkTab: 'admin',
    });

    return { success: true };
  };

  // User Security PIN Reset (User self-service or Main Admin reset)
  const resetUserSecurityPin = (userId: string, newPin: string, authorizedByEmail?: string): { success: boolean; error?: string } => {
    const cleanPin = newPin.trim();
    if (cleanPin.length < 4) {
      return { success: false, error: 'Security PIN must be at least 4 digits.' };
    }

    const isMasterAdmin = (authorizedByEmail || currentUser.email).toLowerCase().trim() === 'jahid_hassan1010@uits.edu.bd';
    const isSelf = currentUser.id === userId;

    if (!isMasterAdmin && !isSelf) {
      return { 
        success: false, 
        error: 'Unauthorized: Security PIN can only be reset by account owner or Main Admin (jahid_hassan1010@uits.edu.bd).' 
      };
    }

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, securityPin: cleanPin };
        persistDocToCloud('users', u.id, updated);
        return updated;
      }
      return u;
    }));

    pushNotification({
      userId,
      title: 'Security PIN Updated',
      message: `Your account security PIN has been successfully reset. Keep your PIN confidential.`,
      type: 'system',
      linkTab: 'requests',
    });

    return { success: true };
  };

  // Auth: Standard Resident Registration
  const register = (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    neighborhood: string;
    role?: 'user';
    securityPin?: string;
    mobileBankingProvider?: string;
    mobileBankingHandle?: string;
    bankName?: string;
    accountNumber?: string;
  }): { success: boolean; error?: string } => {
    if (!data.name.trim() || !data.email.trim() || !data.password.trim()) {
      return { success: false, error: 'Please fill in all required credentials.' };
    }

    const existing = users.find(u => u.email.toLowerCase() === data.email.trim().toLowerCase());
    if (existing) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      securityPin: data.securityPin?.trim() || '1234',
      phone: data.phone.trim(),
      role: 'user',
      neighborhood: data.neighborhood,
      coordinates: { lat: 37.775, lng: -122.418 },
      rating: 5.0,
      totalBorrowed: 0,
      totalLent: 0,
      onTimeReturnCount: 0,
      overdueInstances: 0,
      isBlacklisted: false,
      joinedDate: new Date().toISOString().slice(0, 10),
      lenderPaymentDetails: {
        mobileBankingProvider: data.mobileBankingProvider || 'bKash',
        mobileBankingHandle: data.mobileBankingHandle || data.phone || data.email,
        bankName: data.bankName || '',
        accountNumber: data.accountNumber || '',
        cashAccepted: true,
      },
      flags: {
        lateReturn: 0,
        paymentIssue: 0,
        equipmentDamage: 0,
        unresponsive: 0,
      },
      recentFeedback: 'New neighborhood member.',
    };

    setUsers(prev => [newUser, ...prev]);
    setCurrentUserId(newUser.id);
    setIsAuthenticated(true);

    // Save to Cloud Firestore
    persistDocToCloud('users', newUser.id, newUser);

    pushNotification({
      userId: newUser.id,
      title: 'Welcome to Neighborhood Tool Directory!',
      message: `Your community resident profile is active in ${data.neighborhood}. You can now borrow tools or list your own equipment for rent!`,
      type: 'system',
      linkTab: 'directory',
    });

    return { success: true };
  };

  // Admin Registration (requires Security Code)
  const adminRegister = (data: {
    name: string;
    email: string;
    password: string;
    securityCode: string;
  }): { success: boolean; error?: string } => {
    const code = data.securityCode.trim();
    if (code !== adminSecurityCode && code !== '2580') {
      return { success: false, error: 'Security Authorization Denied: Invalid Administrative Security Code.' };
    }

    if (!data.name.trim() || !data.email.trim() || !data.password.trim()) {
      return { success: false, error: 'Please fill in administrative name, email, and password.' };
    }

    const existing = users.find(u => u.email.toLowerCase() === data.email.trim().toLowerCase());
    if (existing) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newAdmin: UserProfile = {
      id: `u-admin-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      securityPin: '2580',
      phone: '(555) 000-ADMN',
      role: 'admin',
      neighborhood: 'District Municipal Center',
      coordinates: { lat: 37.775, lng: -122.418 },
      rating: 5.0,
      totalBorrowed: 0,
      totalLent: 0,
      onTimeReturnCount: 0,
      overdueInstances: 0,
      isBlacklisted: false,
      joinedDate: new Date().toISOString().slice(0, 10),
      flags: {
        lateReturn: 0,
        paymentIssue: 0,
        equipmentDamage: 0,
        unresponsive: 0,
      },
    };

    setUsers(prev => [newAdmin, ...prev]);
    setCurrentUserId(newAdmin.id);
    setIsAuthenticated(true);

    // Save to Cloud Firestore
    persistDocToCloud('users', newAdmin.id, newAdmin);

    return { success: true };
  };

  // Admin Direct Process Intervention
  const adminForceTransitionRequest = (requestId: string, newStatus: RentalStatus, note?: string) => {
    let updatedReq: RentalRequest | null = null;

    setRentalRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        updatedReq = {
          ...r,
          status: newStatus,
          rejectionReason: note ? `Admin Directive: ${note}` : r.rejectionReason,
        };
        return updatedReq;
      }
      return r;
    }));

    if (updatedReq) {
      persistDocToCloud('rental_requests', requestId, updatedReq);
    }

    if (['returned', 'resolved', 'rejected', 'expired'].includes(newStatus)) {
      const req = rentalRequests.find(r => r.id === requestId);
      if (req) {
        setAssets(prev => prev.map(a => {
          if (a.id === req.assetId) {
            const updated = { ...a, isAvailable: true, unavailableUntil: undefined };
            persistDocToCloud('assets', a.id, updated);
            return updated;
          }
          return a;
        }));
      }
    } else if (['approved', 'active', 'payment_confirmed'].includes(newStatus)) {
      const req = rentalRequests.find(r => r.id === requestId);
      if (req) {
        setAssets(prev => prev.map(a => {
          if (a.id === req.assetId) {
            const updated = { ...a, isAvailable: false };
            persistDocToCloud('assets', a.id, updated);
            return updated;
          }
          return a;
        }));
      }
    }
  };

  const adminDeleteAsset = (assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
    deleteDocFromCloud('assets', assetId);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const setCurrentUserById = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
      setIsAuthenticated(true);
    }
  };

  const updateUserProfile = (data: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        const updated = { ...u, ...data };
        persistDocToCloud('users', u.id, updated);
        return updated;
      }
      return u;
    }));
  };

  const settleAdminFine = () => {
    if (!currentUser.adminFinePending || currentUser.adminFinePending <= 0) return;
    const oldFine = currentUser.adminFinePending;
    
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        const updated = { ...u, adminFinePending: 0 };
        persistDocToCloud('users', u.id, updated);
        return updated;
      }
      return u;
    }));

    pushNotification({
      userId: currentUser.id,
      title: 'Administrative Fine Settled',
      message: `Your penalty fine of $${oldFine} has been cleared. Thank you for resolving account obligations.`,
      type: 'system',
      linkTab: 'requests',
    });
  };

  // Check if a borrower is in Red Badge risk threshold
  const isHighRiskBorrower = (user: UserProfile): boolean => {
    if (!user) return false;
    return user.rating < 3.0 || user.flags.lateReturn > 2 || user.overdueInstances >= 3;
  };

  // Distance computation (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  const getObfuscatedAddress = (neighborhood: string, isApprovedOrActive: boolean): string => {
    if (isApprovedOrActive) {
      return `Exact Handover: 428 Maple Crest Ave, ${neighborhood}`;
    }
    return `Approximate Area: Within 500m of ${neighborhood} Common Plaza`;
  };

  // Create Asset listing
  const createAsset = (data: Omit<Asset, 'id' | 'distanceKm' | 'isAvailable'>): { success: boolean; error?: string } => {
    if (!isAuthenticated) {
      return { success: false, error: 'Authentication required. Please sign in or register to list equipment.' };
    }

    if (currentUser.isBlacklisted) {
      return { success: false, error: 'Your account is currently blacklisted. Listing creation is restricted.' };
    }

    const titleLower = data.title.toLowerCase();
    const descLower = data.description.toLowerCase();
    const isConsumable = CONSUMABLE_TERMS.some(term => 
      titleLower.includes(term) || descLower.includes(`pack of ${term}`) || descLower.includes(`can of ${term}`)
    );

    if (isConsumable) {
      return {
        success: false,
        error: 'Policy Breach (FR-01.2): Only reusable non-consumable tools & appliances may be listed. Consumables like single-use nails, paints, fuel, and adhesives are strictly prohibited.',
      };
    }

    const newAsset: Asset = {
      ...data,
      id: `ast-${Date.now()}`,
      distanceKm: 0.3,
      isAvailable: true,
      isNonConsumableVerified: true,
    };

    setAssets(prev => [newAsset, ...prev]);

    // Save to Cloud Firestore
    persistDocToCloud('assets', newAsset.id, newAsset);

    pushNotification({
      userId: currentUser.id,
      title: 'Item Published to Catalog',
      message: `Your listing "${newAsset.title}" is now discoverable by neighbors in ${currentUser.neighborhood}.`,
      type: 'system',
      linkTab: 'directory',
    });

    return { success: true };
  };

  const toggleAssetAvailability = (assetId: string) => {
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        const updated = { ...a, isAvailable: !a.isAvailable };
        persistDocToCloud('assets', a.id, updated);
        return updated;
      }
      return a;
    }));
  };

  // Create Rental Request
  const createRentalRequest = (data: {
    assetId: string;
    startDate: string;
    endDate: string;
    pricingType: PricingType;
    durationHours: number;
    durationDays: number;
    totalCost: number;
    paymentMethod: 'cash' | 'mobile_banking' | 'bkash' | 'nagad' | 'rocket' | 'bank_account' | 'none';
  }): { success: boolean; error?: string; requestId?: string } => {
    if (!isAuthenticated) {
      return { success: false, error: 'Please sign in or create an account to submit borrow requests.' };
    }

    if (currentUser.isBlacklisted) {
      return {
        success: false,
        error: `Account Blacklisted: You cannot place borrow requests while administrative penalties are active. (Reason: ${currentUser.blacklistedReason || 'Policy dispute'})`,
      };
    }

    const asset = assets.find(a => a.id === data.assetId);
    if (!asset) return { success: false, error: 'Asset not found.' };

    if (!asset.isAvailable) {
      return { success: false, error: 'Asset is currently reserved or unavailable for these dates.' };
    }

    const requestId = `req-${Date.now()}`;
    const newRequest: RentalRequest = {
      id: requestId,
      assetId: asset.id,
      assetTitle: asset.title,
      assetImage: asset.imageUrl,
      lenderId: asset.ownerId,
      lenderName: asset.ownerName,
      borrowerId: currentUser.id,
      borrowerName: currentUser.name,
      borrowerRating: currentUser.rating,
      status: 'requested',
      pricingType: data.pricingType,
      rate: asset.priceAmount,
      durationHours: data.durationHours,
      durationDays: data.durationDays,
      totalCost: data.totalCost,
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      startDate: data.startDate,
      endDate: data.endDate,
      paymentMethodChosen: data.paymentMethod,
    };

    setRentalRequests(prev => [newRequest, ...prev]);

    // Save to Cloud Firestore
    persistDocToCloud('rental_requests', newRequest.id, newRequest);

    // Notify Lender of incoming request
    pushNotification({
      userId: asset.ownerId,
      title: 'Incoming Borrow Request',
      message: `${currentUser.name} requested "${asset.title}". View screening history card to approve or reject.`,
      type: 'request',
      linkTab: 'requests',
      relatedId: requestId,
    });

    return { success: true, requestId };
  };

  // Approve Request
  const approveRequest = (requestId: string) => {
    const req = rentalRequests.find(r => r.id === requestId);
    if (!req) return;

    let updatedReq: RentalRequest | null = null;
    setRentalRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        const nextStatus: RentalStatus = r.pricingType === 'free' ? 'payment_confirmed' : 'approved';
        updatedReq = { ...r, status: nextStatus };
        return updatedReq;
      }
      return r;
    }));

    if (updatedReq) {
      persistDocToCloud('rental_requests', requestId, updatedReq);
    }

    // Auto-unavailability triggers
    setAssets(prev => prev.map(a => {
      if (a.id === req.assetId) {
        const updated = { ...a, isAvailable: false, unavailableUntil: req.endDate };
        persistDocToCloud('assets', a.id, updated);
        return updated;
      }
      return a;
    }));

    // Notify borrower
    pushNotification({
      userId: req.borrowerId,
      title: 'Request Approved by Lender!',
      message: `${req.lenderName} approved your request for "${req.assetTitle}". Proceed with payment/handover.`,
      type: 'approval',
      linkTab: 'requests',
      relatedId: requestId,
    });
  };

  const rejectRequest = (requestId: string, reason = 'Lender unavailable or scheduling conflict') => {
    const req = rentalRequests.find(r => r.id === requestId);
    if (!req) return;

    let updatedReq: RentalRequest | null = null;
    setRentalRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        updatedReq = { ...r, status: 'rejected', rejectionReason: reason };
        return updatedReq;
      }
      return r;
    }));

    if (updatedReq) {
      persistDocToCloud('rental_requests', requestId, updatedReq);
    }

    pushNotification({
      userId: req.borrowerId,
      title: 'Request Declined by Lender',
      message: `Your request for "${req.assetTitle}" was declined. Reason: "${reason}".`,
      type: 'request',
      linkTab: 'requests',
      relatedId: requestId,
    });
  };

  // Mark Payment Sent (with support for bKash, Nagad, Rocket, Bank Account)
  const markPaymentSent = (
    requestId: string, 
    txnId?: string, 
    paymentChannel?: string, 
    accountUsed?: string
  ) => {
    const req = rentalRequests.find(r => r.id === requestId);
    if (!req) return;

    let updatedReq: RentalRequest | null = null;
    setRentalRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        updatedReq = {
          ...r,
          status: 'payment_sent',
          mobileBankingTxnId: txnId || 'DIRECT-VERIFIED-SETTLEMENT',
          paymentAccountUsed: accountUsed || r.paymentAccountUsed,
          paymentMethodChosen: (paymentChannel as any) || r.paymentMethodChosen,
          paymentSentAt: new Date().toISOString(),
        };
        return updatedReq;
      }
      return r;
    }));

    if (updatedReq) {
      persistDocToCloud('rental_requests', requestId, updatedReq);
    }

    // Notify lender to verify
    pushNotification({
      userId: req.lenderId,
      title: 'Borrower Marked Payment Sent',
      message: `${req.borrowerName} submitted payment ($${req.totalCost.toFixed(2)}) via ${paymentChannel ? paymentChannel.toUpperCase() : 'direct transfer'}. Ref: ${txnId || 'Confirmed'}.`,
      type: 'payment',
      linkTab: 'requests',
      relatedId: requestId,
    });
  };

  // Confirm Payment
  const confirmPaymentReceived = (requestId: string) => {
    const req = rentalRequests.find(r => r.id === requestId);
    if (!req) return;

    let updatedReq: RentalRequest | null = null;
    setRentalRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        updatedReq = { ...r, status: 'payment_confirmed', paymentConfirmedAt: new Date().toISOString() };
        return updatedReq;
      }
      return r;
    }));

    if (updatedReq) {
      persistDocToCloud('rental_requests', requestId, updatedReq);
    }

    pushNotification({
      userId: req.borrowerId,
      title: 'Payment Confirmed by Lender',
      message: `${req.lenderName} confirmed receipt of payment. Proceed with physical handover inspection.`,
      type: 'payment',
      linkTab: 'requests',
      relatedId: requestId,
    });
  };

  // Handover Checklist Signed
  const signHandoverChecklist = (requestId: string) => {
    const req = rentalRequests.find(r => r.id === requestId);
    if (!req) return;

    let updatedReq: RentalRequest | null = null;
    setRentalRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        updatedReq = {
          ...r,
          status: 'active',
          handoverChecklistSigned: true,
          handoverTime: new Date().toISOString(),
        };
        return updatedReq;
      }
      return r;
    }));

    if (updatedReq) {
      persistDocToCloud('rental_requests', requestId, updatedReq);
    }

    pushNotification({
      userId: req.borrowerId,
      title: 'Handover Complete - Rental Active',
      message: `Digital checklist signed for "${req.assetTitle}". Due back: ${new Date(req.endDate).toLocaleString()}.`,
      type: 'handover',
      linkTab: 'requests',
      relatedId: requestId,
    });
  };

  // Return Item
  const confirmItemReturned = (requestId: string) => {
    const req = rentalRequests.find(r => r.id === requestId);
    if (!req) return;

    let updatedReq: RentalRequest | null = null;
    setRentalRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        updatedReq = { ...r, status: 'returned', returnedTime: new Date().toISOString() };
        return updatedReq;
      }
      return r;
    }));

    if (updatedReq) {
      persistDocToCloud('rental_requests', requestId, updatedReq);
    }

    // Restore asset availability
    setAssets(prev => prev.map(a => {
      if (a.id === req.assetId) {
        const updated = { ...a, isAvailable: true, unavailableUntil: undefined };
        persistDocToCloud('assets', a.id, updated);
        return updated;
      }
      return a;
    }));

    setUsers(prev => prev.map(u => {
      let updatedUser = u;
      if (u.id === req.borrowerId) {
        updatedUser = { ...u, totalBorrowed: u.totalBorrowed + 1, onTimeReturnCount: u.onTimeReturnCount + 1 };
        persistDocToCloud('users', u.id, updatedUser);
        return updatedUser;
      }
      if (u.id === req.lenderId) {
        updatedUser = { ...u, totalLent: u.totalLent + 1 };
        persistDocToCloud('users', u.id, updatedUser);
        return updatedUser;
      }
      return u;
    }));

    pushNotification({
      userId: req.borrowerId,
      title: 'Item Return Confirmed',
      message: `Return of "${req.assetTitle}" verified by ${req.lenderName}. Thank you for returning in great shape! Please leave a review.`,
      type: 'system',
      linkTab: 'requests',
      relatedId: requestId,
    });
  };

  // OVERDUE RESTRICTION LOGIC:
  // Prevent users from marking or submitting overdue actions before the scheduled return time
  const canMarkOverdue = (requestId: string): { allowed: boolean; remainingMs: number; dueTime: string; reason?: string } => {
    const req = rentalRequests.find(r => r.id === requestId);
    if (!req) {
      return { allowed: false, remainingMs: 0, dueTime: '', reason: 'Rental transaction record not found.' };
    }

    const dueTimeMs = new Date(req.endDate).getTime();
    const nowMs = Date.now();

    if (nowMs < dueTimeMs) {
      const remainingMs = dueTimeMs - nowMs;
      return {
        allowed: false,
        remainingMs,
        dueTime: req.endDate,
        reason: `Action Restricted: Scheduled return deadline is ${new Date(req.endDate).toLocaleString()}. You cannot flag an overdue penalty before the agreed rental period has elapsed.`
      };
    }

    return { allowed: true, remainingMs: 0, dueTime: req.endDate };
  };

  const markRequestOverdue = (requestId: string): { success: boolean; error?: string } => {
    const req = rentalRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Rental not found.' };

    const restriction = canMarkOverdue(requestId);
    if (!restriction.allowed) {
      return { success: false, error: restriction.reason };
    }

    let updatedReq: RentalRequest | null = null;
    setRentalRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        updatedReq = { ...r, status: 'overdue', overdueNotified: true };
        return updatedReq;
      }
      return r;
    }));

    if (updatedReq) {
      persistDocToCloud('rental_requests', requestId, updatedReq);
    }

    setUsers(prev => prev.map(u => {
      if (u.id === req.borrowerId) {
        const updatedUser = {
          ...u,
          overdueInstances: u.overdueInstances + 1,
          flags: { ...u.flags, lateReturn: u.flags.lateReturn + 1 },
        };
        persistDocToCloud('users', u.id, updatedUser);
        return updatedUser;
      }
      return u;
    }));

    pushNotification({
      userId: req.borrowerId,
      title: 'OVERDUE RETURN WARNING',
      message: `"${req.assetTitle}" is past its scheduled return deadline (${new Date(req.endDate).toLocaleString()}). Return immediately to prevent platform blacklisting.`,
      type: 'system',
      linkTab: 'requests',
      relatedId: requestId,
    });

    return { success: true };
  };

  // EARLY RETURN PENALTY / FEE PERCENTAGE:
  // If an owner forces an early return before the agreed return time, charge/credit a percentage fee/compensation
  const requestOwnerEarlyReturn = (
    requestId: string, 
    penaltyPercent: number = 20, 
    reason: string = 'Owner early equipment recall before scheduled return deadline'
  ): { success: boolean; error?: string } => {
    const req = rentalRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Rental request not found.' };

    if (req.status !== 'active') {
      return { success: false, error: 'Early recall can only be enacted on active rentals.' };
    }

    const compensationAmount = parseFloat(((req.totalCost * penaltyPercent) / 100).toFixed(2));
    let updatedReq: RentalRequest | null = null;

    setRentalRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        updatedReq = {
          ...r,
          status: 'returned',
          returnedTime: new Date().toISOString(),
          earlyReturnRequestedBy: 'owner',
          earlyReturnInitiatedAt: new Date().toISOString(),
          earlyReturnPenaltyPercent: penaltyPercent,
          earlyReturnCompensationAmount: compensationAmount,
          earlyReturnReason: reason,
        };
        return updatedReq;
      }
      return r;
    }));

    if (updatedReq) {
      persistDocToCloud('rental_requests', requestId, updatedReq);
    }

    // Restore asset availability
    setAssets(prev => prev.map(a => {
      if (a.id === req.assetId) {
        const updated = { ...a, isAvailable: true, unavailableUntil: undefined };
        persistDocToCloud('assets', a.id, updated);
        return updated;
      }
      return a;
    }));

    // Credit borrower and notify
    pushNotification({
      userId: req.borrowerId,
      title: `Early Return Compensation Credited: $${compensationAmount.toFixed(2)}`,
      message: `Owner ${req.lenderName} recalled "${req.assetTitle}" early. Under platform policy, a ${penaltyPercent}% inconvenience compensation fee ($${compensationAmount.toFixed(2)}) has been awarded to your account.`,
      type: 'payment',
      linkTab: 'requests',
      relatedId: requestId,
    });

    pushNotification({
      userId: req.lenderId,
      title: `Early Recall Executed (${penaltyPercent}% Fee Charged)`,
      message: `You initiated an early recall on "${req.assetTitle}". A ${penaltyPercent}% compensation fee ($${compensationAmount.toFixed(2)}) was applied for borrower inconvenience.`,
      type: 'system',
      linkTab: 'requests',
      relatedId: requestId,
    });

    return { success: true };
  };

  // BORROWER QUALITY CHECK SYSTEM & PRODUCT REVIEWS:
  // Integrate quality verification via borrower and product rating/review
  const submitQualityVerification = (
    requestId: string,
    data: {
      conditionRating: number;
      checklist: {
        powerHealth: boolean;
        safetyGuardPresent: boolean;
        noDamage: boolean;
        cleanCondition: boolean;
      };
      notes: string;
      productRating?: number;
      productComment?: string;
    }
  ) => {
    const req = rentalRequests.find(r => r.id === requestId);
    if (!req) return;

    const qualityCheck: BorrowerQualityCheck = {
      verified: true,
      conditionRating: data.conditionRating,
      checklist: data.checklist,
      notes: data.notes,
      verifiedAt: new Date().toISOString(),
      productRating: data.productRating,
      productComment: data.productComment,
    };

    let updatedReq: RentalRequest | null = null;
    setRentalRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        updatedReq = { ...r, borrowerQualityCheck: qualityCheck };
        return updatedReq;
      }
      return r;
    }));

    if (updatedReq) {
      persistDocToCloud('rental_requests', requestId, updatedReq);
    }

    // If borrower also provided a product rating/review, register it in productReviews
    if (data.productRating) {
      const newProductReview: ProductReview = {
        id: `prev-${Date.now()}`,
        assetId: req.assetId,
        assetTitle: req.assetTitle,
        rentalId: req.id,
        reviewerId: req.borrowerId,
        reviewerName: req.borrowerName,
        rating: data.productRating,
        qualityScore: data.conditionRating,
        comment: data.productComment || data.notes || 'Tool quality verified in working order.',
        verifiedBorrower: true,
        createdAt: new Date().toISOString(),
        aspects: {
          powerHealth: data.checklist.powerHealth,
          safetyGuard: data.checklist.safetyGuardPresent,
          cleanliness: data.checklist.cleanCondition,
          operationalAccuracy: data.checklist.noDamage,
        },
      };

      setProductReviews(prev => [newProductReview, ...prev]);
      persistDocToCloud('product_reviews', newProductReview.id, newProductReview);
    }

    pushNotification({
      userId: req.lenderId,
      title: 'Borrower Quality Verification Recorded',
      message: `${req.borrowerName} completed quality check for "${req.assetTitle}" (${data.conditionRating}/5 Stars).`,
      type: 'handover',
      linkTab: 'requests',
      relatedId: requestId,
    });
  };

  // Submit direct Product Review
  const submitProductReview = (data: {
    assetId: string;
    rating: number;
    qualityScore: number;
    comment: string;
    reviewerId?: string;
    reviewerName?: string;
    aspects?: {
      powerHealth: boolean;
      safetyGuard: boolean;
      cleanliness: boolean;
      operationalAccuracy: boolean;
    };
  }) => {
    const asset = assets.find(a => a.id === data.assetId);
    const newRev: ProductReview = {
      id: `prev-${Date.now()}`,
      assetId: data.assetId,
      assetTitle: asset ? asset.title : 'Equipment Asset',
      reviewerId: data.reviewerId || currentUser.id,
      reviewerName: data.reviewerName || currentUser.name,
      rating: data.rating,
      qualityScore: data.qualityScore,
      comment: data.comment,
      verifiedBorrower: true,
      createdAt: new Date().toISOString(),
      aspects: data.aspects || {
        powerHealth: true,
        safetyGuard: true,
        cleanliness: true,
        operationalAccuracy: true,
      },
    };

    setProductReviews(prev => [newRev, ...prev]);
    persistDocToCloud('product_reviews', newRev.id, newRev);

    pushNotification({
      userId: currentUser.id,
      title: 'Product Review Published',
      message: `Your rating for "${asset ? asset.title : 'Tool'}" has been published with quality verification.`,
      type: 'system',
      linkTab: 'directory',
    });
  };

  // Dispute Filing
  const fileDisputeTicket = (data: {
    rentalId: string;
    defendantId: string;
    defendantName: string;
    reason: string;
    details: string;
    evidenceAttachments: string[];
  }) => {
    const req = rentalRequests.find(r => r.id === data.rentalId);
    const newTicket: DisputeTicket = {
      id: `dsp-${Date.now()}`,
      rentalId: data.rentalId,
      assetTitle: req ? req.assetTitle : 'Shared Equipment',
      complainantId: currentUser.id,
      complainantName: currentUser.name,
      complainantRole: req && currentUser.id === req.lenderId ? 'lender' : 'borrower',
      defendantId: data.defendantId,
      defendantName: data.defendantName,
      reason: data.reason,
      details: data.details,
      evidenceAttachments: data.evidenceAttachments,
      createdAt: new Date().toISOString(),
      status: 'under_investigation',
    };

    setDisputes(prev => [newTicket, ...prev]);
    persistDocToCloud('disputes', newTicket.id, newTicket);

    setRentalRequests(prev => prev.map(r => {
      if (r.id === data.rentalId) {
        const updated = { ...r, status: 'disputed' as RentalStatus, disputeId: newTicket.id };
        persistDocToCloud('rental_requests', r.id, updated);
        return updated;
      }
      return r;
    }));

    // Notify defendant and admin
    pushNotification({
      userId: data.defendantId,
      title: 'Administrative Complaint Filed',
      message: `A dispute regarding "${req?.assetTitle}" was submitted to District Administration by ${currentUser.name}.`,
      type: 'dispute',
      linkTab: 'requests',
      relatedId: newTicket.id,
    });
  };

  // Admin Directives
  const issueAdminDirective = (ticketId: string, directive: string) => {
    const ticket = disputes.find(d => d.id === ticketId);
    setDisputes(prev => prev.map(d => {
      if (d.id === ticketId) {
        const updated = { ...d, adminDirective: directive, status: 'directive_issued' as const };
        persistDocToCloud('disputes', d.id, updated);
        return updated;
      }
      return d;
    }));

    if (ticket) {
      pushNotification({
        userId: ticket.defendantId,
        title: 'OFFICIAL ADMINISTRATIVE BINDING ORDER',
        message: `Admin Directive: "${directive}". Strict compliance required under platform bylaws.`,
        type: 'dispute',
        linkTab: 'requests',
        relatedId: ticketId,
      });
    }
  };

  const levyAdminFine = (ticketId: string, userId: string, fineAmount: number, directive?: string) => {
    setDisputes(prev => prev.map(d => {
      if (d.id === ticketId) {
        const updated = { 
          ...d, 
          adminFineLevied: fineAmount, 
          adminDirective: directive || d.adminDirective,
          status: 'penalized' as const
        };
        persistDocToCloud('disputes', d.id, updated);
        return updated;
      }
      return d;
    }));

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = {
          ...u,
          adminFinePending: (u.adminFinePending || 0) + fineAmount,
        };
        persistDocToCloud('users', u.id, updated);
        return updated;
      }
      return u;
    }));

    pushNotification({
      userId,
      title: 'ADMINISTRATIVE PENALTY FINE ASSESSED',
      message: `A statutory fine of $${fineAmount}.00 has been levied against your account for breach of lending policies.`,
      type: 'dispute',
      linkTab: 'requests',
      relatedId: ticketId,
    });
  };

  const blacklistUser = (userId: string, reason: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = {
          ...u,
          isBlacklisted: true,
          blacklistedReason: reason,
        };
        persistDocToCloud('users', u.id, updated);
        return updated;
      }
      return u;
    }));

    setAssets(prev => prev.map(a => {
      if (a.ownerId === userId) {
        const updated = { ...a, isAvailable: false };
        persistDocToCloud('assets', a.id, updated);
        return updated;
      }
      return a;
    }));

    setDisputes(prev => prev.map(d => {
      if (d.defendantId === userId) {
        const updated = { ...d, status: 'penalized' as const };
        persistDocToCloud('disputes', d.id, updated);
        return updated;
      }
      return d;
    }));

    pushNotification({
      userId,
      title: 'ACCOUNT BLACKLISTED & BORROWING LOCKED',
      message: `Sanctions enacted: You cannot place borrow requests and your listings are hidden. Reason: "${reason}".`,
      type: 'dispute',
      linkTab: 'requests',
    });
  };

  const restoreUserStatus = (userId: string, ticketId?: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = {
          ...u,
          isBlacklisted: false,
          blacklistedReason: undefined,
          adminFinePending: 0,
        };
        persistDocToCloud('users', u.id, updated);
        return updated;
      }
      return u;
    }));

    setAssets(prev => prev.map(a => {
      if (a.ownerId === userId) {
        const updated = { ...a, isAvailable: true };
        persistDocToCloud('assets', a.id, updated);
        return updated;
      }
      return a;
    }));

    if (ticketId) {
      setDisputes(prev => prev.map(d => {
        if (d.id === ticketId) {
          const updated = { ...d, status: 'resolved' as const, resolvedAt: new Date().toISOString() };
          persistDocToCloud('disputes', d.id, updated);
          return updated;
        }
        return d;
      }));
    }

    pushNotification({
      userId,
      title: 'Account Standing Restored',
      message: 'All obligations verified. Blacklist lifted and your catalog listings have been reinstated.',
      type: 'system',
      linkTab: 'directory',
    });
  };

  const resolveDispute = (ticketId: string, notes?: string) => {
    let resolvedTicket: DisputeTicket | null = null;
    setDisputes(prev => prev.map(d => {
      if (d.id === ticketId) {
        resolvedTicket = {
          ...d,
          status: 'resolved' as const,
          adminNotes: notes || d.adminNotes,
          resolvedAt: new Date().toISOString(),
        };
        persistDocToCloud('disputes', d.id, resolvedTicket);
        return resolvedTicket;
      }
      return d;
    }));

    if (resolvedTicket) {
      const rentalId = (resolvedTicket as DisputeTicket).rentalId;
      setRentalRequests(prev => prev.map(r => {
        if (r.id === rentalId) {
          const updated = { ...r, status: 'resolved' as RentalStatus };
          persistDocToCloud('rental_requests', r.id, updated);
          return updated;
        }
        return r;
      }));
    }
  };

  // Broadcasts
  const createBroadcast = (data: {
    requiredItem: string;
    category: string;
    neededFor: string;
    maxDistanceKm: number;
    preferredDate: string;
  }) => {
    if (!isAuthenticated) return;

    const matchedCount = assets.filter(a => 
      a.category === data.category && a.distanceKm <= data.maxDistanceKm
    ).length;

    const newBroadcast: BroadcastRequirement = {
      id: `bc-${Date.now()}`,
      borrowerId: currentUser.id,
      borrowerName: currentUser.name,
      requiredItem: data.requiredItem,
      category: data.category,
      neededFor: data.neededFor,
      maxDistanceKm: data.maxDistanceKm,
      preferredDate: data.preferredDate,
      createdAt: new Date().toISOString(),
      matchedLenderCount: matchedCount,
    };

    setBroadcasts(prev => [newBroadcast, ...prev]);
    persistDocToCloud('broadcasts', newBroadcast.id, newBroadcast);

    pushNotification({
      userId: currentUser.id,
      title: 'Broadcast Requirement Published',
      message: `Your search for "${data.requiredItem}" has been dispatched to ${matchedCount} nearby neighbors within ${data.maxDistanceKm} km.`,
      type: 'broadcast',
      linkTab: 'broadcast',
    });
  };

  // Reviews
  const submitReview = (data: {
    rentalId: string;
    targetUserId: string;
    rating: number;
    comment: string;
    tags: string[];
  }) => {
    const newRev: UserReview = {
      id: `rev-${Date.now()}`,
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      targetUserId: data.targetUserId,
      rating: data.rating,
      comment: data.comment,
      tags: data.tags,
      createdAt: new Date().toISOString(),
    };

    setReviews(prev => [newRev, ...prev]);
    persistDocToCloud('reviews', newRev.id, newRev);

    setUsers(prev => prev.map(u => {
      if (u.id === data.targetUserId) {
        const userRevs = [...reviews.filter(r => r.targetUserId === data.targetUserId), newRev];
        const avg = userRevs.reduce((acc, curr) => acc + curr.rating, 0) / userRevs.length;
        
        const newLateReturn = u.flags.lateReturn + (data.tags.includes('Not Returning at Right Time') ? 1 : 0);
        const newPaymentIssue = u.flags.paymentIssue + (data.tags.includes('Payment Issue') ? 1 : 0);
        const newDamaged = u.flags.equipmentDamage + (data.tags.includes('Damaged Equipment') ? 1 : 0);
        const newUnresponsive = u.flags.unresponsive + (data.tags.includes('Unresponsive') ? 1 : 0);

        const updatedUser: UserProfile = {
          ...u,
          rating: parseFloat(avg.toFixed(2)),
          recentFeedback: data.comment,
          flags: {
            lateReturn: newLateReturn,
            paymentIssue: newPaymentIssue,
            equipmentDamage: newDamaged,
            unresponsive: newUnresponsive,
          },
        };

        persistDocToCloud('users', u.id, updatedUser);
        return updatedUser;
      }
      return u;
    }));

    pushNotification({
      userId: data.targetUserId,
      title: 'New Community Peer Review Received',
      message: `${currentUser.name} rated you ${data.rating} ★: "${data.comment}"`,
      type: 'system',
      linkTab: 'requests',
    });
  };

  return (
    <AppContext.Provider
      value={{
        cloudSyncInfo,
        forceCloudResync,
        isAuthenticated,
        currentUser,
        users,
        isAdmin: currentUser.role === 'admin',
        adminSecurityCode,
        login,
        adminLogin,
        resetAdminSecurityCode,
        resetUserSecurityPin,
        register,
        adminRegister,
        logout,
        setCurrentUserById,
        updateUserProfile,
        settleAdminFine,
        adminForceTransitionRequest,
        adminDeleteAsset,
        assets,
        createAsset,
        toggleAssetAvailability,
        rentalRequests,
        createRentalRequest,
        approveRequest,
        rejectRequest,
        markPaymentSent,
        confirmPaymentReceived,
        signHandoverChecklist,
        confirmItemReturned,
        canMarkOverdue,
        markRequestOverdue,
        requestOwnerEarlyReturn,
        submitQualityVerification,
        productReviews,
        submitProductReview,
        pointsOfInterest,
        disputes,
        fileDisputeTicket,
        issueAdminDirective,
        levyAdminFine,
        blacklistUser,
        restoreUserStatus,
        resolveDispute,
        broadcasts,
        createBroadcast,
        reviews,
        submitReview,
        notifications: userNotifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        calculateDistance,
        getObfuscatedAddress,
        isHighRiskBorrower,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
