import React, { useState } from 'react';
import { UserProfile, RentalRequest } from '../types';
import { useApp } from '../context/AppContext';
import { AlertOctagon, CheckCircle2, XCircle, Clock, ShieldAlert, Star, ShieldCheck } from 'lucide-react';

interface BorrowerHistoryCardProps {
  request: RentalRequest;
  borrower: UserProfile;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string, reason?: string) => void;
}

export const BorrowerHistoryCard: React.FC<BorrowerHistoryCardProps> = ({
  request,
  borrower,
  onApprove,
  onReject,
}) => {
  const { isHighRiskBorrower } = useApp();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const isRedBadge = isHighRiskBorrower(borrower);
  
  // Calculate on-time return rate percentage
  const totalCompleted = borrower.totalBorrowed;
  const onTimePercentage = totalCompleted > 0 
    ? Math.round((borrower.onTimeReturnCount / totalCompleted) * 100) 
    : 100;

  return (
    <div className={`rounded-xl border transition-all ${
      isRedBadge 
        ? 'border-red-500 bg-red-50/30 shadow-md ring-1 ring-red-400' 
        : 'border-stone-200 bg-white shadow-xs'
    }`}>
      {/* Header bar */}
      <div className={`px-5 py-3 border-b flex items-center justify-between ${
        isRedBadge ? 'bg-red-50 border-red-200 text-red-950' : 'bg-stone-50 border-stone-200 text-stone-900'
      }`}>
        <div className="flex items-center gap-2">
          {isRedBadge ? (
            <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span className="text-xs font-bold tracking-wider uppercase font-mono">
            INCOMING BORROW REQUEST
          </span>
        </div>
        <div className="text-xs font-mono text-stone-500">
          ID: {request.id.slice(0, 12)}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Item & Borrower Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="text-xs text-stone-500 font-medium">Requested Item</div>
            <div className="text-base font-semibold text-stone-900">
              {request.assetTitle}
            </div>
            <div className="text-xs text-stone-500 font-mono mt-0.5">
              Duration: {request.durationHours > 0 ? `${request.durationHours} hrs` : `${request.durationDays} days`} · Rate: ৳{request.rate} ({request.pricingType}) · Total: ৳{request.totalCost.toFixed(2)}
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-xs text-stone-500 font-medium">Borrower</div>
            <div className="text-sm font-bold text-stone-900 flex sm:justify-end items-center gap-1.5">
              <span>{borrower.name}</span>
              <span className="text-xs text-stone-500 font-normal">({borrower.neighborhood})</span>
            </div>
          </div>
        </div>

        {/* FR-05.3: Explicit RED BADGE Risk Alert Callout */}
        {isRedBadge ? (
          <div className="bg-red-600 text-white p-3.5 rounded-lg space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
              <span>[!] RISK ALERT: PROFILE STATUS - RED BADGE (Rating: {borrower.rating.toFixed(1)} / 5.0)</span>
            </div>
            <p className="text-xs text-red-100 leading-relaxed">
              This borrower has fallen below community safety thresholds (&lt; 3.0 stars or multiple overdue returns). Proceed with caution or request alternative terms.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-50 text-emerald-950 p-2.5 rounded-lg border border-emerald-200 flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">
              Verified Reliable Borrower: Clean community track record with {onTimePercentage}% on-time completion.
            </span>
          </div>
        )}

        {/* FR-05.2: Historical Track Record Metrics */}
        <div className="bg-stone-50 rounded-lg p-3.5 border border-stone-200 space-y-3">
          <div className="text-xs font-bold text-stone-700 uppercase tracking-wide">
            Historical Track Record
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded border border-stone-200">
              <div className="text-stone-500 text-[11px]">Total Borrowed</div>
              <div className="text-sm font-bold text-stone-900 font-mono mt-0.5">
                {borrower.totalBorrowed} Items
              </div>
            </div>

            <div className="bg-white p-2.5 rounded border border-stone-200">
              <div className="text-stone-500 text-[11px]">On-Time Return Rate</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${
                onTimePercentage < 70 ? 'text-red-600' : 'text-emerald-700'
              }`}>
                {onTimePercentage}% ({borrower.overdueInstances} Overdue)
              </div>
            </div>

            <div className="bg-white p-2.5 rounded border border-stone-200">
              <div className="text-stone-500 text-[11px]">Average Rating</div>
              <div className="text-sm font-bold text-stone-900 flex items-center gap-1 font-mono mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{borrower.rating.toFixed(1)} / 5.0</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded border border-stone-200">
              <div className="text-stone-500 text-[11px]">Payment Method</div>
              <div className="text-sm font-medium text-stone-900 capitalize font-mono mt-0.5">
                {request.paymentMethodChosen === 'mobile_banking' ? 'Mobile Banking' : request.paymentMethodChosen === 'cash' ? 'Cash on Pickup' : 'Free (৳0)'}
              </div>
            </div>
          </div>

          {/* Categorized Feedback Flags */}
          <div className="pt-1">
            <div className="text-[11px] font-semibold text-stone-600 mb-1.5">
              Categorized Community Flags:
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                borrower.flags.lateReturn > 0 ? 'bg-red-100 text-red-800 font-bold' : 'bg-stone-200/70 text-stone-600'
              }`}>
                Late Return: {borrower.flags.lateReturn}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                borrower.flags.paymentIssue > 0 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-stone-200/70 text-stone-600'
              }`}>
                Payment Issue: {borrower.flags.paymentIssue}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                borrower.flags.equipmentDamage > 0 ? 'bg-red-100 text-red-800 font-bold' : 'bg-stone-200/70 text-stone-600'
              }`}>
                Equipment Damage: {borrower.flags.equipmentDamage}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                borrower.flags.unresponsive > 0 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-stone-200/70 text-stone-600'
              }`}>
                Unresponsive: {borrower.flags.unresponsive}
              </span>
            </div>
          </div>

          {/* Recent Feedback Quote */}
          {borrower.recentFeedback && (
            <div className="text-xs text-stone-600 bg-white p-2.5 rounded border border-stone-200 italic">
              Recent Feedback: &ldquo;{borrower.recentFeedback}&rdquo;
            </div>
          )}
        </div>

        {/* Reject reason input if expanded */}
        {showRejectForm && (
          <div className="p-3 bg-stone-100 rounded-lg space-y-2 border border-stone-200 text-xs">
            <label className="font-semibold text-stone-700 block">Reason for Rejection (Visible to Borrower):</label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection"
              className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-500 text-xs"
            />
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setShowRejectForm(false)}
                className="px-2.5 py-1 text-stone-600 hover:text-stone-900 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => onReject(request.id, rejectReason || 'Declined by lender')}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}

        {/* FR-05.4: Lender Discretion Action Buttons */}
        {!showRejectForm && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => onApprove(request.id)}
              className="py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>APPROVE REQUEST</span>
            </button>

            <button
              onClick={() => setShowRejectForm(true)}
              className="py-2.5 px-4 bg-white hover:bg-stone-100 text-red-700 border border-red-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>REJECT REQUEST</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
