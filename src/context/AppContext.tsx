import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Asset, 
  UserProfile, 
  RentalRequest, 
  DisputeTicket, 
  BroadcastRequirement, 
  UserReview, 
  RentalStatus,
  PricingType,
  AppNotification
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_ASSETS, 
  INITIAL_REQUESTS, 
  INITIAL_DISPUTES, 
  INITIAL_BROADCASTS,
  INITIAL_NOTIFICATIONS
} from '../data/mockData';

interface AppContextType {
  // Auth state
  isAuthenticated: boolean;
  currentUser: UserProfile;
  users: UserProfile[];
  isAdmin: boolean;
  login: (email: string, password?: string) => { success: boolean; error?: string };
  adminLogin: (email: string, password: string, securityCode: string) => { success: boolean; error?: string };
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    neighborhood: string;
    role?: 'user';
    mobileBankingProvider?: string;
    mobileBankingHandle?: string;
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
    paymentMethod: 'cash' | 'mobile_banking' | 'none';
  }) => { success: boolean; error?: string; requestId?: string };
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string, reason?: string) => void;
  markPaymentSent: (requestId: string, txnId?: string) => void;
  confirmPaymentReceived: (requestId: string) => void;
  signHandoverChecklist: (requestId: string) => void;
  confirmItemReturned: (requestId: string) => void;
  markRequestOverdue: (requestId: string) => void;

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

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('neighborhood_tools_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Sync to local storage
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
    localStorage.setItem('neighborhood_tools_notifications', JSON.stringify(notifications));
  }, [notifications]);

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
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => n.userId === currentUser.id ? { ...n, read: true } : n));
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

  // Hidden Admin Login (requires Security Code 2580)
  const adminLogin = (email: string, password: string, securityCode: string): { success: boolean; error?: string } => {
    if (securityCode.trim() !== '2580') {
      return { success: false, error: 'Access Denied: Invalid Administrative Security Code.' };
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

  // Auth: Standard Resident Registration (Every user can both lend and borrow)
  const register = (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    neighborhood: string;
    role?: 'user';
    mobileBankingProvider?: string;
    mobileBankingHandle?: string;
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
      phone: data.phone.trim(),
      role: 'user', // standard user can both lend and borrow!
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
        mobileBankingProvider: data.mobileBankingProvider || 'Zelle',
        mobileBankingHandle: data.mobileBankingHandle || data.email,
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

    pushNotification({
      userId: newUser.id,
      title: 'Welcome to Neighborhood Tool Directory!',
      message: `Your community resident profile is active in ${data.neighborhood}. You can now borrow tools or list your own equipment for rent!`,
      type: 'system',
      linkTab: 'directory',
    });

    return { success: true };
  };

  // Hidden Admin Registration (requires Security Code 2580)
  const adminRegister = (data: {
    name: string;
    email: string;
    password: string;
    securityCode: string;
  }): { success: boolean; error?: string } => {
    if (data.securityCode.trim() !== '2580') {
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
    return { success: true };
  };

  // Admin Direct Process Intervention
  const adminForceTransitionRequest = (requestId: string, newStatus: RentalStatus, note?: string) => {
    setRentalRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: newStatus,
          rejectionReason: note ? `Admin Directive: ${note}` : r.rejectionReason,
        };
      }
      return r;
    }));

    if (['returned', 'resolved', 'rejected', 'expired'].includes(newStatus)) {
      const req = rentalRequests.find(r => r.id === requestId);
      if (req) {
        setAssets(prev => prev.map(a => a.id === req.assetId ? { ...a, isAvailable: true, unavailableUntil: undefined } : a));
      }
    } else if (['approved', 'active', 'payment_confirmed'].includes(newStatus)) {
      const req = rentalRequests.find(r => r.id === requestId);
      if (req) {
        setAssets(prev => prev.map(a => a.id === req.assetId ? { ...a, isAvailable: false } : a));
      }
    }
  };

  const adminDeleteAsset = (assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
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
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...data } : u));
  };

  const settleAdminFine = () => {
    if (!currentUser.adminFinePending || currentUser.adminFinePending <= 0) return;
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, adminFinePending: 0 } : u));
    pushNotification({
      userId: currentUser.id,
      title: 'Administrative Fine Settled',
      message: 'Your penalty fine of $' + currentUser.adminFinePending + ' has been cleared. Thank you for resolving account obligations.',
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
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, isAvailable: !a.isAvailable } : a));
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
    paymentMethod: 'cash' | 'mobile_banking' | 'none';
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

    setRentalRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        const nextStatus: RentalStatus = r.pricingType === 'free' ? 'payment_confirmed' : 'approved';
        return { ...r, status: nextStatus };
      }
      return r;
    }));

    // Auto-unavailability triggers
    setAssets(prev => prev.map(a => a.id === req.assetId ? { ...a, isAvailable: false, unavailableUntil: req.endDate } : a));

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

    setRentalRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected', rejectionReason: reason } : r));

    pushNotification({
      userId: req.borrowerId,
      title: 'Request Declined by Lender',
      message: `Your request for "${req.assetTitle}" was declined. Reason: "${reason}".`,
      type: 'request',
      linkTab: 'requests',
      relatedId: requestId,
    });
  };

  // Mark Payment Sent
  const markPaymentSent = (requestId: string, txnId?: string) => {
    const req = rentalRequests.find(r => r.id === requestId);
    if (!req) return;

    setRentalRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'payment_sent',
          mobileBankingTxnId: txnId || 'CASH-CONFIRMED-AT-PICKUP',
          paymentSentAt: new Date().toISOString(),
        };
      }
      return r;
    }));

    // Notify lender to verify
    pushNotification({
      userId: req.lenderId,
      title: 'Borrower Marked Payment Sent',
      message: `${req.borrowerName} sent payment ($${req.totalCost.toFixed(2)}). Please check your account/cash and confirm.`,
      type: 'payment',
      linkTab: 'requests',
      relatedId: requestId,
    });
  };

  // Confirm Payment
  const confirmPaymentReceived = (requestId: string) => {
    const req = rentalRequests.find(r => r.id === requestId);
    if (!req) return;

    setRentalRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'payment_confirmed', paymentConfirmedAt: new Date().toISOString() } : r));

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

    setRentalRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      status: 'active',
      handoverChecklistSigned: true,
      handoverTime: new Date().toISOString(),
    } : r));

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

    setRentalRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'returned', returnedTime: new Date().toISOString() } : r));

    // Restore asset availability
    setAssets(prev => prev.map(a => a.id === req.assetId ? { ...a, isAvailable: true, unavailableUntil: undefined } : a));

    setUsers(prev => prev.map(u => {
      if (u.id === req.borrowerId) {
        return { ...u, totalBorrowed: u.totalBorrowed + 1, onTimeReturnCount: u.onTimeReturnCount + 1 };
      }
      if (u.id === req.lenderId) {
        return { ...u, totalLent: u.totalLent + 1 };
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

  const markRequestOverdue = (requestId: string) => {
    const req = rentalRequests.find(r => r.id === requestId);
    if (!req) return;

    setRentalRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'overdue', overdueNotified: true } : r));

    setUsers(prev => prev.map(u => {
      if (u.id === req.borrowerId) {
        return {
          ...u,
          overdueInstances: u.overdueInstances + 1,
          flags: { ...u.flags, lateReturn: u.flags.lateReturn + 1 },
        };
      }
      return u;
    }));

    pushNotification({
      userId: req.borrowerId,
      title: 'OVERDUE RETURN WARNING',
      message: `"${req.assetTitle}" is past its return deadline. Return immediately to prevent administrative sanctions and blacklisting.`,
      type: 'system',
      linkTab: 'requests',
      relatedId: requestId,
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
    setRentalRequests(prev => prev.map(r => r.id === data.rentalId ? { ...r, status: 'disputed', disputeId: newTicket.id } : r));

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
    setDisputes(prev => prev.map(d => d.id === ticketId ? { ...d, adminDirective: directive, status: 'directive_issued' } : d));

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
    setDisputes(prev => prev.map(d => d.id === ticketId ? { 
      ...d, 
      adminFineLevied: fineAmount, 
      adminDirective: directive || d.adminDirective,
      status: 'penalized' 
    } : d));

    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      adminFinePending: (u.adminFinePending || 0) + fineAmount,
    } : u));

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
    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      isBlacklisted: true,
      blacklistedReason: reason,
    } : u));

    setAssets(prev => prev.map(a => a.ownerId === userId ? { ...a, isAvailable: false } : a));
    setDisputes(prev => prev.map(d => d.defendantId === userId ? { ...d, status: 'penalized' } : d));

    pushNotification({
      userId,
      title: 'ACCOUNT BLACKLISTED & BORROWING LOCKED',
      message: `Sanctions enacted: You cannot place borrow requests and your listings are hidden. Reason: "${reason}".`,
      type: 'dispute',
      linkTab: 'requests',
    });
  };

  const restoreUserStatus = (userId: string, ticketId?: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      isBlacklisted: false,
      blacklistedReason: undefined,
      adminFinePending: 0,
    } : u));

    setAssets(prev => prev.map(a => a.ownerId === userId ? { ...a, isAvailable: true } : a));

    if (ticketId) {
      setDisputes(prev => prev.map(d => d.id === ticketId ? { ...d, status: 'resolved', resolvedAt: new Date().toISOString() } : d));
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
    setDisputes(prev => prev.map(d => d.id === ticketId ? {
      ...d,
      status: 'resolved',
      adminNotes: notes || d.adminNotes,
      resolvedAt: new Date().toISOString(),
    } : d));

    const ticket = disputes.find(d => d.id === ticketId);
    if (ticket) {
      setRentalRequests(prev => prev.map(r => r.id === ticket.rentalId ? { ...r, status: 'resolved' } : r));
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

    setUsers(prev => prev.map(u => {
      if (u.id === data.targetUserId) {
        const userRevs = [...reviews.filter(r => r.targetUserId === data.targetUserId), newRev];
        const avg = userRevs.reduce((acc, curr) => acc + curr.rating, 0) / userRevs.length;
        
        const newLateReturn = u.flags.lateReturn + (data.tags.includes('Not Returning at Right Time') ? 1 : 0);
        const newPaymentIssue = u.flags.paymentIssue + (data.tags.includes('Payment Issue') ? 1 : 0);
        const newDamaged = u.flags.equipmentDamage + (data.tags.includes('Damaged Equipment') ? 1 : 0);
        const newUnresponsive = u.flags.unresponsive + (data.tags.includes('Unresponsive') ? 1 : 0);

        return {
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
        isAuthenticated,
        currentUser,
        users,
        isAdmin: currentUser.role === 'admin',
        login,
        adminLogin,
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
        markRequestOverdue,
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
