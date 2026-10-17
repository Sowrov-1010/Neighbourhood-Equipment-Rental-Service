import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RentalRequest, Asset } from '../types';
import { BorrowerHistoryCard } from './BorrowerHistoryCard';
import { RentalFSMTracker } from './RentalFSMTracker';
import { 
  Clock, 
  CreditCard, 
  FileCheck, 
  AlertTriangle, 
  RotateCcw, 
  Star, 
  CheckCircle, 
  Eye, 
  Calendar, 
  XCircle, 
  ShieldAlert,
  Lock,
  Sparkles,
  HelpCircle,
  X,
  Sliders,
  DollarSign,
  ShieldCheck,
  Check
} from 'lucide-react';

interface RentalTrackViewProps {
  onOpenPaymentModal: (req: RentalRequest) => void;
  onOpenHandoverModal: (req: RentalRequest) => void;
  onOpenDisputeModal: (req: RentalRequest) => void;
  onOpenReviewModal: (req: RentalRequest) => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const RentalTrackView: React.FC<RentalTrackViewProps> = ({
  onOpenPaymentModal,
  onOpenHandoverModal,
  onOpenDisputeModal,
  onOpenReviewModal,
  onOpenAuth,
}) => {
  const { 
    rentalRequests, 
    currentUser, 
    users, 
    assets,
    approveRequest, 
    rejectRequest, 
    confirmItemReturned,
    canMarkOverdue,
    markRequestOverdue,
    requestOwnerEarlyReturn,
    submitQualityVerification,
    reviews,
    isAuthenticated
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'incoming' | 'outgoing' | 'active' | 'completed'>('all');
  
  // Modals state for new features
  const [earlyReturnModalReq, setEarlyReturnModalReq] = useState<RentalRequest | null>(null);
  const [earlyPenaltyPct, setEarlyPenaltyPct] = useState<number>(20);
  const [earlyReason, setEarlyReason] = useState<string>('Owner emergency tool requirement');
  
  const [qualityModalReq, setQualityModalReq] = useState<RentalRequest | null>(null);
  const [conditionScore, setConditionScore] = useState<number>(5);
  const [qualityChecklist, setQualityChecklist] = useState({
    powerHealth: true,
    safetyGuardPresent: true,
    noDamage: true,
    cleanCondition: true,
  });
  const [qualityNotes, setQualityNotes] = useState<string>('');
  const [prodRating, setProdRating] = useState<number>(5);
  const [prodComment, setProdComment] = useState<string>('');

  // Overdue restriction alert
  const [overdueAlert, setOverdueAlert] = useState<{ message: string; reqTitle: string; dueTime: string } | null>(null);

  // STRICT ACCOUNT ISOLATION
  const myAccountRequests = isAuthenticated
    ? rentalRequests.filter(req => req.lenderId === currentUser.id || req.borrowerId === currentUser.id)
    : [];

  const filteredRequests = myAccountRequests.filter(req => {
    if (activeFilter === 'incoming') return req.lenderId === currentUser.id;
    if (activeFilter === 'outgoing') return req.borrowerId === currentUser.id;
    if (activeFilter === 'active') return req.status === 'active' || req.status === 'payment_confirmed';
    if (activeFilter === 'completed') return req.status === 'returned' || req.status === 'resolved';
    return true;
  });

  const incomingCount = myAccountRequests.filter(r => r.lenderId === currentUser.id).length;
  const outgoingCount = myAccountRequests.filter(r => r.borrowerId === currentUser.id).length;
  const activeCount = myAccountRequests.filter(r => r.status === 'active' || r.status === 'payment_confirmed').length;
  const completedCount = myAccountRequests.filter(r => r.status === 'returned' || r.status === 'resolved').length;

  const formatRemainingTime = (endDateStr: string) => {
    const diffMs = new Date(endDateStr).getTime() - Date.now();
    if (diffMs <= 0) return 'Deadline Elapsed';
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hrs > 24) {
      const days = Math.floor(hrs / 24);
      return `${days}d ${hrs % 24}h remaining`;
    }
    return `${hrs}h ${mins}m remaining`;
  };

  const handleAttemptOverdue = (req: RentalRequest) => {
    const check = canMarkOverdue(req.id);
    if (!check.allowed) {
      setOverdueAlert({
        message: check.reason || 'Action Restricted: You cannot mark an item overdue before the scheduled return time has arrived.',
        reqTitle: req.assetTitle,
        dueTime: new Date(req.endDate).toLocaleString(),
      });
      return;
    }
    markRequestOverdue(req.id);
  };

  const handleConfirmEarlyReturn = () => {
    if (!earlyReturnModalReq) return;
    requestOwnerEarlyReturn(earlyReturnModalReq.id, earlyPenaltyPct, earlyReason);
    setEarlyReturnModalReq(null);
  };

  const handleSubmitQualityCheck = () => {
    if (!qualityModalReq) return;
    submitQualityVerification(qualityModalReq.id, {
      conditionRating: conditionScore,
      checklist: qualityChecklist,
      notes: qualityNotes || 'Checked during rental period.',
      productRating: prodRating,
      productComment: prodComment,
    });
    setQualityModalReq(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-lg mx-auto space-y-4 my-8 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-700">
          <FileCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-stone-900">Sign in to Access Your Rental Track</h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            Your rental history, equipment borrowings, and lending requests are private and isolated to your verified account.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          {onOpenAuth && (
            <>
              <button
                onClick={() => onOpenAuth('login')}
                className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors shadow-xs"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 bg-stone-100 text-stone-800 rounded-lg text-xs font-semibold hover:bg-stone-200 transition-colors"
              >
                Register New Account
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-stone-500 tracking-wider">
              ACCOUNT RENTAL TRACK (FR-07)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              Private Track &middot; {currentUser.name}
            </span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 mt-1">
            Personal Rental &amp; Lending History
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Private transaction ledger for your account ({currentUser.email}). Enforces scheduled deadlines and early return compensation policies.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs font-medium overflow-x-auto">
          {[
            { key: 'all', label: `All (${myAccountRequests.length})` },
            { key: 'incoming', label: `Lending Out (${incomingCount})` },
            { key: 'outgoing', label: `Borrowing (${outgoingCount})` },
            { key: 'active', label: `Active (${activeCount})` },
            { key: 'completed', label: `Completed (${completedCount})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap text-xs ${
                activeFilter === tab.key
                  ? 'bg-white text-stone-900 font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Feed */}
      <div className="space-y-6">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-xs text-stone-500 space-y-2">
            <div className="font-semibold text-stone-700">No rental records in this view for your account.</div>
            <p className="text-stone-500">
              {activeFilter === 'incoming' 
                ? "No incoming requests on your equipment yet. List your unused tools to earn or help neighbors!"
                : activeFilter === 'outgoing'
                ? "You haven't requested any tools yet. Browse the inventory catalog to borrow equipment!"
                : "No matching transactions found."}
            </p>
          </div>
        ) : (
          filteredRequests.map(req => {
            const borrower = users.find(u => u.id === req.borrowerId);
            const isLender = currentUser.id === req.lenderId;
            const isBorrower = currentUser.id === req.borrowerId;
            const isReviewed = reviews.some(r => r.reviewerId === currentUser.id && (r.targetUserId === req.borrowerId || r.targetUserId === req.lenderId));
            
            const isOverdueAllowed = canMarkOverdue(req.id).allowed;
            const remainingLabel = formatRemainingTime(req.endDate);

            // If incoming request pending approval for current lender
            if (isLender && req.status === 'requested' && borrower) {
              return (
                <div key={req.id} className="space-y-2">
                  <BorrowerHistoryCard
                    request={req}
                    borrower={borrower}
                    onApprove={approveRequest}
                    onReject={rejectRequest}
                  />
                  <div className="text-right text-[11px] text-stone-400 font-mono pr-2">
                    TTL Expiration Window: 24 Hours (FR-04.3)
                  </div>
                </div>
              );
            }

            return (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs p-5 space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-14 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                      <img
                        src={req.assetImage}
                        alt={req.assetTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-stone-500 uppercase">
                          ID: {req.id} &middot; {new Date(req.requestedAt).toLocaleDateString()}
                        </span>

                        {/* Early Return Compensation Badge */}
                        {req.earlyReturnCompensationAmount && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-800 border border-amber-400/40">
                            Early Recalled ({req.earlyReturnPenaltyPercent}% Compensation: ${req.earlyReturnCompensationAmount.toFixed(2)})
                          </span>
                        )}

                        {/* Borrower Quality Check Badge */}
                        {req.borrowerQualityCheck && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Quality Verified: {req.borrowerQualityCheck.conditionRating}/5 ★</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-stone-900 mt-0.5">
                        {req.assetTitle}
                      </h3>
                      <div className="text-xs text-stone-600 mt-0.5 flex flex-wrap items-center gap-2">
                        <span>Lender: <strong>{req.lenderName}</strong></span>
                        <span aria-hidden="true">&middot;</span>
                        <span>Borrower: <strong>{req.borrowerName}</strong> ({req.borrowerRating} ★)</span>
                        <span aria-hidden="true">&middot;</span>
                        <span className="font-mono font-semibold text-stone-900">
                          {req.pricingType === 'free' ? '$0.00 Free Share' : `$${req.totalCost.toFixed(2)} (${req.paymentMethodChosen.toUpperCase()})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Return Deadline & Countdown */}
                  <div className="text-right text-xs font-mono space-y-1 shrink-0">
                    <div className="text-stone-500">Start: {new Date(req.startDate).toLocaleString()}</div>
                    <div className="font-bold text-stone-900">Return Due: {new Date(req.endDate).toLocaleString()}</div>
                    {req.status === 'active' && (
                      <div className={`text-[11px] font-bold ${isOverdueAllowed ? 'text-red-600' : 'text-emerald-700'}`}>
                        {isOverdueAllowed ? '● OVERDUE DEADLINE REACHED' : `⏱ ${remainingLabel}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* FSM Lifecycle Stepper */}
                <RentalFSMTracker 
                  status={req.status} 
                  isFreeItem={req.pricingType === 'free'} 
                />

                {/* Action Controls Toolbar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 text-xs">
                  <div className="text-stone-500">
                    {req.status === 'requested' && 'Awaiting lender screening and availability check.'}
                    {req.status === 'approved' && 'Lender approved! Settle via bKash, Nagad, Rocket, or Bank.'}
                    {req.status === 'payment_sent' && 'Payment sent. Awaiting lender dual verification.'}
                    {req.status === 'payment_confirmed' && 'Payment verified. Both parties sign pickup checklist.'}
                    {req.status === 'active' && 'Rental is currently active. Early recall or return verification available.'}
                    {req.status === 'returned' && 'Item returned. Availability restored to community inventory.'}
                    {req.status === 'overdue' && 'Item is officially overdue. Platform dispute ticket enabled.'}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Pay button */}
                    {req.status === 'approved' && (
                      <button
                        onClick={() => onOpenPaymentModal(req)}
                        className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Settle Direct Payment (FR-03)</span>
                      </button>
                    )}

                    {/* Lender confirm payment */}
                    {req.status === 'payment_sent' && (
                      <button
                        onClick={() => onOpenPaymentModal(req)}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Confirm Payment Receipt (FR-03.2)</span>
                      </button>
                    )}

                    {/* Sign Handover Checklist */}
                    {req.status === 'payment_confirmed' && (
                      <button
                        onClick={() => onOpenHandoverModal(req)}
                        className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Sign Pickup Checklist &amp; Activate (FR-09)</span>
                      </button>
                    )}

                    {/* Borrower Quality Check Button */}
                    {req.status === 'active' && isBorrower && !req.borrowerQualityCheck && (
                      <button
                        onClick={() => {
                          setQualityModalReq(req);
                          setConditionScore(5);
                          setProdRating(5);
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Verify Quality &amp; Rate Tool</span>
                      </button>
                    )}

                    {/* Return Verification by Lender */}
                    {req.status === 'active' && isLender && (
                      <button
                        onClick={() => confirmItemReturned(req.id)}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Confirm Item Returned (Normal Return)</span>
                      </button>
                    )}

                    {/* Owner Early Recall Button (Early Return Penalty) */}
                    {req.status === 'active' && isLender && (
                      <button
                        onClick={() => {
                          setEarlyReturnModalReq(req);
                          setEarlyPenaltyPct(20);
                        }}
                        className="px-3 py-1.5 border border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 rounded-lg font-semibold flex items-center gap-1"
                        title="Recall early before scheduled time (charges compensation fee to borrower)"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Owner Early Recall</span>
                      </button>
                    )}

                    {/* OVERDUE RESTRICTION: Lock button if not yet due! */}
                    {req.status === 'active' && isLender && (
                      <button
                        onClick={() => handleAttemptOverdue(req)}
                        className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                          isOverdueAllowed
                            ? 'border border-red-500 bg-red-600 hover:bg-red-700 text-white shadow-xs'
                            : 'border border-stone-200 bg-stone-100 text-stone-400 hover:bg-stone-200 cursor-pointer'
                        }`}
                        title={
                          isOverdueAllowed
                            ? 'Deadline elapsed: flag as overdue'
                            : `Restricted: Due at ${new Date(req.endDate).toLocaleTimeString()} (${remainingLabel})`
                        }
                      >
                        {isOverdueAllowed ? <Clock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-stone-400" />}
                        <span>{isOverdueAllowed ? 'Flag Overdue' : 'Flag Overdue (Locked)'}</span>
                      </button>
                    )}

                    {/* Submit Mutual Peer Review */}
                    {(req.status === 'returned' || req.status === 'resolved') && !isReviewed && (
                      <button
                        onClick={() => onOpenReviewModal(req)}
                        className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        <span>Submit Peer Review (FR-10)</span>
                      </button>
                    )}

                    {/* File Dispute Ticket */}
                    {['active', 'overdue', 'payment_sent'].includes(req.status) && (
                      <button
                        onClick={() => onOpenDisputeModal(req)}
                        className="px-3 py-1.5 text-stone-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>File Complaint (FR-06)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* OVERDUE RESTRICTION ALERT MODAL */}
      {overdueAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Overdue Action Restricted
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Scheduled Return Deadline: <strong className="text-stone-800">{overdueAlert.dueTime}</strong>
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 leading-relaxed">
              <p>
                Under neighborhood bylaws and Fair Lending rules, lenders are <strong>restricted from submitting overdue reports before the scheduled return window has officially elapsed</strong>.
              </p>
              <p className="mt-2 text-stone-500">
                Item: <span className="font-semibold text-stone-800">{overdueAlert.reqTitle}</span>
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setOverdueAlert(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OWNER EARLY RETURN RECALL MODAL */}
      {earlyReturnModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-stone-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Owner Early Return Recall &amp; Penalty
                  </h3>
                  <p className="text-xs text-stone-500">Compensate borrower for early contract termination</p>
                </div>
              </div>
              <button 
                onClick={() => setEarlyReturnModalReq(null)}
                className="p-1 text-stone-400 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-2 text-amber-950">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>Early Return Policy (FR-Early)</span>
              </div>
              <p className="leading-relaxed">
                If you recall <strong>&ldquo;{earlyReturnModalReq.assetTitle}&rdquo;</strong> before the agreed deadline (<strong>{new Date(earlyReturnModalReq.endDate).toLocaleString()}</strong>), a penalty compensation fee of <strong>{earlyPenaltyPct}%</strong> will be credited directly to borrower <strong>{earlyReturnModalReq.borrowerName}</strong>.
              </p>
            </div>

            {/* Penalty Slider */}
            <div className="space-y-2 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-stone-700">Inconvenience Compensation Percentage:</span>
                <span className="font-mono font-bold text-stone-900 text-sm">{earlyPenaltyPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={earlyPenaltyPct}
                onChange={(e) => setEarlyPenaltyPct(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-stone-500 pt-1">
                <span>Standard (10%)</span>
                <span>Calculated Compensation: <strong className="text-stone-900 font-mono text-xs">${((earlyReturnModalReq.totalCost * earlyPenaltyPct) / 100).toFixed(2)}</strong></span>
                <span>Maximum (50%)</span>
              </div>
            </div>

            {/* Reason Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block">
                Recall Reason (Provided to Borrower)
              </label>
              <input
                type="text"
                value={earlyReason}
                onChange={(e) => setEarlyReason(e.target.value)}
                placeholder="e.g. Urgent personal maintenance need, scheduling conflict..."
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setEarlyReturnModalReq(null)}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEarlyReturn}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                Apply {earlyPenaltyPct}% Penalty &amp; Recall Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BORROWER QUALITY CHECK & PRODUCT REVIEW MODAL */}
      {qualityModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Quality Verification &amp; Product Rating
                  </h3>
                  <p className="text-xs text-stone-500">{qualityModalReq.assetTitle}</p>
                </div>
              </div>
              <button 
                onClick={() => setQualityModalReq(null)}
                className="p-1 text-stone-400 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                Borrower Physical Quality Verification
              </div>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 p-2 rounded-lg border border-stone-200 bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qualityChecklist.powerHealth}
                    onChange={(e) => setQualityChecklist(prev => ({ ...prev, powerHealth: e.target.checked }))}
                    className="rounded text-stone-900"
                  />
                  <span><strong>Power &amp; Motor Health:</strong> Starts smoothly, no excessive spark or heat.</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-lg border border-stone-200 bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qualityChecklist.safetyGuardPresent}
                    onChange={(e) => setQualityChecklist(prev => ({ ...prev, safetyGuardPresent: e.target.checked }))}
                    className="rounded text-stone-900"
                  />
                  <span><strong>Safety Guards Attached:</strong> Protective casing, shield, and trigger lock intact.</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-lg border border-stone-200 bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qualityChecklist.cleanCondition}
                    onChange={(e) => setQualityChecklist(prev => ({ ...prev, cleanCondition: e.target.checked }))}
                    className="rounded text-stone-900"
                  />
                  <span><strong>Cleanliness:</strong> Clean condition without corrosive residue or grease.</span>
                </label>
              </div>
            </div>

            {/* Product Star Rating */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex justify-between text-xs font-bold text-stone-800 uppercase">
                <span>Rate Product Quality (1-5 Stars)</span>
                <span className="font-mono text-amber-600">{prodRating} / 5.0 ★</span>
              </div>
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setProdRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        prodRating >= star ? 'fill-amber-400 text-amber-500' : 'text-stone-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Written Review */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block">
                Borrower Product Review &amp; Feedback Notes
              </label>
              <textarea
                rows={3}
                value={prodComment}
                onChange={(e) => setProdComment(e.target.value)}
                placeholder="Share how the equipment performed for your project..."
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setQualityModalReq(null)}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitQualityCheck}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                Submit Quality Verification &amp; Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
