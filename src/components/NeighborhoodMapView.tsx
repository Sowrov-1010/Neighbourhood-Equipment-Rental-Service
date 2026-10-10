import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Asset, PricingType } from '../types';
import { MapPin, Sliders, Shield, Eye, Wrench, CheckCircle } from 'lucide-react';

interface NeighborhoodMapViewProps {
  onSelectAsset: (asset: Asset) => void;
}

export const NeighborhoodMapView: React.FC<NeighborhoodMapViewProps> = ({ onSelectAsset }) => {
  const { assets, currentUser } = useApp();
  const [maxDistance, setMaxDistance] = useState<number>(3.5);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPricing, setSelectedPricing] = useState<string>('all');
  const [activePinAsset, setActivePinAsset] = useState<Asset | null>(null);

  // Filter assets based on spatial radius & pricing
  const filteredAssets = assets.filter(a => {
    if (!a.isAvailable) return false;
    if (a.distanceKm > maxDistance) return false;
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    if (selectedPricing !== 'all' && a.pricingType !== selectedPricing) return false;
    return true;
  });

  // Normalized visual coordinates for the SVG neighborhood grid (centered around currentUser)
  // Distance max = 10km. Center = (250, 250)
  const getCoordinates = (dist: number, index: number) => {
    const angle = (index * (360 / Math.max(1, assets.length)) + 25) * (Math.PI / 180);
    const radius = Math.min(220, (dist / 10) * 220);
    return {
      x: 250 + Math.cos(angle) * radius,
      y: 250 + Math.sin(angle) * radius,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="text-xs font-mono uppercase text-stone-500 tracking-wider">
            SPATIAL PROXIMITY & LOCATION RADIAL (FR-08)
          </div>
          <h1 className="text-xl font-bold text-stone-900 mt-0.5">
            Neighborhood Resource Radial Map
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Pinpoints active equipment around your current sector ({currentUser.neighborhood}). Addresses are obfuscated to block boundaries until rental acceptance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-stone-100 px-3 py-1.5 rounded-lg text-stone-700">
          <Shield className="w-3.5 h-3.5 text-stone-500" />
          <span>NFR-02: Block Boundary Obfuscated</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Distance Range */}
        <div className="flex items-center gap-3 min-w-[260px]">
          <Sliders className="w-4 h-4 text-stone-500 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
              <span>Radial Proximity:</span>
              <span className="font-mono font-bold text-stone-900">{maxDistance} km</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="8"
              step="0.5"
              value={maxDistance}
              onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
              className="w-full accent-stone-900 cursor-pointer"
            />
          </div>
        </div>

        {/* Pricing Model Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500 font-medium">Pricing:</span>
          <select
            value={selectedPricing}
            onChange={(e) => setSelectedPricing(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
          >
            <option value="all">All Models</option>
            <option value="free">Free ($0.00)</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="per_use">Per-Use</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500 font-medium">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Power Tools">Power Tools</option>
            <option value="Household Appliances">Household Appliances</option>
            <option value="Ladders & Access">Ladders & Access</option>
            <option value="Cleaning Equipment">Cleaning Equipment</option>
            <option value="Outdoor & Garden">Outdoor & Garden</option>
          </select>
        </div>
      </div>

      {/* Map & Matched Listings Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visual Vector Radar Map (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 p-4 shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-stone-500 mb-2 font-mono">
            <span>Center: {currentUser.neighborhood}</span>
            <span>Range: {maxDistance} km</span>
          </div>

          <div className="relative w-full max-w-[480px] aspect-square bg-stone-900 rounded-2xl overflow-hidden p-2 flex items-center justify-center">
            <svg viewBox="0 0 500 500" className="w-full h-full">
              {/* Radial Distance Rings */}
              <circle cx="250" cy="250" r="60" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="250" cy="250" r="120" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="250" cy="250" r="180" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="250" cy="250" r="230" fill="none" stroke="#475569" strokeWidth="1" />

              {/* Dynamic user selected radius zone */}
              <circle 
                cx="250" 
                cy="250" 
                r={(maxDistance / 10) * 220} 
                fill="rgba(245, 158, 11, 0.08)" 
                stroke="#f59e0b" 
                strokeWidth="1.5" 
              />

              {/* Crosshairs */}
              <line x1="20" y1="250" x2="480" y2="250" stroke="#1e293b" strokeWidth="1" />
              <line x1="250" y1="20" x2="250" y2="480" stroke="#1e293b" strokeWidth="1" />

              {/* Neighborhood zone labels */}
              <text x="350" y="80" fill="#64748b" fontSize="11" fontFamily="monospace">Oakridge North</text>
              <text x="60" y="380" fill="#64748b" fontSize="11" fontFamily="monospace">West Elm Park</text>
              <text x="340" y="420" fill="#64748b" fontSize="11" fontFamily="monospace">Riverdale Commons</text>
              <text x="40" y="100" fill="#64748b" fontSize="11" fontFamily="monospace">Highland Terrace</text>

              {/* Center User Pin */}
              <circle cx="250" cy="250" r="8" fill="#3b82f6" />
              <circle cx="250" cy="250" r="14" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
              <text x="250" y="275" fill="#e2e8f0" fontSize="10" textAnchor="middle" fontWeight="bold">YOU ({currentUser.name.split(' ')[0]})</text>

              {/* Tool Pins */}
              {assets.map((asset, idx) => {
                const coords = getCoordinates(asset.distanceKm, idx);
                const isInRange = asset.distanceKm <= maxDistance && asset.isAvailable;
                const isSelected = activePinAsset?.id === asset.id;

                return (
                  <g 
                    key={asset.id} 
                    className="cursor-pointer transition-all"
                    onClick={() => setActivePinAsset(asset)}
                  >
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={isSelected ? 10 : 7}
                      fill={
                        !asset.isAvailable 
                          ? '#64748b' 
                          : isInRange 
                          ? '#f59e0b' 
                          : '#475569'
                      }
                      stroke={isSelected ? '#ffffff' : '#0f172a'}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    <text
                      x={coords.x}
                      y={coords.y - 12}
                      fill={isInRange ? '#f8fafc' : '#64748b'}
                      fontSize="9"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      {asset.title.split(' ')[0]} ({asset.distanceKm}km)
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="w-full flex items-center justify-between text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>Available in radius</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              <span>Your Sector</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-500 inline-block"></span>
              <span>Out of radius / reserved</span>
            </span>
          </div>
        </div>

        {/* Right List: Matched Radial Resources (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wide">
              Matched Nearby Resources ({filteredAssets.length})
            </h3>
            <span className="text-[11px] font-mono text-stone-500">Sorted by distance</span>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredAssets.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-6 text-center text-xs text-stone-500">
                No tools match the selected {maxDistance} km radial distance and filters. Expand the slider above.
              </div>
            ) : (
              filteredAssets
                .sort((a, b) => a.distanceKm - b.distanceKm)
                .map(item => {
                  const isHighlighted = activePinAsset?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActivePinAsset(item)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-white ${
                        isHighlighted
                          ? 'border-stone-900 shadow-sm ring-1 ring-stone-900'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-mono font-bold">
                            <MapPin className="w-3 h-3" />
                            <span>{item.distanceKm} km away · {item.neighborhood}</span>
                          </div>
                          <h4 className="text-sm font-bold text-stone-900 mt-0.5 line-clamp-1">
                            {item.title}
                          </h4>
                          <div className="text-[11px] text-stone-500">
                            {item.category} · Condition: {item.condition}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-stone-900 font-mono">
                            {item.pricingType === 'free' ? 'Free' : `$${item.priceAmount}/${item.pricingType.replace('_', ' ')}`}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAsset(item);
                            }}
                            className="mt-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Book</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
