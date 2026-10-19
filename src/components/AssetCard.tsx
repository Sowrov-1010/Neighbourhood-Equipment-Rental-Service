import React, { useState } from 'react';
import { Asset } from '../types';
import { MapPin, Shield, Check, Eye } from 'lucide-react';
import { formatDistance } from '../distance';

interface AssetCardProps {
  asset: Asset;
  onSelect: (asset: Asset) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onSelect }) => {
  const [imgError, setImgError] = useState(false);

  // Format pricing display
  const formatPrice = () => {
    switch (asset.pricingType) {
      case 'free':
        return '৳0.00 Free Share';
      case 'hourly':
        return `৳${asset.priceAmount} / hr`;
      case 'daily':
        return `৳${asset.priceAmount} / day`;
      case 'per_use':
        return `৳${asset.priceAmount} / use`;
    }
  };

  return (
    <div className="group bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col hover:border-stone-400 hover:shadow-md transition-all duration-200">
      {/* Product Image Container */}
      <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
        {!imgError && asset.imageUrl ? (
          <img
            src={asset.imageUrl}
            alt={asset.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-stone-400 bg-stone-100">
            <span className="text-xs font-mono uppercase tracking-wider">{asset.category}</span>
            <span className="text-sm font-semibold text-stone-600 mt-1 text-center">{asset.title}</span>
          </div>
        )}

        {/* Quiet status & zero deposit indicators */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <div className="bg-stone-900/85 backdrop-blur-xs text-stone-100 text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs">
            ৳0 Security Deposit
          </div>
          <div className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-xs ${
            asset.isAvailable 
              ? 'bg-emerald-600 text-white' 
              : 'bg-stone-700 text-stone-200'
          }`}>
            {asset.isAvailable ? 'Available' : 'Reserved'}
          </div>
        </div>
      </div>

      {/* Card Content & Zero-Pill Unboxed Metadata */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Category & Condition unboxed text with dot separator */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600 uppercase tracking-wider font-mono">
            <span>{asset.category}</span>
            <span aria-hidden="true">·</span>
            <span>{asset.condition}</span>
          </div>

          {/* Product Name */}
          <h3 className="text-base font-semibold text-stone-900 mt-1 line-clamp-1 group-hover:text-stone-800">
            {asset.title}
          </h3>

          {/* Description snippet */}
          <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
            {asset.description}
          </p>
        </div>

        {/* Location & Pricing Footer */}
        <div className="pt-2 border-t border-stone-100 space-y-2">
          {/* Spatial Proximity Indicator (FR-08.2) */}
          <div className="flex items-center justify-between text-xs text-stone-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{formatDistance(asset.distanceKm)} away</span>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[120px]">{asset.neighborhood}</span>
            </div>
            <span className="text-[11px] text-stone-600 font-mono">
              Owner: {asset.ownerName.split(' ')[0]}
            </span>
          </div>

          {/* Price & Action */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-xs text-stone-600 font-medium">Lending Rate</div>
              <div className="text-base font-bold text-stone-900 font-mono tabular-nums">
                {formatPrice()}
              </div>
            </div>

            <button
              onClick={() => onSelect(asset)}
              className="px-3.5 py-1.5 text-xs font-semibold text-stone-900 bg-stone-100 hover:bg-stone-900 hover:text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Details & Book</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
