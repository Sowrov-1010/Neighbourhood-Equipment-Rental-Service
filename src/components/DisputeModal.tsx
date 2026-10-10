import React, { useState } from 'react';
import { RentalRequest } from '../types';
import { useApp } from '../context/AppContext';
import { X, AlertTriangle, Paperclip, Plus, Trash2, ShieldAlert } from 'lucide-react';

interface DisputeModalProps {
  request: RentalRequest;
  onClose: () => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({ request, onClose }) => {
  const { fileDisputeTicket, currentUser } = useApp();

  const isLender = currentUser.id === request.lenderId;
  const defendantId = isLender ? request.borrowerId : request.lenderId;
  const defendantName = isLender ? request.borrowerName : request.lenderName;

  const [reason, setReason] = useState('Item Not Returned After Agreed Deadline');
  const [details, setDetails] = useState('');
  const [evidenceItems, setEvidenceItems] = useState<string[]>([
    'Chat transcript showing missed drop-off commitment',
    'Unanswered phone call log / timestamped SMS reminders',
  ]);
  const [newEvidence, setNewEvidence] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddEvidence = () => {
    if (!newEvidence.trim()) return;
    setEvidenceItems(prev => [...prev, newEvidence.trim()]);
    setNewEvidence('');
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      setErrorMsg('Please provide a detailed chronological description of the issue.');
      return;
    }
    if (evidenceItems.length === 0) {
      setErrorMsg('Administrative bylaws require at least one piece of verifiable evidence.');
      return;
    }

    fileDisputeTicket({
      rentalId: request.id,
      defendantId,
      defendantName,
      reason,
      details,
      evidenceAttachments: evidenceItems,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <div className="text-xs font-mono uppercase text-amber-800 tracking-wider">
                ADMINISTRATIVE COMPLAINT (FR-06.1)
              </div>
              <h3 className="text-base font-bold text-stone-900">
                File Dispute Ticket
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs space-y-1">
            <div className="font-semibold text-stone-800">
              Dispute Against: <span className="font-bold text-stone-900">{defendantName}</span>
            </div>
            <div className="text-stone-500 font-mono">
              Rental ID: {request.id} · Item: {request.assetTitle}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
              Primary Dispute Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
            >
              <option value="Item Not Returned After Agreed Deadline">Item Not Returned After Agreed Deadline</option>
              <option value="Borrower Unresponsive / Refusing Physical Drop-off">Borrower Unresponsive / Refusing Physical Drop-off</option>
              <option value="Equipment Damaged or Missing Core Attachments">Equipment Damaged or Missing Core Attachments</option>
              <option value="Payment Refusal or Falsified Banking Txn ID">Payment Refusal or Falsified Banking Txn ID</option>
              <option value="Lender Cancelled Without Valid Cause After Handover">Lender Cancelled Without Valid Cause After Handover</option>
              <option value="Neighborhood Safety / Harassment Concern">Neighborhood Safety / Harassment Concern</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
              Detailed Statement & Chronology
            </label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explain exactly what happened, dates/times contacted, and current status of the equipment..."
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs leading-relaxed focus:ring-1 focus:ring-stone-600 focus:outline-none"
            />
          </div>

          {/* Evidence Attachments (FR-06.1 mandatory) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wide flex items-center justify-between">
              <span>Attached Verifiable Evidence (FR-06.1)</span>
              <span className="text-[11px] font-normal text-stone-500">Mandatory</span>
            </label>

            <div className="space-y-1.5">
              {evidenceItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-stone-50 rounded border border-stone-200 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate text-stone-700">{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEvidence(idx)}
                    className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newEvidence}
                onChange={(e) => setNewEvidence(e.target.value)}
                placeholder="Add attachment description or screenshot reference..."
                className="flex-1 px-3 py-1.5 bg-white border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddEvidence}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="text-xs text-red-600 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              Submit Ticket to Administration Desk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
