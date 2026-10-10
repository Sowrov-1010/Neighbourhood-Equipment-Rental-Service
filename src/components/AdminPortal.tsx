import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldAlert, 
  FileText, 
  Gavel, 
  DollarSign, 
  UserX, 
  UserCheck, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Paperclip,
  Activity,
  Layers
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { 
    disputes, 
    users, 
    assets, 
    rentalRequests, 
    issueAdminDirective, 
    levyAdminFine, 
    blacklistUser, 
    restoreUserStatus, 
    resolveDispute 
  } = useApp();

  const [selectedTicketId, setSelectedTicketId] = useState<string>(disputes[0]?.id || '');
  const [directiveText, setDirectiveText] = useState('Order: Return equipment to Lender address within 24 hours or face statutory fine.');
  const [fineAmount, setFineAmount] = useState<number>(35);
  const [blacklistReason, setBlacklistReason] = useState('Refusal to comply with administrative return order and willful detention of neighborhood asset.');

  const selectedTicket = disputes.find(d => d.id === selectedTicketId) || disputes[0];
  const defendantUser = selectedTicket ? users.find(u => u.id === selectedTicket.defendantId) : null;
  const complainantUser = selectedTicket ? users.find(u => u.id === selectedTicket.complainantId) : null;

  // Platform Metrics (NFR-03 & System Overview)
  const totalAssetsCount = assets.length;
  const activeRentalsCount = rentalRequests.filter(r => r.status === 'active').length;
  const blacklistedUsersCount = users.filter(u => u.isBlacklisted).length;
  const pendingDisputesCount = disputes.filter(d => d.status !== 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Admin Header & Platform KPI bar */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 shadow-sm border border-stone-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
              <Gavel className="w-4 h-4" />
              <span>DISTRICT ADMINISTRATIVE COMMAND & DISPUTE DESK (FR-06)</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mt-1">
              Arbitration & Blacklisting Resolution Panel
            </h1>
          </div>
          <div className="text-xs font-mono bg-stone-800 px-3 py-1.5 rounded-lg text-stone-300">
            Officer: Eleanor Cross · District Municipal Oversight
          </div>
        </div>

        {/* Real-time Platform Health Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5">
          <div className="bg-stone-850 p-3 rounded-xl border border-stone-800">
            <div className="text-[11px] text-stone-400 font-medium">Catalog Assets</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">{totalAssetsCount} Listed</div>
          </div>
          <div className="bg-stone-850 p-3 rounded-xl border border-stone-800">
            <div className="text-[11px] text-stone-400 font-medium">Active Borrows</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{activeRentalsCount} Ongoing</div>
          </div>
          <div className="bg-stone-850 p-3 rounded-xl border border-stone-800">
            <div className="text-[11px] text-stone-400 font-medium">Open Complaint Tickets</div>
            <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">{pendingDisputesCount} Pending</div>
          </div>
          <div className="bg-stone-850 p-3 rounded-xl border border-stone-800">
            <div className="text-[11px] text-stone-400 font-medium">Sanctioned / Blacklisted</div>
            <div className="text-lg font-bold text-red-400 font-mono mt-0.5">{blacklistedUsersCount} Accounts</div>
          </div>
        </div>
      </div>

      {/* Main Dispute Handling Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Tickets Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 uppercase tracking-wide">
              Dispute Queue ({disputes.length})
            </span>
            <span className="text-[11px] text-stone-500 font-mono">FSM Audit Trail</span>
          </div>

          <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
            {disputes.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                No disputes filed. Community is operating smoothly.
              </div>
            ) : (
              disputes.map(ticket => {
                const isSelected = ticket.id === selectedTicket?.id;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`w-full text-left p-4 transition-colors flex flex-col gap-1.5 ${
                      isSelected ? 'bg-amber-50/60 border-l-4 border-l-amber-600' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-stone-500 text-[11px]">{ticket.id}</span>
                      <span className={`text-[10px] font-bold uppercase font-mono px-1.5 py-0.5 rounded ${
                        ticket.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ticket.status === 'penalized'
                          ? 'bg-red-100 text-red-800'
                          : ticket.status === 'directive_issued'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-200 text-stone-800'
                      }`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-stone-900 line-clamp-1">
                      {ticket.reason}
                    </div>

                    <div className="text-[11px] text-stone-600 line-clamp-1">
                      Against: <strong className="text-stone-800">{ticket.defendantName}</strong> by {ticket.complainantName}
                    </div>

                    <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                      {new Date(ticket.createdAt).toLocaleDateString()} · Item: {ticket.assetTitle}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Ticket Investigation & Action Desk (8 cols) */}
        {selectedTicket ? (
          <div className="lg:col-span-8 bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs p-6 space-y-6">
            {/* Ticket Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
              <div>
                <div className="text-xs font-mono text-stone-500 uppercase">
                  Ticket #{selectedTicket.id} · Filed {new Date(selectedTicket.createdAt).toLocaleString()}
                </div>
                <h2 className="text-lg font-bold text-stone-900 mt-0.5">
                  {selectedTicket.reason}
                </h2>
                <div className="text-xs text-stone-600 mt-0.5">
                  Associated Item: <strong className="text-stone-800">{selectedTicket.assetTitle}</strong> (Rental ID: {selectedTicket.rentalId})
                </div>
              </div>

              <span className={`self-start sm:self-center px-2.5 py-1 rounded text-xs font-bold font-mono uppercase ${
                selectedTicket.status === 'resolved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : selectedTicket.status === 'penalized'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                Status: {selectedTicket.status.replace('_', ' ')}
              </span>
            </div>

            {/* Parties Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs space-y-1">
                <span className="text-[11px] text-stone-500 uppercase font-mono block">Complainant (Reporting Party)</span>
                <div className="font-bold text-stone-900">{selectedTicket.complainantName}</div>
                <div className="text-stone-600 capitalize">Role: {selectedTicket.complainantRole}</div>
              </div>

              <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                defendantUser?.isBlacklisted ? 'bg-red-50 border-red-200' : 'bg-stone-50 border-stone-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-500 uppercase font-mono">Defendant (Accused Party)</span>
                  {defendantUser?.isBlacklisted && (
                    <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded">
                      Currently Blacklisted
                    </span>
                  )}
                </div>
                <div className="font-bold text-stone-900 flex items-center gap-1.5">
                  <span>{selectedTicket.defendantName}</span>
                  <span className="text-stone-500 font-normal">({defendantUser?.rating.toFixed(1)} ★)</span>
                </div>
                <div className="text-stone-600">
                  Late Return Flags: {defendantUser?.flags.lateReturn || 0} · Overdue Count: {defendantUser?.overdueInstances || 0}
                </div>
                {defendantUser?.adminFinePending ? (
                  <div className="text-red-700 font-bold font-mono">
                    Pending Administrative Fine: ${defendantUser.adminFinePending}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Chronological Details */}
            <div>
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                Case Statement & Incident Chronology
              </h4>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-700 leading-relaxed">
                {selectedTicket.details}
              </div>
            </div>

            {/* Mandatory Evidence Attachments (FR-06.1) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-stone-500" />
                <span>Attached Evidence Artifacts (FR-06.1)</span>
              </h4>
              <div className="space-y-1.5">
                {selectedTicket.evidenceAttachments.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-stone-50 rounded border border-stone-200 text-xs text-stone-700 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 font-mono text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Directives & Orders */}
            {selectedTicket.adminDirective && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-xs space-y-1">
                <div className="font-bold text-amber-900 uppercase flex items-center gap-1.5">
                  <Gavel className="w-4 h-4 text-amber-700" />
                  <span>Administrative Binding Directive Issued (FR-06.2)</span>
                </div>
                <p className="text-amber-800 font-mono">
                  &ldquo;{selectedTicket.adminDirective}&rdquo;
                </p>
                {selectedTicket.adminFineLevied ? (
                  <div className="text-red-700 font-bold font-mono pt-1">
                    Administrative Fine Assessed: ${selectedTicket.adminFineLevied}.00
                  </div>
                ) : null}
              </div>
            )}

            {/* Administrative Action Center (FR-06.2, FR-06.3, FR-06.4, FR-06.5) */}
            <div className="pt-4 border-t border-stone-200 space-y-4">
              <div className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                Admin Powers & Enforcement Actions
              </div>

              {/* Action 1: Issue Binding Directive (FR-06.2) */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <label className="text-xs font-semibold text-stone-800 block">
                  1. Issue Official Administrative Order / Directive (FR-06.2)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={directiveText}
                    onChange={(e) => setDirectiveText(e.target.value)}
                    placeholder="e.g. Return item within 24 hours or settle fee"
                    className="flex-1 px-3 py-1.5 bg-white border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
                  />
                  <button
                    onClick={() => issueAdminDirective(selectedTicket.id, directiveText)}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded transition-colors whitespace-nowrap"
                  >
                    Issue Order
                  </button>
                </div>
              </div>

              {/* Action 2: Levy Administrative Fine (FR-06.4) */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <label className="text-xs font-semibold text-stone-800 block">
                  2. Levy Administrative Penalty Fine (FR-06.4)
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-stone-500 font-mono">$</span>
                    <input
                      type="number"
                      value={fineAmount}
                      onChange={(e) => setFineAmount(Number(e.target.value))}
                      className="w-20 px-2 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono focus:ring-1 focus:ring-stone-600 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => levyAdminFine(selectedTicket.id, selectedTicket.defendantId, fineAmount)}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1.5"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Assess Fine (${fineAmount})</span>
                  </button>
                </div>
                <div className="text-[11px] text-stone-500">
                  Levies a punitive platform fine on the delinquent user account for mismanagement or detention.
                </div>
              </div>

              {/* Action 3: Blacklisting or Relisting / Restoration (FR-06.3 & FR-06.5) */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div className="text-xs font-semibold text-stone-800">
                  3. Account Standing & Blacklisting Controls (FR-06.3 & FR-06.5)
                </div>

                {defendantUser?.isBlacklisted ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-stone-200">
                    <div>
                      <div className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                        <UserX className="w-4 h-4" />
                        <span>User Currently Blacklisted</span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        Reason: {defendantUser.blacklistedReason}
                      </div>
                    </div>
                    <button
                      onClick={() => restoreUserStatus(selectedTicket.defendantId, selectedTicket.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Lift Blacklist & Relist Profile (FR-06.5)</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={blacklistReason}
                      onChange={(e) => setBlacklistReason(e.target.value)}
                      placeholder="Specify reason for blacklisting..."
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
                    />
                    <button
                      onClick={() => blacklistUser(selectedTicket.defendantId, blacklistReason)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Enforce Blacklist (Block Borrowing & Hide Listings)</span>
                    </button>
                    <div className="text-[11px] text-stone-500">
                      Locks borrower capability and immediately removes all owner listings from search catalogs.
                    </div>
                  </div>
                )}
              </div>

              {/* Close / Resolve Dispute */}
              {selectedTicket.status !== 'resolved' && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => resolveDispute(selectedTicket.id, 'Terms fulfilled and item verified returned.')}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Mark Case Fully Resolved</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
