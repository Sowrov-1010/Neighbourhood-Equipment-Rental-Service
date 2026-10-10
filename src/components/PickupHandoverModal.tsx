import React, { useState } from 'react';
import { RentalRequest } from '../types';
import { useApp } from '../context/AppContext';
import { X, FileCheck, CheckSquare, Shield, PenTool, CheckCircle } from 'lucide-react';

interface PickupHandoverModalProps {
  request: RentalRequest;
  onClose: () => void;
}

export const PickupHandoverModal: React.FC<PickupHandoverModalProps> = ({ request, onClose }) => {
  const { signHandoverChecklist, currentUser } = useApp();

  const [checklist, setChecklist] = useState({
    operationalTest: true,
    cordsAndHousingIntact: true,
    attachmentsIncluded: true,
    zeroDepositAcknowledged: true,
    returnDeadlinePledge: true,
  });

  const allChecked = Object.values(checklist).every(Boolean);

  const handleSign = () => {
    signHandoverChecklist(request.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200">
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono uppercase text-stone-500 tracking-wider">
              DIGITAL RENTAL AGREEMENT (FR-09)
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">
              Pickup Condition Verification
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Agreement Text Card */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs text-stone-700 leading-relaxed font-mono">
            <div className="font-bold text-stone-900 uppercase">
              Standard Community Lending Contract
            </div>
            <p>
              By proceeding with this physical item handover of <strong>{request.assetTitle}</strong> between Lender (<strong>{request.lenderName}</strong>) and Borrower (<strong>{request.borrowerName}</strong>), both parties agree that:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-stone-600 text-[11px]">
              <li>No security deposit or financial hold has been retained by the platform or lender.</li>
              <li>Borrower agrees to operate the equipment safely and return it by <strong>{new Date(request.endDate).toLocaleString()}</strong> in clean condition.</li>
              <li>Lender verifies that the equipment is provided in sound, operational state.</li>
              <li>Failure to return on time may trigger administrative dispute ticketing, penalty fines, and profile blacklisting under community bylaws.</li>
            </ul>
          </div>

          {/* Condition Checklist */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-stone-800 uppercase tracking-wide">
              Physical Handover Checklist (FR-09.1)
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.operationalTest}
                  onChange={(e) => setChecklist(prev => ({ ...prev, operationalTest: e.target.checked }))}
                  className="mt-0.5 rounded text-stone-900 focus:ring-stone-600"
                />
                <span className="text-stone-700">
                  <strong>Operational Test:</strong> Equipment powers on and functional parts engage smoothly.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.cordsAndHousingIntact}
                  onChange={(e) => setChecklist(prev => ({ ...prev, cordsAndHousingIntact: e.target.checked }))}
                  className="mt-0.5 rounded text-stone-900 focus:ring-stone-600"
                />
                <span className="text-stone-700">
                  <strong>Visual Safety:</strong> Power cords, casing, safety triggers, or seals are free of critical cracking.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.attachmentsIncluded}
                  onChange={(e) => setChecklist(prev => ({ ...prev, attachmentsIncluded: e.target.checked }))}
                  className="mt-0.5 rounded text-stone-900 focus:ring-stone-600"
                />
                <span className="text-stone-700">
                  <strong>Accessories Handed:</strong> Bits, wands, hoses, chargers, or manual accessories accounted for.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.returnDeadlinePledge}
                  onChange={(e) => setChecklist(prev => ({ ...prev, returnDeadlinePledge: e.target.checked }))}
                  className="mt-0.5 rounded text-stone-900 focus:ring-stone-600"
                />
                <span className="text-stone-700">
                  <strong>On-Time Pledge:</strong> Borrower commits to returning item at or before scheduled return time.
                </span>
              </label>
            </div>
          </div>

          {/* Handover Sign Action */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleSign}
              disabled={!allChecked}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Sign Handover & Transition to Active (FR-09.2)</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-1.5 text-stone-600 hover:text-stone-900 text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
