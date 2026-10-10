import React, { useState, useMemo } from 'react';
import { Asset, PricingType } from '../types';
import { useApp } from '../context/AppContext';
import { 
  X, 
  MapPin, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  CreditCard, 
  Banknote, 
  AlertCircle,
  ShieldAlert,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface AssetDetailModalProps {
  asset: Asset;
  onClose: () => void;
  onRequestSuccess: (requestId: string) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  onClose,
  onRequestSuccess,
}) => {
  const { currentUser, createRentalRequest, getObfuscatedAddress, isAuthenticated } = useApp();

  // Booking date states
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  
  const [startDate, setStartDate] = useState(`${tomorrowStr}T09:00`);
  const [endDate, setEndDate] = useState(`${tomorrowStr}T17:00`);
  const [paymentChoice, setPaymentChoice] = useState<'cash' | 'mobile_banking' | 'none'>(
    asset.pricingType === 'free' 
      ? 'none' 
      : asset.acceptedPayments === 'cash' 
      ? 'cash' 
      : 'mobile_banking'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dynamic cost calculation (FR-02.2)
  const calculation = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = Math.max(0, end.getTime() - start.getTime());
    const hours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
    const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    let total = 0;
    if (asset.pricingType === 'free') {
      total = 0;
    } else if (asset.pricingType === 'hourly') {
      total = hours * asset.priceAmount;
    } else if (asset.pricingType === 'daily') {
      total = days * asset.priceAmount;
    } else if (asset.pricingType === 'per_use') {
      total = asset.priceAmount;
    }

    return {
      hours,
      days,
      totalCost: total,
    };
  }, [startDate, endDate, asset]);

  const handleSubmitRequest = () => {
    setErrorMsg(null);

    if (currentUser.id === asset.ownerId) {
      setErrorMsg('You cannot borrow your own listed equipment.');
      return;
    }

    const res = createRentalRequest({
      assetId: asset.id,
      startDate,
      endDate,
      pricingType: asset.pricingType,
      durationHours: calculation.hours,
      durationDays: calculation.days,
      totalCost: calculation.totalCost,
      paymentMethod: asset.pricingType === 'free' ? 'none' : paymentChoice,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to submit borrow request.');
      return;
    }

    if (res.requestId) {
      onRequestSuccess(res.requestId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
        {/* Modal Top Header */}
        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="text-xs font-mono uppercase text-stone-500 tracking-wider">
              {asset.category} · Condition: {asset.condition}
            </div>
            <h2 className="text-lg font-bold text-stone-900 mt-0.5">
              {asset.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Blacklisted Warning if borrower is blacklisted */}
          {currentUser.isBlacklisted && (
            <div className="bg-red-50 border border-red-300 p-4 rounded-xl flex items-start gap-3 text-xs text-red-900">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-red-950 block text-sm">
                  Borrowing Locked (Blacklisted Account)
                </strong>
                Administrative sanctions are active on your profile. You cannot initiate borrow requests until outstanding penalties are settled with the District Administration desk.
              </div>
            </div>
          )}

          {/* Image & Quick Specs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="aspect-4/3 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
              <img
                src={asset.imageUrl}
                alt={asset.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-stone-500 font-medium">Pricing Model</div>
                <div className="text-xl font-bold text-stone-900 font-mono">
                  {asset.pricingType === 'free' ? '$0.00 Free Share' : `$${asset.priceAmount} / ${asset.pricingType.replace('_', ' ')}`}
                </div>
                <div className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Strictly Zero Security Deposit</span>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 text-xs text-stone-600 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{getObfuscatedAddress(asset.neighborhood, false)}</span>
                </div>
                <div className="text-stone-500 text-[11px] font-mono">
                  Lender: {asset.ownerName} ({asset.distanceKm} km from your registered zone)
                </div>
              </div>

              {/* Verified Non-Consumable Badge */}
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-[11px] text-stone-600 space-y-1">
                <div className="font-semibold text-stone-900 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-stone-700" />
                  <span>Non-Consumable Reusable Asset Pledge</span>
                </div>
                <p>
                  Tools and appliances are cataloged for repeated neighborhood sharing. No purchase required.
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
              Description & Specifications
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-100">
              {asset.description}
            </p>
            {asset.features && asset.features.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {asset.features.map((feat, i) => (
                  <span key={i} className="text-[11px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded font-mono">
                    ✓ {feat}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* FR-02: Date Selection & Dynamic Cost Calculator */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-stone-600" />
                <span>Booking Duration & Real-Time Rate Calculator (FR-02)</span>
              </span>
              <span className="text-xs text-stone-500 font-mono">
                Model: {asset.pricingType.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  Pickup Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-stone-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  Expected Return Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-stone-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Dynamic Formula Breakdown */}
            <div className="bg-white p-3 rounded-lg border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="text-stone-500 font-mono">
                  {asset.pricingType === 'hourly' && `Formula: ${calculation.hours} hours × $${asset.priceAmount}/hr`}
                  {asset.pricingType === 'daily' && `Formula: ${calculation.days} days × $${asset.priceAmount}/day`}
                  {asset.pricingType === 'per_use' && `Formula: Fixed Flat Fee ($${asset.priceAmount} / usage cycle)`}
                  {asset.pricingType === 'free' && 'Formula: Neighborhood Gift ($0.00 rate)'}
                </div>
                <div className="text-[11px] text-stone-400">
                  Calculated Duration: {calculation.hours} hours ({calculation.days} calendar days)
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-stone-500">Calculated Total Fee</div>
                <div className="text-xl font-bold text-stone-900 font-mono tabular-nums">
                  ${calculation.totalCost.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Choice (FR-01.4 & FR-03.1) */}
          {asset.pricingType !== 'free' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wide block">
                Select Direct P2P Payment Method (FR-03)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(asset.acceptedPayments === 'cash' || asset.acceptedPayments === 'both') && (
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('cash')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      paymentChoice === 'cash'
                        ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-stone-700 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-stone-900">Cash on Pickup</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">Hand physical currency upon item pickup</div>
                    </div>
                  </button>
                )}

                {(asset.acceptedPayments === 'mobile_banking' || asset.acceptedPayments === 'both') && (
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('mobile_banking')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      paymentChoice === 'mobile_banking'
                        ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-stone-700 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-stone-900">Direct Mobile Banking</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {asset.lenderPaymentDetails.mobileBankingProvider || 'Zelle / Bank'} ({asset.lenderPaymentDetails.mobileBankingHandle || 'Direct'})
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 flex items-center justify-between gap-4 border-t border-stone-200">
            <div className="text-xs text-stone-500">
              {isAuthenticated ? (
                <span>Borrower: <strong className="text-stone-800">{currentUser.name}</strong> ({currentUser.rating.toFixed(1)} ★)</span>
              ) : (
                <span className="text-amber-700 font-medium">Guest mode: Sign in required to complete reservation</span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitRequest}
                disabled={(isAuthenticated && currentUser.isBlacklisted) || !asset.isAvailable}
                className="px-5 py-2.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs"
              >
                {isAuthenticated ? 'Submit Borrow Request' : 'Sign In to Request'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
