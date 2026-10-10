import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Radio, MapPin, Calendar, HelpCircle, ShieldAlert } from 'lucide-react';

interface BroadcastModalProps {
  onClose: () => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({ onClose }) => {
  const { createBroadcast, currentUser } = useApp();

  const [requiredItem, setRequiredItem] = useState('');
  const [category, setCategory] = useState<'Power Tools' | 'Ladders & Access' | 'Household Appliances' | 'Outdoor & Garden' | 'Plumbing & Mechanical' | 'Cleaning Equipment'>('Power Tools');
  const [neededFor, setNeededFor] = useState('');
  const [maxDistanceKm, setMaxDistanceKm] = useState(3.0);
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().slice(0, 10));
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requiredItem.trim()) {
      setErrorMsg('Please specify the tool or appliance needed.');
      return;
    }

    if (currentUser.isBlacklisted) {
      setErrorMsg('Account is blacklisted. Broadcast creation is prohibited.');
      return;
    }

    createBroadcast({
      requiredItem: requiredItem.trim(),
      category,
      neededFor: neededFor.trim() || 'Neighborhood project',
      maxDistanceKm,
      preferredDate,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200">
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-xs font-mono uppercase text-stone-500 tracking-wider">
                COMMUNITY DEMAND BROADCAST (FR-04)
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Post Equipment Need
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
          {currentUser.isBlacklisted && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>You are currently blacklisted and cannot broadcast rental requirements.</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
              What tool or appliance do you need?
            </label>
            <input
              type="text"
              value={requiredItem}
              onChange={(e) => setRequiredItem(e.target.value)}
              placeholder="e.g. Concrete mixer, Tile wet saw, Dehumidifier, Engine hoist"
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
              >
                <option value="Power Tools">Power Tools</option>
                <option value="Ladders & Access">Ladders & Access</option>
                <option value="Household Appliances">Household Appliances</option>
                <option value="Outdoor & Garden">Outdoor & Garden</option>
                <option value="Plumbing & Mechanical">Plumbing & Mechanical</option>
                <option value="Cleaning Equipment">Cleaning Equipment</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                Max Travel Radius: {maxDistanceKm} km
              </label>
              <span className="text-[11px] text-stone-500 font-mono">Radial Spatial Filter</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(parseFloat(e.target.value))}
              className="w-full accent-stone-900 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-0.5">
              <span>0.5 km (Walking)</span>
              <span>5 km (Local block)</span>
              <span>10 km (District)</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
              Intended Project / Task Description
            </label>
            <textarea
              rows={2}
              value={neededFor}
              onChange={(e) => setNeededFor(e.target.value)}
              placeholder="e.g. Installing floating garage shelves into masonry wall over the weekend..."
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="text-xs text-red-600 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={currentUser.isBlacklisted}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              Broadcast to Nearby Lenders
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
