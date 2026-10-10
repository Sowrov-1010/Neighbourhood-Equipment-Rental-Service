import React, { useState } from 'react';
import { RentalRequest, Asset } from '../types';
import { useApp } from '../context/AppContext';
import { X, CreditCard, Banknote, CheckCircle, ArrowRight, ShieldCheck, Copy, Check } from 'lucide-react';

interface PaymentModalProps {
  request: RentalRequest;
  asset: Asset;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ request, asset, onClose }) => {
  const { currentUser, markPaymentSent, confirmPaymentReceived } = useApp();
  const [txnId, setTxnId] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isBorrower = currentUser.id === request.borrowerId;
  const isLender = currentUser.id === request.lenderId;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBorrowerMarkSent = () => {
    if (request.paymentMethodChosen === 'mobile_banking' && !txnId.trim()) {
      setErrorMsg('Please input the Mobile Banking Transaction Reference ID from your banking app.');
      return;
    }
    markPaymentSent(request.id, txnId.trim());
    onClose();
  };

  const handleLenderConfirm = () => {
    confirmPaymentReceived(request.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200">
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono uppercase text-stone-500 tracking-wider">
              DUAL PAYMENT SYNCHRONIZATION (FR-03)
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">
              Direct P2P Settlement
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount Due Card */}
          <div className="bg-stone-900 text-stone-100 p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-stone-400 font-medium">Agreed Direct Amount</div>
              <div className="text-2xl font-bold font-mono tracking-tight text-white mt-0.5">
                ${request.totalCost.toFixed(2)}
              </div>
              <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                Item: {request.assetTitle}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono bg-stone-800 text-amber-300 px-2 py-1 rounded">
                Zero Platform Escrow
              </span>
              <div className="text-[10px] text-stone-400 mt-1">100% Direct P2P</div>
            </div>
          </div>

          {/* Current Status Badge */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-stone-900 flex items-center gap-1.5">
              <span>Status:</span>
              <span className="font-mono text-amber-700 capitalize">
                {request.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-stone-600">
              {request.status === 'approved' && 'Waiting for Borrower to transfer/hand payment and mark "Payment Sent".'}
              {request.status === 'payment_sent' && 'Borrower marked payment sent. Waiting for Lender to confirm receipt in bank account or cash.'}
              {request.status === 'payment_confirmed' && 'Payment fully verified! Ready for pickup checklist signing.'}
            </p>
          </div>

          {/* Mobile Banking Instructions */}
          {request.paymentMethodChosen === 'mobile_banking' && (
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-3">
              <div className="text-xs font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-stone-600" />
                <span>Lender Mobile Banking Details</span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-stone-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Provider:</span>
                  <span className="font-semibold text-stone-900">
                    {asset.lenderPaymentDetails.mobileBankingProvider || 'Zelle / Mobile Banking'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Handle / Phone / Email:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900">
                      {asset.lenderPaymentDetails.mobileBankingHandle || 'lender@neighborhood.org'}
                    </span>
                    <button
                      onClick={() => copyToClipboard(asset.lenderPaymentDetails.mobileBankingHandle || '')}
                      className="p-1 hover:bg-stone-100 rounded text-stone-500 hover:text-stone-900"
                      title="Copy handle"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-stone-500">
                Open your mobile banking app, transfer exactly <strong>${request.totalCost.toFixed(2)}</strong>, and paste the transaction confirmation number below.
              </p>

              {isBorrower && request.status === 'approved' && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-medium text-stone-800 block">
                    Transaction ID / Reference Number:
                  </label>
                  <input
                    type="text"
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                    placeholder="e.g., ZEL-883921-TX or VN-49102"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-stone-600"
                  />
                </div>
              )}

              {request.mobileBankingTxnId && (
                <div className="text-xs text-stone-700 bg-white p-2.5 rounded border border-stone-200">
                  <span className="text-stone-500">Provided Txn ID:</span>{' '}
                  <span className="font-mono font-bold">{request.mobileBankingTxnId}</span>
                </div>
              )}
            </div>
          )}

          {/* Cash Instructions */}
          {request.paymentMethodChosen === 'cash' && (
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-2 text-xs">
              <div className="font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-stone-600" />
                <span>Cash on Physical Pickup Terms</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                {asset.lenderPaymentDetails.cashInstructions || 'Please provide exact cash upon physical item handover.'}
              </p>
              <div className="text-stone-500 text-[11px]">
                Both parties confirm handover and currency exchange in person before signing the digital condition checklist.
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
          )}

          {/* Action Buttons based on User Role */}
          <div className="pt-2 flex flex-col gap-2">
            {isBorrower && request.status === 'approved' && (
              <button
                onClick={handleBorrowerMarkSent}
                className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Mark Payment Sent (FR-03.2)</span>
              </button>
            )}

            {isLender && request.status === 'payment_sent' && (
              <button
                onClick={handleLenderConfirm}
                className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Confirm Payment Received (Lender Verification)</span>
              </button>
            )}

            {/* Helper guidance if viewer is neither or in wrong state */}
            {!isBorrower && request.status === 'approved' && (
              <p className="text-[11px] text-stone-500 text-center italic">
                (Switch user persona to borrower &ldquo;{request.borrowerName}&rdquo; to simulate marking payment sent)
              </p>
            )}

            {!isLender && request.status === 'payment_sent' && (
              <p className="text-[11px] text-stone-500 text-center italic">
                (Switch user persona to lender &ldquo;{request.lenderName}&rdquo; to simulate confirming payment receipt)
              </p>
            )}

            <button
              onClick={onClose}
              className="w-full py-2 text-stone-600 hover:text-stone-900 text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
