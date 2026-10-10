import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  MapPin, 
  Phone, 
  CreditCard,
  CheckCircle2,
  Wrench,
  KeyRound,
  Lock
} from 'lucide-react';

interface AuthModalProps {
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess?: () => void;
  onOpenAdminAuth?: () => void;
}

const NEIGHBORHOODS = [
  'Elmwood Heights',
  'Oakridge North',
  'West Elm Park',
  'Riverdale Commons',
  'Highland Terrace',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  onClose,
  onSuccess,
  onOpenAdminAuth,
}) => {
  const { login, register, setCurrentUserById } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Login form states
  const [loginIdentifier, setLoginIdentifier] = useState('marcus.vance@neighborhood.org');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Register form states (unified Resident who can BOTH borrow and list tools!)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regNeighborhood, setRegNeighborhood] = useState('Elmwood Heights');
  const [regProvider, setRegProvider] = useState('Zelle');
  const [regHandle, setRegHandle] = useState('');
  const [agreePledge, setAgreePledge] = useState(true);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = login(loginIdentifier, loginPassword);
    if (!res.success) {
      setErrorMsg(res.error || 'Login failed.');
      return;
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!agreePledge) {
      setErrorMsg('You must agree to the Neighborhood Non-Consumable & Zero-Deposit Bylaws.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    const res = register({
      name: regName,
      email: regEmail,
      password: regPassword,
      phone: regPhone || '(555) 000-1234',
      neighborhood: regNeighborhood,
      role: 'user', // regular community resident (can both borrow and list tools!)
      mobileBankingProvider: regProvider,
      mobileBankingHandle: regHandle,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Registration failed.');
      return;
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  // 1-Click Resident Demo Profiles
  const handleQuickDemo = (userId: string) => {
    setCurrentUserById(userId);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto">
        {/* Header Tabs */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center font-bold">
              <Wrench className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-center gap-1 bg-stone-200/70 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); }}
                className={`px-3 py-1 rounded-md transition-colors ${
                  mode === 'login' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(''); }}
                className={`px-3 py-1 rounded-md transition-colors ${
                  mode === 'register' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Resident Register
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode 1: Sign In */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
                  Email or Registered Phone
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. marcus.vance@neighborhood.org"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                    Password
                  </label>
                  <span className="text-[11px] text-stone-500 font-mono">Demo: &quot;password123&quot;</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In as Community Member</span>
              </button>

              {/* 1-Click Demo Profiles for Residents */}
              <div className="pt-4 border-t border-stone-100 space-y-2">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider text-center">
                  Quick 1-Click Resident Personas
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('u-lender')}
                    className="p-2 border border-stone-200 rounded-lg bg-stone-50 hover:bg-stone-100 text-left transition-colors"
                  >
                    <div className="font-bold text-stone-900 truncate">Marcus Vance</div>
                    <div className="text-[10px] text-stone-500 truncate">Lists &amp; Borrows</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('u-borrower-good')}
                    className="p-2 border border-stone-200 rounded-lg bg-stone-50 hover:bg-stone-100 text-left transition-colors"
                  >
                    <div className="font-bold text-stone-900 truncate">Sarah Jenkins</div>
                    <div className="text-[10px] text-stone-500 truncate">Reliable (4.95 ★)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('u-borrower-risk')}
                    className="p-2 border border-red-200 rounded-lg bg-red-50/50 hover:bg-red-50 text-left transition-colors"
                  >
                    <div className="font-bold text-red-900 truncate">John Doe</div>
                    <div className="text-[10px] text-red-700 truncate">Red Badge (2.3 ★)</div>
                  </button>
                </div>
              </div>

              <div className="text-center pt-2 text-xs text-stone-500">
                New to the neighborhood?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMsg(''); }}
                  className="font-bold text-stone-900 underline hover:text-stone-700"
                >
                  Register as resident
                </button>
              </div>

              {/* Hidden Admin Access Link */}
              {onOpenAdminAuth && (
                <div className="pt-3 border-t border-stone-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdminAuth();
                    }}
                    className="text-[11px] text-stone-400 hover:text-stone-800 transition-colors flex items-center justify-center gap-1 mx-auto font-mono"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Staff / Administrative Gateway</span>
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* Mode 2: Unified Resident Registration (both lend & borrow) */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  Every resident can <strong>both borrow</strong> tools from neighbors and <strong>list their own equipment for rent</strong> with zero security deposits.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. David Ross"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="e.g. (555) 432-8890"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. david.ross@neighborhood.org"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
                    Neighborhood Sector
                  </label>
                  <select
                    value={regNeighborhood}
                    onChange={(e) => setRegNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
                  >
                    {NEIGHBORHOODS.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Mobile Banking Handle for receiving rental fees */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                <div className="font-bold text-stone-800 uppercase flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-stone-600" />
                  <span>Optional: Payment Receiving Handle (When Lending Tools)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={regProvider}
                    onChange={(e) => setRegProvider(e.target.value)}
                    placeholder="Provider (e.g. Zelle / Venmo)"
                    className="px-2.5 py-1.5 bg-white border border-stone-300 rounded text-xs"
                  />
                  <input
                    type="text"
                    value={regHandle}
                    onChange={(e) => setRegHandle(e.target.value)}
                    placeholder="Handle (e.g. @tag or email)"
                    className="px-2.5 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Community Pledge */}
              <label className="flex items-start gap-2.5 text-xs text-stone-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreePledge}
                  onChange={(e) => setAgreePledge(e.target.checked)}
                  className="mt-0.5 rounded text-stone-900 focus:ring-stone-600"
                />
                <span>
                  I pledge adherence to community non-consumable rules, zero security deposit terms, and timely return accountability under platform bylaws.
                </span>
              </label>

              <button
                type="submit"
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Resident Account</span>
              </button>

              <div className="text-center pt-1 text-xs text-stone-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(''); }}
                  className="font-bold text-stone-900 underline hover:text-stone-700"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
