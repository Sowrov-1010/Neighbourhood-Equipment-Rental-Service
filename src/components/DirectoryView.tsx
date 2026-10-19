import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Asset, PricingType } from '../types';
import { AssetCard } from './AssetCard';
import { formatDistance } from '../distance';
import { 
  Search, 
  SlidersHorizontal, 
  ShieldCheck, 
  Wrench, 
  Sparkles, 
  Coins, 
  MapPin, 
  RefreshCw 
} from 'lucide-react';

interface DirectoryViewProps {
  onSelectAsset: (asset: Asset) => void;
  onOpenCreateListing: () => void;
  onOpenBroadcast: () => void;
}

const CATEGORIES = [
  'All Equipment',
  'Power Tools',
  'Household Appliances',
  'Ladders & Access',
  'Cleaning Equipment',
  'Outdoor & Garden',
];

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  onSelectAsset,
  onOpenCreateListing,
  onOpenBroadcast,
}) => {
  const { assets, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Equipment');
  const [selectedPricing, setSelectedPricing] = useState<string>('all');
  const [maxDistance, setMaxDistance] = useState<number>(10000);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [viewScope, setViewScope] = useState<'all' | 'mine'>('all');

  const myListingsCount = assets.filter(a => a.ownerId === currentUser.id).length;

  // Filter assets
  const filteredAssets = assets.filter(a => {
    // If viewing user's own listed equipment
    if (viewScope === 'mine') {
      if (a.ownerId !== currentUser.id) return false;
    } else {
      // Hide listings if owner is blacklisted in public view
      if (onlyAvailable && !a.isAvailable) return false;
      if (a.distanceKm * 1000 > maxDistance) return false;
    }

    if (selectedCategory !== 'All Equipment' && a.category !== selectedCategory) return false;
    if (selectedPricing !== 'all' && a.pricingType !== selectedPricing) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchDesc = a.description.toLowerCase().includes(q);
      const matchCat = a.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Editorial Hero Showcase */}
      <div className="relative rounded-2xl bg-stone-900 text-stone-100 p-8 sm:p-12 overflow-hidden border border-stone-800 shadow-md">
        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="text-xs font-mono uppercase text-amber-400 tracking-wider">
            LOCALIZED PEER-TO-PEER RESOURCE SHARING
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Borrow Heavy Equipment & Appliances from Verified Neighbors.
          </h1>
          <p className="text-sm text-stone-300 leading-relaxed max-w-xl">
            Access pressure washers, rotary hammer drills, and mini-fridges on demand. Zero security deposits, direct P2P payments, and transparent track-record screening.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenBroadcast}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-xs"
            >
              Broadcast an Equipment Need
            </button>
            <button
              onClick={onOpenCreateListing}
              className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-white font-medium text-xs rounded-lg transition-colors border border-stone-700"
            >
              List an Unused Tool
            </button>
          </div>
        </div>

        {/* 4-Column Trust Strip Below Hero */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-stone-800 text-xs text-stone-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Strictly ৳0 Deposit</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Direct P2P Settlement</span>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Non-Consumables Only</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Radial Neighborhood Pins</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs space-y-4">
        {/* Scope Switcher: Community Catalog vs My Listed Tools */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewScope('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                viewScope === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Community Directory</span>
            </button>

            <button
              onClick={() => setViewScope('mine')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                viewScope === 'mine'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>My Listed Equipment</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                viewScope === 'mine' ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-700'
              }`}>
                {myListingsCount}
              </span>
            </button>
          </div>

          <button
            onClick={onOpenCreateListing}
            className="self-start sm:self-auto px-3 py-1.5 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1 shrink-0"
          >
            <span>+ List Reusable Tool</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={viewScope === 'mine' ? "Search your listed equipment..." : "Search equipment..."}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
            />
          </div>

          {/* Pricing Model Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 text-xs font-medium">
            <span className="text-stone-600 mr-1 text-[11px] whitespace-nowrap">Model:</span>
            {[
              { key: 'all', label: 'All Rates' },
              { key: 'free', label: 'Free (৳0)' },
              { key: 'hourly', label: 'Hourly' },
              { key: 'daily', label: 'Daily' },
              { key: 'per_use', label: 'Per-Use' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedPricing(tab.key)}
                className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap text-xs ${
                  selectedPricing === tab.key
                    ? 'bg-stone-900 text-white font-semibold'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Category and Radius Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-stone-100 text-xs">
          {/* Category Tabs */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-stone-200 text-stone-900 font-bold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Radius Slider and Availability Toggle */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] text-stone-600">
            <div className="flex items-center gap-2">
              <span>Radius: <strong>{formatDistance(maxDistance / 1000)}</strong></span>
              <input
                type="range"
                min="500"
                max="10000"
                step="500"
                value={maxDistance}
                onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
                className="w-24 accent-stone-900 cursor-pointer"
              />
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded text-stone-900 focus:ring-stone-600"
              />
              <span>Available Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Product Catalog Grid (3-columns on desktop, generous whitespace gap-6) */}
      <div>
        <div className="flex items-center justify-between text-xs text-stone-500 mb-4 font-mono">
          <span>SHOWING {filteredAssets.length} VERIFIED ASSETS</span>
          <span>LOCATION BASE: {currentUser.neighborhood}</span>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
            <Wrench className="w-10 h-10 text-stone-300 mx-auto" />
            <h4 className="text-base font-bold text-stone-800">
              {viewScope === 'mine' ? 'No equipment listed yet under your account' : 'No matching equipment found'}
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {viewScope === 'mine'
                ? 'Put your idle power tools, pressure washers, or household appliances to work. Earn rental fees with zero security deposit worries.'
                : 'Try adjusting your radial distance filter or category selection, or broadcast your need to neighboring owners.'}
            </p>
            {viewScope === 'mine' ? (
              <button
                onClick={onOpenCreateListing}
                className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs transition-colors shadow-xs"
              >
                + List Equipment for Rent
              </button>
            ) : (
              <button
                onClick={onOpenBroadcast}
                className="mt-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800"
              >
                Broadcast Need to Community
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map(asset => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onSelect={onSelectAsset}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
