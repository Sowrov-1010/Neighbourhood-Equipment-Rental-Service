import React from 'react';
import { useApp } from '../context/AppContext';
import { Asset, BroadcastRequirement } from '../types';
import { Radio, MapPin, Calendar, Wrench, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatDistance } from '../distance';

interface BroadcastBoardProps {
  onOpenBroadcastModal: () => void;
  onSelectAsset: (asset: Asset) => void;
}

export const BroadcastBoard: React.FC<BroadcastBoardProps> = ({
  onOpenBroadcastModal,
  onSelectAsset,
}) => {
  const { broadcasts, assets, currentUser } = useApp();

  // FR-04.2: Suggestion engine matching available lenders ordered by shortest distance
  const getRankedMatchesForBroadcast = (bc: BroadcastRequirement): Asset[] => {
    return assets
      .filter(a => a.category === bc.category && a.distanceKm <= bc.maxDistanceKm && a.isAvailable)
      .sort((a, b) => a.distanceKm - b.distanceKm); // Shortest distance first
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="text-xs font-mono uppercase text-stone-500 tracking-wider">
            DEMAND-BASED REQUEST ENGINE (FR-04)
          </div>
          <h1 className="text-xl font-bold text-stone-900 mt-0.5">
            Community Equipment Broadcasts
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Neighbors request tools they don&rsquo;t own. Proximity algorithms automatically rank and present nearest matching lenders.
          </p>
        </div>

        <button
          onClick={onOpenBroadcastModal}
          className="self-start sm:self-center px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span>Post New Equipment Need</span>
        </button>
      </div>

      {/* Broadcast Feed */}
      <div className="space-y-4">
        {broadcasts.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-xs text-stone-500">
            No active broadcasts. Post a need to discover nearby equipment owners.
          </div>
        ) : (
          broadcasts.map(bc => {
            const matches = getRankedMatchesForBroadcast(bc);

            return (
              <div
                key={bc.id}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden p-5 space-y-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-stone-500">
                        {bc.category}
                      </span>
                      <span aria-hidden="true" className="text-stone-300">·</span>
                      <span className="text-xs text-stone-500">
                        Requested by <strong className="text-stone-800">{bc.borrowerName}</strong>
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-stone-900">
                      {bc.requiredItem}
                    </h2>

                    <p className="text-xs text-stone-600 leading-relaxed">
                      &ldquo;{bc.neededFor}&rdquo;
                    </p>
                  </div>

                  <div className="sm:text-right text-xs text-stone-500 space-y-1 font-mono">
                    <div className="flex sm:justify-end items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>Target: {bc.preferredDate}</span>
                    </div>
                    <div className="flex sm:justify-end items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      <span>Max Radius: {formatDistance(bc.maxDistanceKm)}</span>
                    </div>
                  </div>
                </div>

                {/* FR-04.2: Suggestion Engine Proximity Ranked Matches */}
                <div className="bg-stone-50 rounded-lg p-3.5 border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-amber-600" />
                      <span>Proximity Matched Lenders (FR-04.2)</span>
                    </span>
                    <span className="font-mono text-stone-500 text-[11px]">
                      {matches.length} matching available inventory nearby
                    </span>
                  </div>

                  {matches.length === 0 ? (
                    <div className="text-xs text-stone-500 bg-white p-3 rounded border border-stone-200 italic">
                      No active listings found within {formatDistance(bc.maxDistanceKm)} for this category. Nearby lenders will be alerted.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {matches.map((item, idx) => (
                        <div
                          key={item.id}
                          className="bg-white p-3 rounded-lg border border-stone-200 hover:border-stone-400 transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="truncate">
                            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-mono font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Rank #{idx + 1} · {formatDistance(item.distanceKm)} away</span>
                            </div>
                            <div className="font-bold text-stone-900 truncate mt-0.5">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-stone-500">
                              Lender: {item.ownerName} · {item.pricingType === 'free' ? 'Free' : `৳${item.priceAmount}/${item.pricingType}`}
                            </div>
                          </div>

                          <button
                            onClick={() => onSelectAsset(item)}
                            className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1"
                          >
                            <span>Request</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
