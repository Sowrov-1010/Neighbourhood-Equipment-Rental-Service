import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RentalStatus, Asset, UserProfile, DisputeTicket } from '../types';
import { 
  ShieldAlert, 
  Gavel, 
  Activity, 
  Layers, 
  Users, 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  UserX, 
  UserCheck, 
  Search, 
  ExternalLink, 
  LogOut, 
  ChevronRight, 
  Trash2, 
  FileText,
  CreditCard,
  Building2,
  RefreshCw,
  Database,
  Download,
  Copy,
  Terminal,
  Compass,
  Check,
  Server,
  FileCode,
  Radio,
  ShieldCheck,
  MapPin,
  KeyRound,
  Crown,
  Lock
} from 'lucide-react';
import { LaravelDatabaseHubModal } from './LaravelDatabaseHubModal';

interface AdminConsoleLayoutProps {
  onExitToResidentView: () => void;
}

export const AdminConsoleLayout: React.FC<AdminConsoleLayoutProps> = ({ onExitToResidentView }) => {
  const [showDatabaseHub, setShowDatabaseHub] = useState(false);
  const { 
    currentUser, 
    users, 
    assets, 
    rentalRequests, 
    disputes, 
    issueAdminDirective, 
    levyAdminFine, 
    blacklistUser, 
    restoreUserStatus, 
    resolveDispute,
    adminForceTransitionRequest,
    adminDeleteAsset,
    toggleAssetAvailability,
    logout,
    cloudSyncInfo,
    forceCloudResync,
    adminSecurityCode,
    resetAdminSecurityCode,
    resetUserSecurityPin
  } = useApp();

  const [activeModule, setActiveModule] = useState<'overview' | 'lifecycle' | 'disputes' | 'users' | 'catalog' | 'database'>('overview');
  const [selectedTicketId, setSelectedTicketId] = useState<string>(disputes[0]?.id || '');
  const [directiveInput, setDirectiveInput] = useState('Order: Return equipment to owner address within 24 hours.');
  const [fineInput, setFineInput] = useState<number>(35);
  const [searchFilter, setSearchFilter] = useState('');

  // Security Code & PIN Governance states
  const [selectedUserForPinReset, setSelectedUserForPinReset] = useState<UserProfile | null>(null);
  const [targetUserNewPin, setTargetUserNewPin] = useState('');
  const [userPinResetMsg, setUserPinResetMsg] = useState('');
  const [showAdminCodeModal, setShowAdminCodeModal] = useState(false);
  const [masterNewAdminCode, setMasterNewAdminCode] = useState('');
  const [masterAdminCodeStatus, setMasterAdminCodeStatus] = useState('');

  // Database & Spatial Module State (Admin Only)
  const [dbDialect, setDbDialect] = useState<'mysql' | 'postgres'>('mysql');
  const [dbCopied, setDbCopied] = useState(false);
  const [spatialRadius, setSpatialRadius] = useState<number>(5.0);
  const [spatialLat, setSpatialLat] = useState<number>(37.7749);
  const [spatialLng, setSpatialLng] = useState<number>(-122.4194);

  const calcDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Selected ticket for dispute desk
  const selectedTicket = disputes.find(d => d.id === selectedTicketId) || disputes[0];
  const defendant = selectedTicket ? users.find(u => u.id === selectedTicket.defendantId) : null;

  // Platform KPIs
  const totalVolume = rentalRequests.reduce((acc, r) => acc + r.totalCost, 0);
  const activeRentalsCount = rentalRequests.filter(r => r.status === 'active').length;
  const overdueCount = rentalRequests.filter(r => r.status === 'overdue').length;
  const blacklistedCount = users.filter(u => u.isBlacklisted).length;
  const totalFinesLevied = users.reduce((acc, u) => acc + (u.adminFinePending || 0), 0);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Executive Command Header */}
      <header className="bg-stone-900 border-b border-stone-800 h-16 px-6 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">
                District Administration Command Center
              </span>
              <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold">
                Level 4 Oversight
              </span>
            </div>
            <div className="text-[11px] text-stone-400 font-mono">
              Authorized Authority: {currentUser.name} ({currentUser.email})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDatabaseHub(true)}
            className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-amber-500/30"
            title="Export SQL Database dump and inspect Laravel 11 architecture"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>Laravel &amp; DB Hub</span>
          </button>

          <button
            onClick={onExitToResidentView}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border border-stone-700"
            title="Inspect platform from a regular community neighbor view"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Switch to Resident Site</span>
          </button>

          <button
            onClick={logout}
            className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-red-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Dedicated Admin Sidebar (260px) */}
        <aside className="w-64 bg-stone-900/70 border-r border-stone-800 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
              CONTROL MODULES
            </div>

            <button
              onClick={() => setActiveModule('overview')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                activeModule === 'overview' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4" />
                <span>Executive Overview</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
            </button>

            <button
              onClick={() => setActiveModule('lifecycle')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                activeModule === 'lifecycle' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>Process FSM Monitor</span>
              </div>
              <span className="text-[10px] font-mono bg-stone-800 px-1.5 py-0.5 rounded text-stone-300">
                {rentalRequests.length}
              </span>
            </button>

            <button
              onClick={() => setActiveModule('disputes')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                activeModule === 'disputes' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Gavel className="w-4 h-4" />
                <span>Arbitration & Evidence</span>
              </div>
              {disputes.filter(d => d.status !== 'resolved').length > 0 && (
                <span className="text-[10px] font-mono bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded font-bold">
                  {disputes.filter(d => d.status !== 'resolved').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveModule('users')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                activeModule === 'users' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Resident Standing</span>
              </div>
              <span className="text-[10px] font-mono bg-stone-800 px-1.5 py-0.5 rounded text-stone-300">
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveModule('catalog')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                activeModule === 'catalog' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4" />
                <span>Catalog Compliance</span>
              </div>
              <span className="text-[10px] font-mono bg-stone-800 px-1.5 py-0.5 rounded text-stone-300">
                {assets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveModule('database')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                activeModule === 'database' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-amber-400" />
                <span>Laravel &amp; DB Hub</span>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold border border-amber-500/30">
                Spatial
              </span>
            </button>
          </div>

          <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl space-y-1 text-[11px] text-stone-400 font-mono">
            <div className="text-white font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>District Audit Node</span>
            </div>
            <div>Bylaws: Non-Consumable Strict</div>
            <div>Sanctions: Protocol Enforcement Active</div>
          </div>
        </aside>

        {/* Main Admin Working Area */}
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-64px)] space-y-6">
          {/* Module 1: Overview */}
          {activeModule === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    Platform Telemetry & Governance Overview
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Live operational metrics across community equipment leases, active agreements, and user risk classifications.
                  </p>
                </div>
                <div className="text-xs font-mono text-stone-400 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800">
                  Total Managed Volume: ${totalVolume.toFixed(2)}
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400">Active Borrowings</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                    {activeRentalsCount} Active
                  </div>
                  <div className="text-[11px] text-stone-400">Physical handover verified</div>
                </div>

                <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400">Overdue Returns</div>
                  <div className={`text-2xl font-bold font-mono tabular-nums ${overdueCount > 0 ? 'text-red-400' : 'text-stone-300'}`}>
                    {overdueCount} Past Due
                  </div>
                  <div className="text-[11px] text-stone-400">Requiring admin escalation</div>
                </div>

                <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400">Sanctioned Accounts</div>
                  <div className="text-2xl font-bold font-mono text-red-400 tabular-nums">
                    {blacklistedCount} Blacklisted
                  </div>
                  <div className="text-[11px] text-stone-400">Borrowing blocked & listings hidden</div>
                </div>

                <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400">Active Fine Ledger</div>
                  <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
                    ${totalFinesLevied}.00
                  </div>
                  <div className="text-[11px] text-stone-400">Pending settlement with district</div>
                </div>
              </div>

              {/* Quick Actions & Recent Live Transactions Table */}
              <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Recent Platform Lifecycle Processes</span>
                  </h3>
                  <button
                    onClick={() => setActiveModule('lifecycle')}
                    className="text-xs text-amber-400 hover:underline font-mono"
                  >
                    View All ({rentalRequests.length}) &rarr;
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-950 text-stone-400 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="p-2.5">ID / Date</th>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5">Lender</th>
                        <th className="p-2.5">Borrower</th>
                        <th className="p-2.5">FSM State</th>
                        <th className="p-2.5 text-right">Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800 font-mono">
                      {rentalRequests.slice(0, 5).map(req => (
                        <tr key={req.id} className="hover:bg-stone-850">
                          <td className="p-2.5 text-stone-400 text-[11px]">{req.id.slice(0, 10)}</td>
                          <td className="p-2.5 font-bold text-white">{req.assetTitle}</td>
                          <td className="p-2.5 text-stone-300">{req.lenderName}</td>
                          <td className="p-2.5 text-stone-300">{req.borrowerName}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-stone-800 text-amber-400 border border-stone-700">
                              {req.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-bold text-white tabular-nums">${req.totalCost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Module 2: Lifecycle FSM Monitor (Admin can see all processes and intervene!) */}
          {activeModule === 'lifecycle' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    Master Process Lifecycle & State Machine Monitor
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Real-time authoritative supervision of all transactions. Admin can inspect parameters and force-transition states.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search by ID, tool, or resident..."
                    className="px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {rentalRequests
                  .filter(r => !searchFilter || r.assetTitle.toLowerCase().includes(searchFilter.toLowerCase()) || r.borrowerName.toLowerCase().includes(searchFilter.toLowerCase()))
                  .map(req => (
                    <div
                      key={req.id}
                      className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-800 text-xs">
                        <div>
                          <span className="font-mono text-stone-400 text-[11px]">{req.id}</span>
                          <h4 className="text-sm font-bold text-white mt-0.5">{req.assetTitle}</h4>
                          <div className="text-stone-400 mt-0.5">
                            Lender: <strong className="text-stone-200">{req.lenderName}</strong> &middot; Borrower: <strong className="text-stone-200">{req.borrowerName}</strong> ({req.borrowerRating} ★)
                          </div>
                        </div>

                        <div className="sm:text-right space-y-1">
                          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold uppercase bg-stone-800 text-amber-300 border border-stone-700">
                            State: {req.status.replace('_', ' ')}
                          </span>
                          <div className="text-[11px] text-stone-400 font-mono">
                            Duration: {req.durationHours} hrs &middot; Total: ${req.totalCost.toFixed(2)} ({req.paymentMethodChosen})
                          </div>
                        </div>
                      </div>

                      {/* Admin Force Intervention Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                        <span className="text-[11px] font-mono text-stone-400">Admin Authority Intervention:</span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => adminForceTransitionRequest(req.id, 'approved', 'Authorized by administration')}
                            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[11px] font-mono"
                          >
                            Force Approve
                          </button>
                          <button
                            onClick={() => adminForceTransitionRequest(req.id, 'active', 'Physical handover authorized by admin')}
                            className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded text-[11px] font-mono border border-emerald-800"
                          >
                            Force Active
                          </button>
                          <button
                            onClick={() => adminForceTransitionRequest(req.id, 'returned', 'Verified physically returned')}
                            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[11px] font-mono"
                          >
                            Force Returned
                          </button>
                          <button
                            onClick={() => adminForceTransitionRequest(req.id, 'overdue', 'Marked overdue by administrative audit')}
                            className="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-300 rounded text-[11px] font-mono border border-red-800"
                          >
                            Force Overdue
                          </button>
                          <button
                            onClick={() => adminForceTransitionRequest(req.id, 'rejected', 'Cancelled by administration')}
                            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded text-[11px] font-mono"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Module 3: Disputes & Arbitration Desk */}
          {activeModule === 'disputes' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Col: Tickets List (4 cols) */}
              <div className="lg:col-span-4 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
                <div className="p-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-amber-400 uppercase">Complaint Queue ({disputes.length})</span>
                  <span>Evidence Files</span>
                </div>
                <div className="divide-y divide-stone-800 max-h-[500px] overflow-y-auto">
                  {disputes.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedTicketId(d.id)}
                      className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1 ${
                        selectedTicket?.id === d.id ? 'bg-stone-800 border-l-2 border-amber-400' : 'hover:bg-stone-850'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-stone-400">{d.id}</span>
                        <span className="text-amber-400 uppercase font-bold text-[10px]">{d.status.replace('_', ' ')}</span>
                      </div>
                      <div className="text-xs font-bold text-white truncate">{d.reason}</div>
                      <div className="text-[11px] text-stone-400">
                        Defendant: <strong className="text-stone-200">{d.defendantName}</strong>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Col: Arbitration Action Desk (8 cols) */}
              {selectedTicket && (
                <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-5">
                  <div className="flex items-start justify-between pb-3 border-b border-stone-800 gap-2">
                    <div>
                      <div className="text-[11px] font-mono uppercase text-stone-400">
                        Ticket: {selectedTicket.id} &middot; Associated with: {selectedTicket.assetTitle}
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">{selectedTicket.reason}</h3>
                      <div className="text-xs text-stone-400 mt-0.5">
                        Complainant: <strong className="text-white">{selectedTicket.complainantName}</strong> ({selectedTicket.complainantRole}) &middot; Defendant: <strong className="text-white">{selectedTicket.defendantName}</strong>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-mono font-bold uppercase bg-stone-800 text-amber-400 border border-stone-700">
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Statement */}
                  <div className="space-y-1">
                    <span className="text-xs font-mono uppercase text-stone-400 font-bold">Chronological Incident Statement:</span>
                    <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-300 leading-relaxed font-mono">
                      {selectedTicket.details}
                    </div>
                  </div>

                  {/* Evidence Artifacts */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-mono uppercase text-stone-400 font-bold">Attached Evidence Artifacts ({selectedTicket.evidenceAttachments.length}):</span>
                    <div className="space-y-1">
                      {selectedTicket.evidenceAttachments.map((att, i) => (
                        <div key={i} className="p-2 bg-stone-950 border border-stone-800 rounded text-xs text-stone-300 flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{att}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Admin Powers */}
                  <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl space-y-4">
                    <span className="text-xs font-mono uppercase text-amber-400 font-bold block">
                      Enforceable Administrative Powers:
                    </span>

                    {/* Directive */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-stone-300 block">1. Issue Official Binding Order:</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={directiveInput}
                          onChange={(e) => setDirectiveInput(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-700 rounded text-xs text-white focus:outline-none"
                        />
                        <button
                          onClick={() => issueAdminDirective(selectedTicket.id, directiveInput)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded"
                        >
                          Issue Order
                        </button>
                      </div>
                    </div>

                    {/* Fine */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-stone-300 block">2. Assess Statutory Penalty Fine ($):</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={fineInput}
                          onChange={(e) => setFineInput(Number(e.target.value))}
                          className="w-24 px-3 py-1.5 bg-stone-900 border border-stone-700 rounded text-xs text-white font-mono"
                        />
                        <button
                          onClick={() => levyAdminFine(selectedTicket.id, selectedTicket.defendantId, fineInput)}
                          className="px-3 py-1.5 bg-red-900 hover:bg-red-800 text-white text-xs font-bold rounded"
                        >
                          Levy Fine (${fineInput})
                        </button>
                      </div>
                    </div>

                    {/* Blacklisting toggle */}
                    <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Account Status: {selectedTicket.defendantName}</div>
                        <div className="text-[11px] text-stone-400">
                          {defendant?.isBlacklisted ? 'Currently Blacklisted (Sanctioned)' : 'Active Standing'}
                        </div>
                      </div>
                      {defendant?.isBlacklisted ? (
                        <button
                          onClick={() => restoreUserStatus(selectedTicket.defendantId, selectedTicket.id)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-bold"
                        >
                          Lift Blacklist &amp; Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => blacklistUser(selectedTicket.defendantId, 'Willful failure to return neighborhood equipment')}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold"
                        >
                          Enforce Blacklist (Lock Account)
                        </button>
                      )}
                    </div>

                    {/* Mark Resolved */}
                    {selectedTicket.status !== 'resolved' && (
                      <div className="pt-2 border-t border-stone-800 flex justify-end">
                        <button
                          onClick={() => resolveDispute(selectedTicket.id, 'Directives verified completed.')}
                          className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded text-xs font-bold"
                        >
                          Mark Case Resolved
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Module 4: Resident Standing & Blacklist Control */}
          {activeModule === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Resident Standing &amp; Security Governance</h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Neighborhood resident registry, access security PIN reset authority, and disciplinary compliance.
                  </p>
                </div>

                <button
                  onClick={() => setShowAdminCodeModal(true)}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Master Security Code: {adminSecurityCode}</span>
                </button>
              </div>

              {/* Master Admin Authority Banner */}
              <div className="p-4 bg-stone-900 border border-amber-500/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Super Admin Security Clearances</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                        Master: jahid_hassan1010@uits.edu.bd
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Main Administrator has master clearance to reset the administrative login/account opening security code, and reset any resident's private security PIN.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAdminCodeModal(true)}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-bold transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Admin Security Code</span>
                </button>
              </div>

              <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-950 text-stone-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Resident</th>
                      <th className="p-3">Neighborhood</th>
                      <th className="p-3">Rating</th>
                      <th className="p-3">Borrows / Lent</th>
                      <th className="p-3">Security PIN</th>
                      <th className="p-3">Standing</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800 font-mono">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-stone-850">
                        <td className="p-3">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.email === 'jahid_hassan1010@uits.edu.bd' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500 text-stone-950 font-bold">MASTER</span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-400">{u.email}</div>
                        </td>
                        <td className="p-3 text-stone-300">{u.neighborhood}</td>
                        <td className="p-3 font-bold text-amber-400">{u.rating.toFixed(1)} ★</td>
                        <td className="p-3 text-stone-300">{u.totalBorrowed} / {u.totalLent}</td>
                        <td className="p-3 text-stone-400">
                          <span className="bg-stone-950 px-2 py-0.5 rounded border border-stone-800 text-stone-300">
                            {u.securityPin ? `${u.securityPin}` : '••••'}
                          </span>
                        </td>
                        <td className="p-3">
                          {u.isBlacklisted ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                              BLACKLISTED
                            </span>
                          ) : u.rating < 3.0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                              RED BADGE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedUserForPinReset(u);
                                setTargetUserNewPin('');
                                setUserPinResetMsg('');
                              }}
                              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded text-[11px] font-semibold border border-stone-700 flex items-center gap-1"
                              title="Reset resident's security PIN"
                            >
                              <KeyRound className="w-3 h-3 text-amber-400" />
                              <span>Reset PIN</span>
                            </button>

                            {u.isBlacklisted ? (
                              <button
                                onClick={() => restoreUserStatus(u.id)}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-semibold"
                              >
                                Lift
                              </button>
                            ) : (
                              <button
                                onClick={() => blacklistUser(u.id, 'Administrative intervention')}
                                className="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-300 rounded text-[11px] font-semibold border border-red-800"
                              >
                                Blacklist
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal: Reset Resident PIN by Admin */}
              {selectedUserForPinReset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
                  <div className="bg-stone-900 border border-stone-700 rounded-xl p-5 max-w-sm w-full space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-amber-400" />
                        <h4 className="text-sm font-bold text-white">Reset Resident Security PIN</h4>
                      </div>
                      <button onClick={() => setSelectedUserForPinReset(null)} className="text-stone-400 hover:text-white">
                        ✕
                      </button>
                    </div>

                    <div className="text-xs text-stone-300">
                      Resetting PIN for <strong className="text-white">{selectedUserForPinReset.name}</strong> ({selectedUserForPinReset.email})
                    </div>

                    {userPinResetMsg && (
                      <div className="p-2.5 bg-stone-950 border border-amber-500/40 rounded text-xs text-amber-300">
                        {userPinResetMsg}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] text-stone-400 block">New 4-digit Security PIN</label>
                      <input
                        type="text"
                        maxLength={8}
                        value={targetUserNewPin}
                        onChange={(e) => setTargetUserNewPin(e.target.value)}
                        placeholder="e.g. 5566"
                        className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded text-xs font-mono tracking-widest text-white"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedUserForPinReset(null)}
                        className="px-3 py-1.5 text-xs text-stone-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (targetUserNewPin.trim().length < 4) {
                            setUserPinResetMsg('PIN must be at least 4 digits.');
                            return;
                          }
                          const res = resetUserSecurityPin(selectedUserForPinReset.id, targetUserNewPin.trim(), 'jahid_hassan1010@uits.edu.bd');
                          if (res.success) {
                            setUserPinResetMsg(`PIN for ${selectedUserForPinReset.name} reset to ${targetUserNewPin.trim()} successfully!`);
                            setTimeout(() => {
                              setSelectedUserForPinReset(null);
                            }, 1800);
                          } else {
                            setUserPinResetMsg(res.error || 'Failed to reset PIN.');
                          }
                        }}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded"
                      >
                        Save New PIN
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal: Reset Master Admin Security Code */}
              {showAdminCodeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
                  <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 max-w-md w-full space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-amber-400" />
                        <div>
                          <h4 className="text-sm font-bold text-white">Reset Admin Security Authorization Code</h4>
                          <span className="text-[10px] font-mono text-stone-400">Master Authority: jahid_hassan1010@uits.edu.bd</span>
                        </div>
                      </div>
                      <button onClick={() => setShowAdminCodeModal(false)} className="text-stone-400 hover:text-white">
                        ✕
                      </button>
                    </div>

                    {masterAdminCodeStatus && (
                      <div className="p-2.5 bg-stone-950 border border-amber-500/40 rounded text-xs text-amber-300">
                        {masterAdminCodeStatus}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] text-stone-300 block">Current Active Security Code</label>
                      <div className="p-2.5 bg-stone-950 border border-stone-800 rounded font-mono text-amber-400 font-bold text-sm">
                        {adminSecurityCode}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-stone-300 block">Enter New Administrative Security Code</label>
                      <input
                        type="text"
                        maxLength={12}
                        value={masterNewAdminCode}
                        onChange={(e) => setMasterNewAdminCode(e.target.value)}
                        placeholder="e.g. 2580"
                        className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded text-xs font-mono tracking-widest text-white"
                      />
                      <p className="text-[10px] text-stone-400">
                        This code will be required for administrative login and new admin account registrations.
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAdminCodeModal(false)}
                        className="px-3 py-1.5 text-xs text-stone-400 hover:text-white"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (masterNewAdminCode.trim().length < 4) {
                            setMasterAdminCodeStatus('Code must be at least 4 alphanumeric characters.');
                            return;
                          }
                          const res = resetAdminSecurityCode('jahid_hassan1010@uits.edu.bd', masterNewAdminCode.trim());
                          if (res.success) {
                            setMasterAdminCodeStatus(`Admin security code successfully reset to "${masterNewAdminCode.trim()}".`);
                            setTimeout(() => {
                              setShowAdminCodeModal(false);
                              setMasterAdminCodeStatus('');
                              setMasterNewAdminCode('');
                            }, 1800);
                          } else {
                            setMasterAdminCodeStatus(res.error || 'Failed to reset code.');
                          }
                        }}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded"
                      >
                        Confirm &amp; Update Code
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Module 5: Catalog Compliance */}
          {activeModule === 'catalog' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Catalog Inventory &amp; Non-Consumable Auditing</h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Audit tools and household appliances for compliance. Delist or toggle availability if items are damaged or reported.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map(ast => (
                  <div key={ast.id} className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
                    <div className="aspect-16/9 bg-stone-950 rounded-lg overflow-hidden border border-stone-800">
                      <img src={ast.imageUrl} alt={ast.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-stone-400 uppercase">{ast.category} &middot; {ast.condition}</div>
                      <h4 className="text-sm font-bold text-white mt-0.5 line-clamp-1">{ast.title}</h4>
                      <div className="text-xs text-stone-400 font-mono mt-0.5">
                        Owner: {ast.ownerName} &middot; Rate: ${ast.priceAmount} ({ast.pricingType})
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                      <button
                        onClick={() => toggleAssetAvailability(ast.id)}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-semibold ${
                          ast.isAvailable ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {ast.isAvailable ? 'Available' : 'Reserved'}
                      </button>
                      <button
                        onClick={() => adminDeleteAsset(ast.id)}
                        className="p-1.5 text-stone-400 hover:text-red-400 transition-colors"
                        title="Remove / Delist from Catalog"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Module 6: Laravel 11 Backend & Database Engine (Admin Only) */}
          {activeModule === 'database' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold tracking-tight text-white">
                          Laravel 11.x Core Backend &amp; Spatial Database Hub
                        </h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          RESTRICTED TO LEVEL 4 ADMINS
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-800 text-stone-300 border border-stone-700">
                          PHP 8.2+
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-1">
                        MySQL 8.0+ Spatial / PostgreSQL 15+ PostGIS Engine, Eloquent ORM Models &amp; Observers, Laravel Reverb WebSockets, and Task Scheduler.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowDatabaseHub(true)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Terminal className="w-4 h-4" />
                      <span>Launch Full Studio Modal</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Cloud Persistence Status Card */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Live Cloud Auto-Sync Active</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] rounded border border-emerald-500/30 font-semibold">
                        {cloudSyncInfo.status === 'connected' ? 'CONNECTED' : 'SYNCING'}
                      </span>
                    </div>
                    <div className="text-xs text-stone-300 font-mono mt-0.5">
                      GCP Project: <span className="text-emerald-300 font-bold">{cloudSyncInfo.projectId}</span> &middot; DB: <span className="text-stone-400">{cloudSyncInfo.databaseId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="text-[11px] text-stone-400 font-mono">
                    {assets.length} tools &middot; {rentalRequests.length} rentals &middot; {users.length} users synced
                  </span>
                  <a
                    href={`https://console.firebase.google.com/project/${cloudSyncInfo.projectId}/firestore/databases/${cloudSyncInfo.databaseId}/data`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                    title="Open live Cloud Firestore in Firebase Console"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View in Firebase Console</span>
                  </a>
                  <button
                    onClick={() => forceCloudResync()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Now</span>
                  </button>
                </div>
              </div>

              {/* Operating Environment & Technology Stack (8 Pillars) */}
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Server className="w-4 h-4 text-amber-400" />
                      <span>Operating Environment &amp; Technology Stack Specifications</span>
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Production engineering requirements for the Neighborhood Equipment Sharing Platform
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded font-mono text-[11px] font-bold">
                    Admin Hub Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Pillar 1: Core Backend */}
                  <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">1. Core Backend</span>
                      <Server className="w-3.5 h-3.5 text-stone-500" />
                    </div>
                    <div className="text-xs font-bold text-white">PHP 8.2+ / Laravel 11.x</div>
                    <div className="text-[11px] text-stone-400 font-mono leading-relaxed">
                      Robust enterprise PHP foundation with route caching, dependency injection, and strict typing.
                    </div>
                  </div>

                  {/* Pillar 2: Web Client & Frontend */}
                  <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">2. Web Client &amp; Frontend</span>
                      <Layers className="w-3.5 h-3.5 text-stone-500" />
                    </div>
                    <div className="text-xs font-bold text-white">Blade / Vue 3 + Tailwind</div>
                    <div className="text-[11px] text-stone-400 font-mono leading-relaxed">
                      Laravel Blade Templating &amp; Inertia.js responsive UI with zero-pill Tailwind CSS design.
                    </div>
                  </div>

                  {/* Pillar 3: Database & Spatial Engine */}
                  <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">3. Database &amp; Spatial</span>
                      <Compass className="w-3.5 h-3.5 text-stone-500" />
                    </div>
                    <div className="text-xs font-bold text-white">MySQL 8.0+ / PostgreSQL 15+</div>
                    <div className="text-[11px] text-stone-400 font-mono leading-relaxed">
                      PostGIS &amp; ST_Distance_Sphere radial queries for neighborhood proximity search.
                    </div>
                  </div>

                  {/* Pillar 4: ORM & Data Architecture */}
                  <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">4. ORM &amp; Architecture</span>
                      <FileCode className="w-3.5 h-3.5 text-stone-500" />
                    </div>
                    <div className="text-xs font-bold text-white">Eloquent ORM 11.x</div>
                    <div className="text-[11px] text-stone-400 font-mono leading-relaxed">
                      Database Migrations, Seeders, Eloquent Observers, and Model Events for rental audit trails.
                    </div>
                  </div>

                  {/* Pillar 5: Task Scheduling & Queues */}
                  <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">5. Scheduler &amp; Queues</span>
                      <Clock className="w-3.5 h-3.5 text-stone-500" />
                    </div>
                    <div className="text-xs font-bold text-white">Artisan Task Scheduler</div>
                    <div className="text-[11px] text-stone-400 font-mono leading-relaxed">
                      `php artisan schedule:run` for TTL expirations and hourly overdue checks backed by Redis queues.
                    </div>
                  </div>

                  {/* Pillar 6: Real-Time WebSockets */}
                  <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">6. Real-Time WebSockets</span>
                      <Radio className="w-3.5 h-3.5 text-stone-500" />
                    </div>
                    <div className="text-xs font-bold text-white">Laravel Reverb / Pusher</div>
                    <div className="text-[11px] text-stone-400 font-mono leading-relaxed">
                      Live event broadcasting for rental status changes, handover confirmation, and instant alerts.
                    </div>
                  </div>

                  {/* Pillar 7: Authentication & Middleware */}
                  <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">7. Auth &amp; Middleware</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
                    </div>
                    <div className="text-xs font-bold text-white">Sanctum / Breeze Guards</div>
                    <div className="text-[11px] text-stone-400 font-mono leading-relaxed">
                      EnsureUserIsNotBlacklisted middleware guard blocking penalized users from booking or listing.
                    </div>
                  </div>

                  {/* Pillar 8: Mapping & Geospatial API */}
                  <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">8. Geospatial Mapping</span>
                      <MapPin className="w-3.5 h-3.5 text-stone-500" />
                    </div>
                    <div className="text-xs font-bold text-white">Leaflet.js / Mapbox API</div>
                    <div className="text-[11px] text-stone-400 font-mono leading-relaxed">
                      Geospatial marker clustering, circle radiuses, and neighborhood boundary polygon visualizations.
                    </div>
                  </div>
                </div>
              </div>

              {/* Spatial Radial Query Simulator */}
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Compass className="w-4 h-4 text-amber-400" />
                      <span>Live ST_Distance_Sphere Radial Neighborhood Query</span>
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Test neighborhood radius filtering using geodesic sphere calculations.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 3, 5, 10, 20].map((r) => (
                      <button
                        key={r}
                        onClick={() => setSpatialRadius(r)}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                          spatialRadius === r 
                            ? 'bg-amber-500 text-stone-950 font-bold' 
                            : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                        }`}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spatial SQL Query Sample */}
                <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 font-mono text-[11px] text-amber-300/90 overflow-x-auto">
                  SELECT id, name, category, daily_rate, <br />
                  &nbsp;&nbsp;ROUND(ST_Distance_Sphere(location_point, POINT({spatialLng}, {spatialLat})) / 1000, 2) AS distance_km <br />
                  FROM tools <br />
                  WHERE is_available = 1 <br />
                  HAVING distance_km &lt;= {spatialRadius} <br />
                  ORDER BY distance_km ASC;
                </div>

                {/* Results from live memory simulation */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-mono">
                    Matches within {spatialRadius}km radius of [{spatialLat.toFixed(4)}, {spatialLng.toFixed(4)}]:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {assets
                      .map(a => {
                        const owner = users.find(u => u.id === a.ownerId);
                        const aLat = owner?.coordinates?.lat ?? (37.7749 + (a.distanceKm * 0.007));
                        const aLng = owner?.coordinates?.lng ?? (-122.4194 + (a.distanceKm * 0.007));
                        const dist = calcDist(spatialLat, spatialLng, aLat, aLng);
                        return { ...a, dist };
                      })
                      .filter(a => a.dist <= spatialRadius)
                      .sort((a, b) => a.dist - b.dist)
                      .map(a => (
                        <div key={a.id} className="p-3 bg-stone-950 border border-stone-800 rounded-lg flex items-center justify-between">
                          <div className="truncate pr-2">
                            <div className="text-xs font-bold text-white truncate">{a.title}</div>
                            <div className="text-[10px] text-stone-400 font-mono truncate">{a.neighborhood} &middot; {a.ownerName}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-bold text-amber-400">{a.dist.toFixed(2)} km</span>
                            <div className="text-[9px] text-stone-500 font-mono">{Math.round(a.dist * 1000)}m away</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Database Schema & SQL Export Section */}
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-amber-400" />
                      <span>Production Database DDL &amp; Migration Schemas</span>
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Ready for direct import into MySQL 8.0 Workbench, phpMyAdmin, or PostgreSQL psql.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-lg bg-stone-950 p-1 border border-stone-800">
                      <button
                        onClick={() => setDbDialect('mysql')}
                        className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                          dbDialect === 'mysql' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        MySQL 8.0 Spatial
                      </button>
                      <button
                        onClick={() => setDbDialect('postgres')}
                        className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                          dbDialect === 'postgres' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        PostgreSQL PostGIS
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        const sql = dbDialect === 'mysql' 
                          ? `-- MySQL 8.0 Schema Export\nCREATE DATABASE IF NOT EXISTS neighborhood_equip;\nUSE neighborhood_equip;\n\nCREATE TABLE users (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120), email VARCHAR(191) UNIQUE, role ENUM('resident','admin') DEFAULT 'resident', is_blacklisted TINYINT(1) DEFAULT 0, latitude DECIMAL(10,7), longitude DECIMAL(10,7));\n\nCREATE TABLE tools (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, owner_id BIGINT UNSIGNED NOT NULL, name VARCHAR(150), category VARCHAR(60), daily_rate DECIMAL(8,2), location_point POINT NOT NULL, SPATIAL INDEX idx_tool_spatial (location_point));\n\nCREATE TABLE rental_requests (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, tool_id BIGINT UNSIGNED NOT NULL, borrower_id BIGINT UNSIGNED NOT NULL, lender_id BIGINT UNSIGNED NOT NULL, status ENUM('requested','payment_authorized','active_rental','return_pending','completed','disputed') DEFAULT 'requested', total_amount DECIMAL(8,2));`
                          : `-- PostgreSQL 15 PostGIS Export\nCREATE EXTENSION IF NOT EXISTS postgis;\nCREATE TABLE users (id BIGSERIAL PRIMARY KEY, name VARCHAR(120), email VARCHAR(191) UNIQUE, role VARCHAR(20) DEFAULT 'resident', is_blacklisted BOOLEAN DEFAULT FALSE);\nCREATE TABLE tools (id BIGSERIAL PRIMARY KEY, owner_id BIGINT NOT NULL, name VARCHAR(150), location_point GEOMETRY(Point, 4326) NOT NULL);\nCREATE INDEX idx_tools_geom ON tools USING GIST (location_point);\nCREATE TABLE rental_requests (id BIGSERIAL PRIMARY KEY, tool_id BIGINT NOT NULL, borrower_id BIGINT NOT NULL, lender_id BIGINT NOT NULL, status VARCHAR(30) DEFAULT 'requested');`;
                        navigator.clipboard.writeText(sql);
                        setDbCopied(true);
                        setTimeout(() => setDbCopied(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 border border-stone-700"
                    >
                      {dbCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{dbCopied ? 'Copied' : 'Copy DDL'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 font-mono text-xs text-stone-300 max-h-64 overflow-y-auto leading-relaxed">
                  <pre className="text-amber-400/90">
{dbDialect === 'mysql' ? `-- MySQL 8.0+ Production Schema with Spatial Point & ST_Distance_Sphere
CREATE DATABASE IF NOT EXISTS neighborhood_tool_share;
USE neighborhood_tool_share;

CREATE TABLE tools (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(60) NOT NULL,
  pricing_type ENUM('free_community', 'daily_rate', 'hourly_rate') NOT NULL,
  daily_rate DECIMAL(8,2) DEFAULT 0.00,
  condition ENUM('pristine', 'good', 'fair', 'heavy_duty') DEFAULT 'good',
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  location_point POINT NOT NULL /*!80003 SRID 4326 */,
  is_available TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  SPATIAL INDEX idx_tool_spatial (location_point),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Spatial Search Procedure
-- SELECT id, name, ROUND(ST_Distance_Sphere(location_point, POINT(lon, lat)) / 1000, 2) AS distance_km
-- FROM tools HAVING distance_km <= 5.0 ORDER BY distance_km ASC;` : `-- PostgreSQL 15+ with PostGIS Spatial Extension
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE tools (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(60) NOT NULL,
  daily_rate NUMERIC(8,2) DEFAULT 0.00,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  location_geom GEOMETRY(Point, 4326) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tools_postgis ON tools USING GIST (location_geom);

-- Geodesic query:
-- SELECT id, name, ST_Distance(location_geom::geography, ST_MakePoint(lon, lat)::geography) / 1000 AS dist_km
-- FROM tools WHERE ST_DWithin(location_geom::geography, ST_MakePoint(lon, lat)::geography, 5000);`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showDatabaseHub && (
        <LaravelDatabaseHubModal onClose={() => setShowDatabaseHub(false)} />
      )}
    </div>
  );
};
