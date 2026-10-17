import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  User, 
  ShieldCheck, 
  ShieldAlert, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  DollarSign, 
  CheckCircle, 
  LogOut, 
  Edit3,
  Calendar,
  AlertTriangle,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Crown,
  Check
} from 'lucide-react';

interface UserProfileModalProps {
  onClose: () => void;
  onOpenAuth: () => void;
}

const NEIGHBORHOODS = [
  'Elmwood Heights',
  'Oakridge North',
  'West Elm Park',
  'Riverdale Commons',
  'Highland Terrace',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ onClose, onOpenAuth }) => {
  const { 
    currentUser, 
    updateUserProfile, 
    settleAdminFine, 
    logout, 
    isHighRiskBorrower,
    resetUserSecurityPin,
    resetAdminSecurityCode,
    adminSecurityCode
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [neighborhood, setNeighborhood] = useState(currentUser.neighborhood);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Security PIN states
  const [showPin, setShowPin] = useState(false);
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Master Admin Security Code Reset states (only for jahid_hassan1010@uits.edu.bd)
  const isMasterAdmin = currentUser.email.toLowerCase() === 'jahid_hassan1010@uits.edu.bd';
  const [isResettingAdminCode, setIsResettingAdminCode] = useState(false);
  const [newAdminCode, setNewAdminCode] = useState('');
  const [adminCodeMsg, setAdminCodeMsg] = useState('');

  const isRedBadge = isHighRiskBorrower(currentUser);
  const totalCompleted = currentUser.totalBorrowed;
  const onTimePercentage = totalCompleted > 0 
    ? Math.round((currentUser.onTimeReturnCount / totalCompleted) * 100) 
    : 100;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      phone,
      neighborhood,
    });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleResetPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (newPin.trim().length < 4) {
      setPinError('Security PIN must be at least 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match. Please re-enter.');
      return;
    }

    const res = resetUserSecurityPin(currentUser.id, newPin.trim(), currentUser.email);
    if (!res.success) {
      setPinError(res.error || 'Failed to update Security PIN.');
      return;
    }

    setPinSuccess('Security PIN updated successfully.');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => {
      setIsResettingPin(false);
      setPinSuccess('');
    }, 2000);
  };

  const handleResetMasterAdminCode = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCodeMsg('');

    if (newAdminCode.trim().length < 4) {
      setAdminCodeMsg('Admin Security Authorization Code must be at least 4 alphanumeric characters.');
      return;
    }

    const res = resetAdminSecurityCode('jahid_hassan1010@uits.edu.bd', newAdminCode.trim());
    if (!res.success) {
      setAdminCodeMsg(res.error || 'Failed to reset code.');
      return;
    }

    setAdminCodeMsg(`Master Admin Security Code updated to "${newAdminCode.trim()}".`);
    setNewAdminCode('');
    setTimeout(() => {
      setIsResettingAdminCode(false);
      setAdminCodeMsg('');
    }, 2500);
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-stone-700 shrink-0" />
            <div>
              <div className="text-xs font-mono uppercase text-stone-500 tracking-wider">
                COMMUNITY IDENTITY PROFILE
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Resident Account Overview
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Profile details updated successfully.</span>
            </div>
          )}

          {/* User Hero Badge */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            currentUser.isBlacklisted
              ? 'bg-red-50 border-red-300'
              : isRedBadge
              ? 'bg-red-50/40 border-red-200'
              : 'bg-stone-50 border-stone-200'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-stone-900">{currentUser.name}</h4>
                {currentUser.isBlacklisted ? (
                  <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-red-600 text-white">
                    Blacklisted
                  </span>
                ) : isRedBadge ? (
                  <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-red-600 text-white">
                    Red Badge Risk
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-emerald-600 text-white">
                    Reliable Standing
                  </span>
                )}
                {isMasterAdmin && (
                  <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-amber-500 text-stone-950 flex items-center gap-1 shadow-xs">
                    <Crown className="w-3 h-3" />
                    <span>Master Admin</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5 font-mono">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{currentUser.neighborhood}</span>
                <span>·</span>
                <span className="capitalize">{currentUser.role}</span>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-stone-200 sm:pl-4">
              <div className="text-[11px] text-stone-500">Peer Rating</div>
              <div className="text-xl font-bold font-mono text-stone-900 flex items-center sm:justify-end gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{currentUser.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Pending Admin Fine Alert */}
          {currentUser.adminFinePending && currentUser.adminFinePending > 0 ? (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Outstanding Municipal Fine: ${currentUser.adminFinePending}</span>
              </div>
              <p className="text-xs text-amber-800">
                Assessed for platform policy breach or delayed return. Settle to satisfy community compliance.
              </p>
              <button
                onClick={settleAdminFine}
                className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Settle Administrative Fine (${currentUser.adminFinePending})</span>
              </button>
            </div>
          ) : null}

          {/* SECURITY CODE / PIN MANAGEMENT SECTION */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Security Code &amp; Account PIN</span>
              </div>
              {!isResettingPin && (
                <button
                  type="button"
                  onClick={() => setIsResettingPin(true)}
                  className="text-stone-700 hover:text-stone-900 font-semibold text-[11px] flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset PIN</span>
                </button>
              )}
            </div>

            <div className="bg-white p-3 rounded-lg border border-stone-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-stone-500 font-mono">Your Account Security PIN</div>
                <div className="text-sm font-mono font-bold text-stone-900 tracking-widest mt-0.5">
                  {showPin ? (currentUser.securityPin || '4921') : '••••'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="p-1.5 text-stone-500 hover:text-stone-800 rounded hover:bg-stone-100"
                title={showPin ? 'Hide PIN' : 'Reveal PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* PIN Reset Form */}
            {isResettingPin && (
              <form onSubmit={handleResetPin} className="p-3 bg-white rounded-lg border border-amber-200 space-y-2.5">
                <div className="font-semibold text-stone-800 text-[11px]">
                  Set New Security PIN
                </div>

                {pinError && (
                  <div className="p-2 bg-red-50 text-red-700 text-[11px] rounded border border-red-200">
                    {pinError}
                  </div>
                )}
                {pinSuccess && (
                  <div className="p-2 bg-emerald-50 text-emerald-800 text-[11px] rounded border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{pinSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-600 block mb-0.5">New PIN (4+ digits)</label>
                    <input
                      type="password"
                      required
                      maxLength={8}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="e.g. 1234"
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded text-xs font-mono tracking-widest text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-600 block mb-0.5">Confirm PIN</label>
                    <input
                      type="password"
                      required
                      maxLength={8}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="Re-enter"
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded text-xs font-mono tracking-widest text-center"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setIsResettingPin(false); setPinError(''); setPinSuccess(''); }}
                    className="px-2.5 py-1 text-[11px] text-stone-600 hover:text-stone-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-stone-900 text-white rounded text-[11px] font-semibold hover:bg-stone-800"
                  >
                    Save New PIN
                  </button>
                </div>
              </form>
            )}

            {/* Note regarding Master Administrator Authority */}
            <div className="text-[11px] text-stone-500 leading-relaxed">
              Main administrator <strong className="text-stone-800 font-mono">jahid_hassan1010@uits.edu.bd</strong> has master authorization to reset security PINs and authorization codes across accounts.
            </div>

            {/* If currently logged in as Master Admin (jahid_hassan1010@uits.edu.bd), show master admin controls */}
            {isMasterAdmin && (
              <div className="p-3 bg-amber-500/10 border border-amber-300 rounded-lg space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span>Master Admin Security Control</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsResettingAdminCode(!isResettingAdminCode)}
                    className="text-amber-800 hover:text-amber-950 font-semibold text-[11px] underline"
                  >
                    {isResettingAdminCode ? 'Close' : 'Reset Admin Code'}
                  </button>
                </div>

                <div className="text-[11px] text-stone-600">
                  Current Admin Login &amp; Account Opening Code: <strong className="font-mono text-stone-900">{adminSecurityCode}</strong>
                </div>

                {isResettingAdminCode && (
                  <form onSubmit={handleResetMasterAdminCode} className="space-y-2 pt-1">
                    {adminCodeMsg && (
                      <div className="p-2 bg-amber-100 text-amber-900 rounded text-[11px]">
                        {adminCodeMsg}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={newAdminCode}
                        onChange={(e) => setNewAdminCode(e.target.value)}
                        placeholder="New Admin Code (e.g. 2580)"
                        className="flex-1 px-2.5 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold"
                      >
                        Update Master Code
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Historical Track Record & Metrics */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3 text-xs">
            <div className="font-bold text-stone-800 uppercase tracking-wide">
              Lending &amp; Borrowing Metrics
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-white p-2.5 rounded border border-stone-200">
                <div className="text-stone-500 text-[11px]">Total Borrowed</div>
                <div className="text-sm font-bold text-stone-900 font-mono mt-0.5">
                  {currentUser.totalBorrowed}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded border border-stone-200">
                <div className="text-stone-500 text-[11px]">Total Lent Out</div>
                <div className="text-sm font-bold text-stone-900 font-mono mt-0.5">
                  {currentUser.totalLent}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded border border-stone-200">
                <div className="text-stone-500 text-[11px]">On-Time Rate</div>
                <div className="text-sm font-bold text-stone-900 font-mono mt-0.5">
                  {onTimePercentage}%
                </div>
              </div>
              <div className="bg-white p-2.5 rounded border border-stone-200">
                <div className="text-stone-500 text-[11px]">Overdue Count</div>
                <div className="text-sm font-bold text-red-600 font-mono mt-0.5">
                  {currentUser.overdueInstances}
                </div>
              </div>
            </div>

            {/* Flags */}
            <div className="pt-1">
              <span className="text-[11px] text-stone-500 block mb-1">Categorized Community Flags:</span>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                <span className="px-2 py-0.5 bg-stone-200/70 rounded text-stone-700">Late: {currentUser.flags.lateReturn}</span>
                <span className="px-2 py-0.5 bg-stone-200/70 rounded text-stone-700">Payment: {currentUser.flags.paymentIssue}</span>
                <span className="px-2 py-0.5 bg-stone-200/70 rounded text-stone-700">Damage: {currentUser.flags.equipmentDamage}</span>
                <span className="px-2 py-0.5 bg-stone-200/70 rounded text-stone-700">Unresponsive: {currentUser.flags.unresponsive}</span>
              </div>
            </div>
          </div>

          {/* Edit Profile Form or Display */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-3 pt-1 border-t border-stone-200">
              <div className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                Edit Resident Details
              </div>

              <div>
                <label className="text-xs text-stone-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-stone-600 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-stone-600 block mb-1">Neighborhood</label>
                  <select
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded text-xs"
                  >
                    {NEIGHBORHOODS.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 pt-1 border-t border-stone-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 uppercase tracking-wide">Contact Details</span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-stone-600 hover:text-stone-900 flex items-center gap-1 font-medium text-[11px]"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
              </div>
              <div className="text-stone-600 space-y-1">
                <div>Email: <strong className="text-stone-800">{currentUser.email}</strong></div>
                <div>Phone: <strong className="text-stone-800">{currentUser.phone || 'Not configured'}</strong></div>
                <div>Resident Zone: <strong className="text-stone-800">{currentUser.neighborhood}</strong></div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
