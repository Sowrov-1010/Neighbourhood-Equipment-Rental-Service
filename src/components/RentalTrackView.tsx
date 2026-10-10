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
  ShieldAlert
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
    markRequestOverdue,
    reviews,
    isAuthenticated
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'incoming' | 'outgoing' | 'active' | 'completed'>('all');

  // STRICT ACCOUNT ISOLATION (FR-07 / Privacy Boundary):
  // An individual account ONLY sees rental records where they are the Lender or the Borrower.
  // No one can see another account's rental track.
  const myAccountRequests = isAuthenticated
    ? rentalRequests.filter(req => req.lenderId === currentUser.id || req.borrowerId === currentUser.id)
    : [];

  // Filter strictly within current authenticated user's isolated transactions
  const filteredRequests = myAccountRequests.filter(req => {
    if (activeFilter === 'incoming') {
      return req.lenderId === currentUser.id;
    }
    if (activeFilter === 'outgoing') {
      return req.borrowerId === currentUser.id;
    }
    if (activeFilter === 'active') {
      return req.status === 'active' || req.status === 'payment_confirmed';
    }
    if (activeFilter === 'completed') {
      return req.status === 'returned' || req.status === 'resolved';
    }
    return true;
  });

  const incomingCount = myAccountRequests.filter(r => r.lenderId === currentUser.id).length;
  const outgoingCount = myAccountRequests.filter(r => r.borrowerId === currentUser.id).length;
  const activeCount = myAccountRequests.filter(r => r.status === 'active' || r.status === 'payment_confirmed').length;
  const completedCount = myAccountRequests.filter(r => r.status === 'returned' || r.status === 'resolved').length;

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
            Private transaction ledger for your account ({currentUser.email}). Only transactions involving you are accessible here.
          </p>
        </div>

        {/* Filter Tabs (Interactive segmented buttons with account counts) */}
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

            // If incoming request pending approval for the current lender, show the comprehensive BorrowerHistoryCard (FR-05)!
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
                      <div className="text-xs font-mono text-stone-500 uppercase">
                        Request ID: {req.id} · {new Date(req.requestedAt).toLocaleDateString()}
                      </div>
                      <h3 className="text-base font-bold text-stone-900 mt-0.5">
                        {req.assetTitle}
                      </h3>
                      <div className="text-xs text-stone-600 mt-0.5 flex flex-wrap items-center gap-2">
                        <span>Lender: <strong>{req.lenderName}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>Borrower: <strong>{req.borrowerName}</strong> ({req.borrowerRating} ★)</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-semibold text-stone-900">
                          {req.pricingType === 'free' ? '$0.00 Free Share' : `$${req.totalCost.toFixed(2)} (${req.paymentMethodChosen.replace('_', ' ')})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-stone-500 font-mono space-y-1">
                    <div>Start: {new Date(req.startDate).toLocaleString()}</div>
                    <div>Return Due: {new Date(req.endDate).toLocaleString()}</div>
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
                    {req.status === 'requested' && 'Awaiting lender review and screening decision.'}
                    {req.status === 'approved' && 'Lender approved! Proceed with direct payment settlement.'}
                    {req.status === 'payment_sent' && 'Payment sent. Awaiting lender dual verification.'}
                    {req.status === 'payment_confirmed' && 'Payment verified. Both parties sign pickup checklist.'}
                    {req.status === 'active' && 'Rental is currently active. Return on scheduled time.'}
                    {req.status === 'returned' && 'Item returned and inventory availability restored.'}
                    {req.status === 'overdue' && 'Item is overdue. Admin dispute filing available.'}
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
                        <span>Sign Pickup Checklist & Activate (FR-09)</span>
                      </button>
                    )}

                    {/* Return Verification by Lender */}
                    {req.status === 'active' && isLender && (
                      <button
                        onClick={() => confirmItemReturned(req.id)}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Confirm Item Returned (Restore Availability)</span>
                      </button>
                    )}

                    {/* Mark Overdue */}
                    {req.status === 'active' && isLender && (
                      <button
                        onClick={() => markRequestOverdue(req.id)}
                        className="px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg font-semibold flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Flag Overdue</span>
                      </button>
                    )}

                    {/* Submit Mutual Review */}
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
                        <span>File Complaint Ticket (FR-06)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
