import React, { useState } from 'react';
import { RentalRequest, Asset } from '../types';
import { useApp } from '../context/AppContext';
import { 
  X, 
  CreditCard, 
  Banknote, 
  CheckCircle, 
  Building2, 
  Copy, 
  Check, 
  Smartphone,
  ChevronDown,
  Info
} from 'lucide-react';

interface PaymentModalProps {
  request: RentalRequest;
  asset: Asset;
  onClose: () => void;
}

type PaymentMethodOption = 'bkash' | 'nagad' | 'rocket' | 'bank_account' | 'cash';

export const PaymentModal: React.FC<PaymentModalProps> = ({ request, asset, onClose }) => {
  const { currentUser, markPaymentSent, confirmPaymentReceived } = useApp();
  
  // Default selected payment channel based on request or asset
  const initialMethod = ((): PaymentMethodOption => {
    if (request.paymentMethodChosen === 'cash') return 'cash';
    if (request.paymentMethodChosen === 'bkash') return 'bkash';
    if (request.paymentMethodChosen === 'nagad') return 'nagad';
    if (request.paymentMethodChosen === 'rocket') return 'rocket';
    if (request.paymentMethodChosen === 'bank_account') return 'bank_account';
    return 'bkash';
  })();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption>(initialMethod);
  const [txnId, setTxnId] = useState(request.mobileBankingTxnId || '');
  const [senderAccount, setSenderAccount] = useState(request.paymentAccountUsed || '');
  const [bankTransferNote, setBankTransferNote] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const isBorrower = currentUser.id === request.borrowerId;
  const isLender = currentUser.id === request.lenderId;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleBorrowerMarkSent = () => {
    setErrorMsg('');
    if (selectedMethod !== 'cash' && !txnId.trim()) {
      setErrorMsg(`Please enter the ${selectedMethod.toUpperCase()} Transaction ID (TrxID) or Reference number.`);
      return;
    }
    markPaymentSent(request.id, txnId.trim() || 'CASH-CONFIRMED', selectedMethod, senderAccount.trim());
    onClose();
  };

  const handleLenderConfirm = () => {
    confirmPaymentReceived(request.id);
    onClose();
  };

  // Get lender payment credentials
  const lenderDetails = asset.lenderPaymentDetails;
  const lenderPhone = lenderDetails.mobileBankingHandle || '01711-000000';
  const bankName = lenderDetails.bankName || 'BRAC Bank / City Bank Ltd';
  const branchName = lenderDetails.branchName || 'Principal Branch';
  const accountNumber = lenderDetails.accountNumber || '1501203498001';
  const accountTitle = lenderDetails.accountTitle || asset.ownerName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-xs font-mono uppercase text-stone-500 tracking-wider">
              DUAL PAYMENT SYNCHRONIZATION (FR-03)
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">
              Direct P2P Settlement &amp; Channel Selector
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Amount Due Card */}
          <div className="bg-stone-900 text-stone-100 p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-stone-400 font-medium">Agreed Direct Rental Fee</div>
              <div className="text-2xl font-bold font-mono tracking-tight text-white mt-0.5">
                ${request.totalCost.toFixed(2)}
              </div>
              <div className="text-[11px] text-stone-400 font-mono mt-0.5 truncate max-w-[280px]">
                {request.assetTitle}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                100% Direct P2P
              </span>
              <div className="text-[10px] text-stone-400 mt-1">Zero Platform Escrow</div>
            </div>
          </div>

          {/* Current Status Badge */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-stone-900 flex items-center gap-1.5">
              <span>Status:</span>
              <span className="font-mono text-amber-700 capitalize font-bold">
                {request.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-stone-600">
              {request.status === 'approved' && 'Waiting for borrower to select payment method, transfer funds, and mark "Payment Sent".'}
              {request.status === 'payment_sent' && 'Borrower has sent payment. Waiting for lender to verify and confirm receipt.'}
              {request.status === 'payment_confirmed' && 'Payment verified! Ready for pickup condition checklist.'}
            </p>
          </div>

          {/* PAYMENT METHOD DROPDOWN SELECTOR */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wide flex items-center justify-between">
              <span>Select Payment Method</span>
              <span className="text-[10px] font-mono text-stone-500 font-normal">Choose Preferred Channel</span>
            </label>

            <div className="relative">
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value as PaymentMethodOption)}
                disabled={request.status !== 'approved' && !isBorrower}
                className="w-full appearance-none px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 pr-10 cursor-pointer disabled:bg-stone-100 disabled:cursor-not-allowed shadow-xs"
              >
                <option value="bkash">bKash (Mobile Financial Service)</option>
                <option value="nagad">Nagad (Postal Digital Service)</option>
                <option value="rocket">Rocket (Dutch-Bangla Bank MFS)</option>
                <option value="bank_account">Bank Account Transfer (BEFTN / NPSB / RTGS)</option>
                <option value="cash">Cash on Physical Pickup</option>
              </select>
              <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* CHANNEL SPECIFIC INSTRUCTIONS & CREDENTIALS */}
          {selectedMethod === 'bkash' && (
            <div className="border border-pink-200 rounded-xl p-4 bg-pink-50/60 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-pink-950 flex items-center gap-1.5 uppercase tracking-wide">
                  <Smartphone className="w-4 h-4 text-pink-600" />
                  <span>bKash Send Money / Payment</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-pink-600 text-white font-mono font-bold text-[10px]">
                  bKash
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-pink-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Lender bKash Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900 text-sm">{lenderPhone}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(lenderPhone, 'bkash')}
                      className="p-1 hover:bg-stone-100 rounded text-stone-600"
                      title="Copy number"
                    >
                      {copiedKey === 'bkash' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>Type:</span>
                  <span className="font-medium">Personal (Send Money) / Merchant</span>
                </div>
              </div>

              <p className="text-[11px] text-pink-900 leading-relaxed">
                Open your <strong>bKash App</strong> or dial <strong>*247#</strong>, send <strong>${request.totalCost.toFixed(2)}</strong> to <strong>{lenderPhone}</strong>, and enter your Transaction ID below.
              </p>
            </div>
          )}

          {selectedMethod === 'nagad' && (
            <div className="border border-orange-200 rounded-xl p-4 bg-orange-50/60 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-orange-950 flex items-center gap-1.5 uppercase tracking-wide">
                  <Smartphone className="w-4 h-4 text-orange-600" />
                  <span>Nagad Digital Wallet Transfer</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-orange-600 text-white font-mono font-bold text-[10px]">
                  Nagad
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-orange-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Lender Nagad Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900 text-sm">{lenderPhone}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(lenderPhone, 'nagad')}
                      className="p-1 hover:bg-stone-100 rounded text-stone-600"
                      title="Copy number"
                    >
                      {copiedKey === 'nagad' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>Type:</span>
                  <span className="font-medium">Personal Send Money</span>
                </div>
              </div>

              <p className="text-[11px] text-orange-900 leading-relaxed">
                Open your <strong>Nagad App</strong> or dial <strong>*167#</strong>, transfer <strong>${request.totalCost.toFixed(2)}</strong>, and paste the 8-character Nagad TrxID below.
              </p>
            </div>
          )}

          {selectedMethod === 'rocket' && (
            <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/60 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-950 flex items-center gap-1.5 uppercase tracking-wide">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span>Rocket (Dutch-Bangla Bank)</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-mono font-bold text-[10px]">
                  Rocket
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Lender Rocket Account (12 digits):</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900 text-sm">{lenderPhone}8</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`${lenderPhone}8`, 'rocket')}
                      className="p-1 hover:bg-stone-100 rounded text-stone-600"
                      title="Copy account"
                    >
                      {copiedKey === 'rocket' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-purple-900 leading-relaxed">
                Dial <strong>*322#</strong> or open DBBL Rocket, transfer <strong>${request.totalCost.toFixed(2)}</strong>, and provide your Transaction ID.
              </p>
            </div>
          )}

          {selectedMethod === 'bank_account' && (
            <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/60 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950 flex items-center gap-1.5 uppercase tracking-wide">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Bank Account Direct Settlement</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono font-bold text-[10px]">
                  Bank Transfer
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Bank Name:</span>
                  <span className="font-semibold text-stone-900">{bankName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Branch Name:</span>
                  <span className="font-semibold text-stone-900">{branchName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Account Title:</span>
                  <span className="font-semibold text-stone-900">{accountTitle}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                  <span className="text-stone-500">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900 text-sm">{accountNumber}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(accountNumber, 'bank')}
                      className="p-1 hover:bg-stone-100 rounded text-stone-600"
                      title="Copy account number"
                    >
                      {copiedKey === 'bank' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-blue-900 leading-relaxed">
                Transfer via <strong>Online Banking / BEFTN / NPSB / App</strong>. Enter your Transaction Reference or deposit slip ID below.
              </p>
            </div>
          )}

          {selectedMethod === 'cash' && (
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-2 text-xs">
              <div className="font-bold text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Cash on Physical Pickup Terms</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Hand exact physical currency of <strong>${request.totalCost.toFixed(2)}</strong> directly to the lender upon handover inspection.
              </p>
              <div className="text-[11px] text-stone-500">
                Both parties confirm handover and currency exchange in person before signing the digital condition checklist.
              </div>
            </div>
          )}

          {/* INPUT FORM FOR BORROWER */}
          {isBorrower && request.status === 'approved' && selectedMethod !== 'cash' && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Your Wallet / Account Number:
                  </label>
                  <input
                    type="text"
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    placeholder="e.g. 017XXXXXXXX"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-stone-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Transaction ID (TrxID) / Ref: *
                  </label>
                  <input
                    type="text"
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                    placeholder="e.g. BKS-889123 or TRX-40192"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-mono uppercase font-bold focus:outline-none focus:ring-1 focus:ring-stone-600"
                  />
                </div>
              </div>
            </div>
          )}

          {request.mobileBankingTxnId && (
            <div className="text-xs text-stone-700 bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-stone-500">Submitted TrxID:</span>
                <span className="font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                  {request.mobileBankingTxnId}
                </span>
              </div>
              {request.paymentAccountUsed && (
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-stone-500">Sender Account:</span>
                  <span className="text-stone-800">{request.paymentAccountUsed}</span>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col gap-2 shrink-0">
          {isBorrower && request.status === 'approved' && (
            <button
              onClick={handleBorrowerMarkSent}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Mark Payment Sent via {selectedMethod.toUpperCase()} (FR-03.2)</span>
            </button>
          )}

          {isLender && request.status === 'payment_sent' && (
            <button
              onClick={handleLenderConfirm}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <CheckCircle className="w-4 h-4 text-white" />
              <span>Confirm Payment Received in {selectedMethod.toUpperCase()}</span>
            </button>
          )}

          {!isBorrower && request.status === 'approved' && (
            <p className="text-[11px] text-stone-500 text-center italic">
              (Switch to borrower &ldquo;{request.borrowerName}&rdquo; to simulate sending payment)
            </p>
          )}

          {!isLender && request.status === 'payment_sent' && (
            <p className="text-[11px] text-stone-500 text-center italic">
              (Switch to lender &ldquo;{request.lenderName}&rdquo; to simulate confirming payment receipt)
            </p>
          )}

          <button
            onClick={onClose}
            className="w-full py-1.5 text-stone-600 hover:text-stone-900 text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
