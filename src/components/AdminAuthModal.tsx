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
  LogIn
} from 'lucide-react';

interface AdminAuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ onClose, onSuccess }) => {
  const { adminLogin, adminRegister } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('admin.desk@neighborhood.org');
  const [password, setPassword] = useState('adminpassword');
  const [name, setName] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (securityCode.trim() !== '2580') {
      setErrorMsg('Access Denied: Invalid Security Authorization Code. Administrative access credentials required.');
      return;
    }

    if (mode === 'login') {
      const res = adminLogin(email, password, securityCode);
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
        securityCode,
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
              <div className="text-[10px] font-mono tracking-wider uppercase text-amber-400">
                RESTRICTED ACCESS PORTAL
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
        <div className="px-6 pt-4 flex gap-2 border-b border-stone-800 pb-3">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              mode === 'login' ? 'bg-stone-800 text-white border border-stone-700' : 'text-stone-400 hover:text-white'
            }`}
          >
            Admin Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              mode === 'register' ? 'bg-stone-800 text-white border border-stone-700' : 'text-stone-400 hover:text-white'
            }`}
          >
            Provision Admin Authority
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-lg text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

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
              Authorized Email / Gmail
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin.desk@neighborhood.org"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none pl-8"
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
              <span className="text-[10px] text-stone-400 font-mono">Confidential</span>
            </div>
            <input
              type="password"
              required
              value={securityCode}
              onChange={(e) => setSecurityCode(e.target.value)}
              placeholder="Enter security code"
              maxLength={10}
              className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-xs font-mono tracking-widest text-white text-center focus:border-amber-400 focus:outline-none"
            />
            <p className="text-[10px] text-stone-400 text-center">
              District administrative clearance verification is strictly required for access.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>{mode === 'login' ? 'Authenticate & Enter Admin Console' : 'Register Admin Account'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
