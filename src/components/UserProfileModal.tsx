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
  AlertTriangle
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
  const { currentUser, updateUserProfile, settleAdminFine, logout, isHighRiskBorrower } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [neighborhood, setNeighborhood] = useState(currentUser.neighborhood);
  const [savedSuccess, setSavedSuccess] = useState(false);

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

          {/* Pending Admin Fine Alert & Settle Action (FR-06.4) */}
          {currentUser.adminFinePending && currentUser.adminFinePending > 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Pending Administrative Fine</span>
                </div>
                <span className="text-base font-bold font-mono text-red-700">
                  ${currentUser.adminFinePending}.00
                </span>
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

          {/* Historical Track Record & Metrics */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3 text-xs">
            <div className="font-bold text-stone-800 uppercase tracking-wide">
              Lending & Borrowing Metrics
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
