import React from 'react';
import { RentalStatus } from '../types';
import { Check, Clock, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface RentalFSMTrackerProps {
  status: RentalStatus;
  isFreeItem?: boolean;
}

const STEPS: { key: RentalStatus; label: string }[] = [
  { key: 'requested', label: 'Requested' },
  { key: 'approved', label: 'Approved' },
  { key: 'payment_sent', label: 'Payment Sent' },
  { key: 'payment_confirmed', label: 'Confirmed' },
  { key: 'active', label: 'Picked Up (Active)' },
  { key: 'returned', label: 'Returned' },
];

export const RentalFSMTracker: React.FC<RentalFSMTrackerProps> = ({ status, isFreeItem }) => {
  // If rejected, expired, or disputed/blacklisted, show specific branch
  const isSpecialState = ['rejected', 'expired', 'overdue', 'disputed', 'blacklisted', 'resolved'].includes(status);

  // Helper to get step index
  const getStepIndex = (st: RentalStatus): number => {
    switch (st) {
      case 'requested': return 0;
      case 'approved': return 1;
      case 'payment_sent': return 2;
      case 'payment_confirmed': return 3;
      case 'active': return 4;
      case 'returned': return 5;
      case 'resolved': return 5;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between text-xs font-mono text-stone-500 mb-3 pb-2 border-b border-stone-200">
        <span className="font-semibold text-stone-700">FSM LIFECYCLE TRACKER (FR-07)</span>
        <span className="uppercase font-bold text-stone-900">
          State: <span className="font-mono text-amber-700">{status.replace('_', ' ')}</span>
        </span>
      </div>

      {isSpecialState ? (
        <div className="py-2">
          {status === 'disputed' && (
            <div className="bg-amber-100 border border-amber-300 text-amber-950 p-3 rounded text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Disputed State:</strong> An administrative complaint ticket has been submitted. Platform admin is reviewing evidence for binding directives.
              </span>
            </div>
          )}
          {status === 'overdue' && (
            <div className="bg-red-100 border border-red-300 text-red-950 p-3 rounded text-xs flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-700 shrink-0" />
              <span>
                <strong>Overdue Return:</strong> Item has not been returned by scheduled deadline. Overdue penalties and lender escalation enabled.
              </span>
            </div>
          )}
          {status === 'blacklisted' && (
            <div className="bg-red-600 text-white p-3 rounded text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-white shrink-0" />
              <span>
                <strong>Blacklisted:</strong> Account capabilities suspended due to non-compliance or unreturned equipment.
              </span>
            </div>
          )}
          {status === 'rejected' && (
            <div className="bg-stone-200 text-stone-800 p-3 rounded text-xs">
              <strong>Request Rejected:</strong> Lender declined this borrow request. No calendar slots reserved.
            </div>
          )}
          {status === 'resolved' && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 p-3 rounded text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Dispute Resolved:</strong> Admin directives and return obligations satisfied. Profile standing restored.
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {STEPS.map((step, idx) => {
              const isPassed = currentIndex > idx;
              const isCurrent = currentIndex === idx;

              return (
                <div key={step.key} className="flex flex-col items-center text-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono transition-colors ${
                      isPassed
                        ? 'bg-stone-900 text-white font-bold'
                        : isCurrent
                        ? 'bg-amber-500 text-stone-950 font-bold ring-2 ring-stone-900 ring-offset-1'
                        : 'bg-stone-200 text-stone-500'
                    }`}
                  >
                    {isPassed ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span
                    className={`mt-1.5 text-[11px] leading-tight ${
                      isCurrent
                        ? 'font-bold text-stone-950'
                        : isPassed
                        ? 'font-medium text-stone-800'
                        : 'text-stone-600'
                    }`}
                  >
                    {step.label}
                    {isFreeItem && (step.key === 'payment_sent' || step.key === 'payment_confirmed') && (
                      <span className="block text-[9px] text-stone-600">(Bypassed)</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
