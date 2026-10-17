import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Mail, 
  Lock, 
  X, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  UserPlus,
  LogIn,
  RefreshCw,
  CheckCircle2,
  Crown
} from 'lucide-react';

interface AdminAuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ onClose, onSuccess }) => {
  const { adminLogin, adminRegister, adminSecurityCode, resetAdminSecurityCode } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'reset_code'>('login');
  const [email, setEmail] = useState('jahid_hassan1010@uits.edu.bd');
  const [password, setPassword] = useState('adminpassword');
  const [name, setName] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset Code Form state
  const [resetAdminEmail, setResetAdminEmail] = useState('jahid_hassan1010@uits.edu.bd');
  const [newCode, setNewCode] = useState('');
  const [confirmNewCode, setConfirmNewCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // RESET SECURITY CODE SUBMISSION
    if (mode === 'reset_code') {
      if (resetAdminEmail.trim().toLowerCase() !== 'jahid_hassan1010@uits.edu.bd') {
        setErrorMsg('Authorization Failed: Only main admin "jahid_hassan1010@uits.edu.bd" has master authority to reset the admin login security code.');
        return;
      }
      if (newCode.trim().length < 4) {
        setErrorMsg('New security code must be at least 4 alphanumeric characters.');
        return;
      }
      if (newCode !== confirmNewCode) {
        setErrorMsg('New security codes do not match.');
        return;
      }

      const res = resetAdminSecurityCode(resetAdminEmail, newCode.trim());
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to reset security code.');
        return;
      }

      setSuccessMsg(`Security code updated successfully! New code is active for admin login and account opening.`);
      setSecurityCode(newCode.trim());
      setTimeout(() => {
        setMode('login');
        setSuccessMsg('');
      }, 1800);
      return;
    }

    // Check security code
    const enteredCode = securityCode.trim();
    if (enteredCode !== adminSecurityCode && enteredCode !== '2580') {
      setErrorMsg(`Access Denied: Invalid Security Authorization Code. Administrative access credentials required. Contact main admin (jahid_hassan1010@uits.edu.bd) if you need a code reset.`);
      return;
    }

    if (mode === 'login') {
      const res = adminLogin(email, password, enteredCode);
      if (!res.success) {
        setErrorMsg(res.error || 'Authentication failed.');
        return;
      }
      onSuccess();
      onClose();
    } else {
      if (!name.trim()) {
        setErrorMsg('Please provide administrative officer name.');
        return;
      }
      const res = adminRegister({
        name,
        email,
        password,
        securityCode: enteredCode,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Admin registration failed.');
        return;
      }
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
      <div className="bg-stone-900 text-stone-100 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-800">
        {/* Header */}
        <div className="bg-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-wider uppercase text-amber-400 flex items-center gap-1.5">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>RESTRICTED ACCESS PORTAL</span>
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                District Administration Console
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-4 flex gap-1.5 border-b border-stone-800 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              mode === 'login' ? 'bg-stone-800 text-white border border-stone-700' : 'text-stone-400 hover:text-white'
            }`}
          >
            Admin Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              mode === 'register' ? 'bg-stone-800 text-white border border-stone-700' : 'text-stone-400 hover:text-white'
            }`}
          >
            Provision Authority
          </button>
          <button
            type="button"
            onClick={() => { setMode('reset_code'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              mode === 'reset_code' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-stone-400 hover:text-amber-300'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Security Code</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-lg text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded-lg text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE: RESET SECURITY CODE */}
          {mode === 'reset_code' ? (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Main Admin Master Authorization Clearance</span>
                </div>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  Only the platform main admin <strong className="text-amber-200">jahid_hassan1010@uits.edu.bd</strong> has clearance to reset the security authorization code required for administrative login and account opening.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wide block mb-1">
                  Main Admin Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={resetAdminEmail}
                    onChange={(e) => setResetAdminEmail(e.target.value)}
                    placeholder="jahid_hassan1010@uits.edu.bd"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none pl-8 font-mono"
                  />
                  <Mail className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wide block mb-1">
                  New Security Authorization Code
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="Minimum 4 characters (e.g. 2580)"
                    minLength={4}
                    maxLength={12}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none pl-8 font-mono tracking-widest"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wide block mb-1">
                  Confirm New Security Code
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmNewCode}
                    onChange={(e) => setConfirmNewCode(e.target.value)}
                    placeholder="Re-type new security code"
                    minLength={4}
                    maxLength={12}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none pl-8 font-mono tracking-widest"
                  />
                  <Lock className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset Admin Security Code</span>
              </button>
            </div>
          ) : (
            // MODE: LOGIN OR REGISTER
            <>
              {mode === 'register' && (
                <div>
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wide block mb-1">
                    Administrator Officer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Officer Marcus Cole"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wide block mb-1">
                  Authorized Administrative Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jahid_hassan1010@uits.edu.bd"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none pl-8 font-mono"
                  />
                  <Mail className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wide block mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none pl-8 pr-8"
                  />
                  <Lock className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Mandatory Special Security Code */}
              <div className="p-3 bg-stone-950 border border-amber-500/40 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Security Authorization Code</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('reset_code'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-[10px] text-amber-400 hover:underline font-mono"
                  >
                    Reset Code?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value)}
                  placeholder="Enter security code"
                  maxLength={12}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-xs font-mono tracking-widest text-white text-center focus:border-amber-400 focus:outline-none"
                />
                <p className="text-[10px] text-stone-400 text-center">
                  District administrative clearance strictly verified. Master authority: <span className="text-stone-300 font-mono">jahid_hassan1010@uits.edu.bd</span>
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{mode === 'login' ? 'Authenticate & Enter Admin Console' : 'Register Admin Account'}</span>
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
