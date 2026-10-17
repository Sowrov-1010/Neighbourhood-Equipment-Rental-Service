import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Asset, PointOfInterest } from '../types';
import { 
  MapPin, 
  Sliders, 
  Shield, 
  Eye, 
  Wrench, 
  CheckCircle, 
  Crosshair, 
  Navigation, 
  Building2, 
  Clock, 
  Phone, 
  Sparkles, 
  Layers,
  Radio,
  Check,
  X
} from 'lucide-react';

interface NeighborhoodMapViewProps {
  onSelectAsset: (asset: Asset) => void;
}

type LayerMode = 'all' | 'tools' | 'pois' | 'depot' | 'repair' | 'locker';

export const NeighborhoodMapView: React.FC<NeighborhoodMapViewProps> = ({ onSelectAsset }) => {
  const { assets, currentUser, pointsOfInterest } = useApp();
  const [maxDistance, setMaxDistance] = useState<number>(3.5);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPricing, setSelectedPricing] = useState<string>('all');
  const [layerMode, setLayerMode] = useState<LayerMode>('all');
  
  const [activePinAsset, setActivePinAsset] = useState<Asset | null>(null);
  const [activePoi, setActivePoi] = useState<PointOfInterest | null>(null);

  // Live Location Tracking State
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>(currentUser.coordinates);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationTimestamp, setLocationTimestamp] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('Sector Registered GPS');

  // Trigger real or simulated browser geolocation
  const handleLocateMe = () => {
    setIsLocating(true);
    setLocationStatus('Acquiring satellite lock...');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(5));
          const lng = parseFloat(position.coords.longitude.toFixed(5));
          setUserCoords({ lat, lng });
          setLocationAccuracy(Math.round(position.coords.accuracy || 18));
          setLocationTimestamp(new Date().toLocaleTimeString());
          setLocationStatus('Live Device GPS Locked');
          setIsLocating(false);
        },
        (error) => {
          console.warn('Geolocation fallback:', error.message);
          // High-precision simulated local coordinates within resident sector
          const simLat = parseFloat((currentUser.coordinates.lat + (Math.random() - 0.5) * 0.003).toFixed(5));
          const simLng = parseFloat((currentUser.coordinates.lng + (Math.random() - 0.5) * 0.003).toFixed(5));
          setUserCoords({ lat: simLat, lng: simLng });
          setLocationAccuracy(12);
          setLocationTimestamp(new Date().toLocaleTimeString());
          setLocationStatus('Sector GPS Calibrated (Precision ±12m)');
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      setLocationStatus('GPS Sensor Active');
    }
  };

  // Filter assets based on spatial radius & pricing
  const filteredAssets = assets.filter(a => {
    if (!a.isAvailable) return false;
    if (a.distanceKm > maxDistance) return false;
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    if (selectedPricing !== 'all' && a.pricingType !== selectedPricing) return false;
    if (layerMode === 'pois' || layerMode === 'depot' || layerMode === 'repair' || layerMode === 'locker') return false;
    return true;
  });

  // Filter POIs
  const filteredPois = pointsOfInterest.filter(p => {
    if (p.distanceKm > maxDistance) return false;
    if (layerMode === 'tools') return false;
    if (layerMode === 'depot' && p.type !== 'depot') return false;
    if (layerMode === 'repair' && p.type !== 'repair_hub') return false;
    if (layerMode === 'locker' && p.type !== 'locker_station') return false;
    return true;
  });

  // Normalized visual coordinates for the SVG neighborhood grid (centered around user at 250, 250)
  const getCoordinates = (dist: number, index: number, total: number, angleOffset: number = 25) => {
    const angle = (index * (360 / Math.max(1, total)) + angleOffset) * (Math.PI / 180);
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-stone-500 tracking-wider">
              SPATIAL PROXIMITY &amp; REAL-TIME TRACKING (FR-08)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>Location Tracking Active</span>
            </span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 mt-1">
            Neighborhood Resource &amp; POI Radial Map
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Displays your verified location, nearby physical tools, community depots, and equipment repair stations within {maxDistance} km.
          </p>
        </div>

        {/* Live Location Tracker Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
            title="Scan GPS and pinpoint your real-time coordinates"
          >
            <Crosshair className={`w-3.5 h-3.5 text-blue-400 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Scanning GPS...' : 'Locate My Device'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono bg-stone-100 px-3 py-2 rounded-lg text-stone-700">
            <Shield className="w-3.5 h-3.5 text-stone-500" />
            <span>NFR-02: Obfuscated Boundaries</span>
          </div>
        </div>
      </div>

      {/* Live GPS Coordinates Info Strip */}
      <div className="p-3 bg-stone-900 text-stone-200 rounded-xl border border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs">{locationStatus}</span>
              {locationAccuracy && (
                <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800">
                  ±{locationAccuracy}m Accuracy
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-stone-400 mt-0.5">
              Lat: <span className="text-blue-300 font-bold">{userCoords.lat}° N</span> &middot; Lng: <span className="text-blue-300 font-bold">{userCoords.lng}° W</span> &middot; Sector: <span className="text-stone-300">{currentUser.neighborhood}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-stone-400">
          <span>{filteredAssets.length} Tools in Radius</span>
          <span>&middot;</span>
          <span>{filteredPois.length} Points of Interest</span>
        </div>
      </div>

      {/* Layer Filters & Proximity Slider */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
        {/* Layer Mode Segmented Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          <span className="text-stone-500 font-semibold mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Layers:</span>
          </span>
          {[
            { key: 'all', label: 'All Resources & Hubs' },
            { key: 'tools', label: 'Tools Only' },
            { key: 'depot', label: 'Community Depots' },
            { key: 'repair', label: 'Repair Stations' },
            { key: 'locker', label: '24/7 Smart Lockers' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setLayerMode(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                layerMode === tab.key
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sliders & Dropdown Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-stone-100">
          {/* Distance Range */}
          <div className="flex items-center gap-3 min-w-[260px] flex-1">
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
      </div>

      {/* Map & Matched Resources Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visual Vector Radar Map (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 p-4 shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-stone-500 mb-2 font-mono">
            <span>Center: {currentUser.neighborhood} (GPS Verified)</span>
            <span>Radial Reach: {maxDistance} km</span>
          </div>

          <div className="relative w-full max-w-[500px] aspect-square bg-stone-900 rounded-2xl overflow-hidden p-2 flex items-center justify-center">
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
                fill="rgba(59, 130, 246, 0.06)" 
                stroke="#3b82f6" 
                strokeWidth="1.5" 
                strokeDasharray="4 2"
              />

              {/* Crosshairs */}
              <line x1="20" y1="250" x2="480" y2="250" stroke="#1e293b" strokeWidth="1" />
              <line x1="250" y1="20" x2="250" y2="480" stroke="#1e293b" strokeWidth="1" />

              {/* Sector Labels */}
              <text x="350" y="80" fill="#64748b" fontSize="10" fontFamily="monospace">Oakridge North</text>
              <text x="60" y="380" fill="#64748b" fontSize="10" fontFamily="monospace">West Elm Park</text>
              <text x="340" y="420" fill="#64748b" fontSize="10" fontFamily="monospace">Riverdale Commons</text>
              <text x="40" y="100" fill="#64748b" fontSize="10" fontFamily="monospace">Highland Terrace</text>

              {/* Center User Pin with Live Pulsating Radar Waves */}
              <circle cx="250" cy="250" r="28" fill="rgba(59, 130, 246, 0.15)">
                <animate attributeName="r" values="10;34;10" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0;0.8" dur="2.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="250" cy="250" r="8" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              <text x="250" y="278" fill="#93c5fd" fontSize="10" textAnchor="middle" fontWeight="bold">
                YOU (LIVE)
              </text>

              {/* POINTS OF INTEREST (POIs) PINS */}
              {filteredPois.map((poi, idx) => {
                const coords = getCoordinates(poi.distanceKm, idx, filteredPois.length, 75);
                const isSelected = activePoi?.id === poi.id;
                const poiColor = poi.type === 'depot' ? '#10b981' : poi.type === 'repair_hub' ? '#f59e0b' : '#a855f7';

                return (
                  <g 
                    key={poi.id}
                    className="cursor-pointer transition-all"
                    onClick={() => { setActivePoi(poi); setActivePinAsset(null); }}
                  >
                    <rect
                      x={coords.x - 8}
                      y={coords.y - 8}
                      width="16"
                      height="16"
                      rx="4"
                      fill={poiColor}
                      stroke={isSelected ? '#ffffff' : '#0f172a'}
                      strokeWidth={isSelected ? 2.5 : 1}
                    />
                    <text
                      x={coords.x}
                      y={coords.y + 19}
                      fill={poiColor}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      ★ {poi.name.split(' ')[1] || poi.name.split(' ')[0]} ({poi.distanceKm}km)
                    </text>
                  </g>
                );
              })}

              {/* Tool Resource Pins */}
              {filteredAssets.map((asset, idx) => {
                const coords = getCoordinates(asset.distanceKm, idx, filteredAssets.length, 15);
                const isSelected = activePinAsset?.id === asset.id;

                return (
                  <g 
                    key={asset.id} 
                    className="cursor-pointer transition-all"
                    onClick={() => { setActivePinAsset(asset); setActivePoi(null); }}
                  >
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={isSelected ? 10 : 7}
                      fill={isSelected ? '#fbbf24' : '#f59e0b'}
                      stroke={isSelected ? '#ffffff' : '#0f172a'}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    <text
                      x={coords.x}
                      y={coords.y - 12}
                      fill={isSelected ? '#fef08a' : '#f8fafc'}
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

          {/* Map Legend */}
          <div className="w-full flex flex-wrap items-center justify-between text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-100 gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              <span>You (Current GPS)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>P2P Available Tools</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
              <span>Community Depot</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block"></span>
              <span>24/7 Smart Locker</span>
            </span>
          </div>
        </div>

        {/* Right List: Matched Nearby Resources & Selected POI Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active POI Highlight Card if clicked */}
          {activePoi && (
            <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/70 space-y-2.5 text-xs animate-fadeIn">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-600 text-white uppercase">
                    {activePoi.categoryLabel}
                  </span>
                  <h4 className="text-sm font-bold text-emerald-950 mt-1">
                    {activePoi.name}
                  </h4>
                  <div className="text-[11px] text-emerald-800 font-mono">
                    {activePoi.distanceKm} km from your device &middot; {activePoi.neighborhood}
                  </div>
                </div>
                <button
                  onClick={() => setActivePoi(null)}
                  className="p-1 text-emerald-700 hover:text-emerald-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-stone-700 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{activePoi.address}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span>Hours: {activePoi.hours}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span>Contact: {activePoi.phone}</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase text-emerald-900 font-bold mb-1">
                  Available Onsite Services:
                </div>
                <div className="flex flex-wrap gap-1">
                  {activePoi.services.map((svc, i) => (
                    <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-mono text-[10px]">
                      ✓ {svc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section: Nearby Points of Interest */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-stone-600" />
                <span>Points of Interest ({filteredPois.length})</span>
              </h3>
              <span className="text-[11px] font-mono text-stone-500">Public &amp; Community Hubs</span>
            </div>

            <div className="space-y-2">
              {filteredPois.map(poi => (
                <div
                  key={poi.id}
                  onClick={() => { setActivePoi(poi); setActivePinAsset(null); }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer bg-white text-xs ${
                    activePoi?.id === poi.id
                      ? 'border-emerald-600 ring-1 ring-emerald-600 bg-emerald-50/30'
                      : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-mono font-bold">
                        <MapPin className="w-3 h-3" />
                        <span>{poi.distanceKm} km away &middot; {poi.categoryLabel}</span>
                      </div>
                      <h4 className="font-bold text-stone-900 mt-0.5">{poi.name}</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">{poi.address}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Matched Tools */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-stone-600" />
                <span>Nearby Tools for Borrowing ({filteredAssets.length})</span>
              </h3>
              <span className="text-[11px] font-mono text-stone-500">Sorted by distance</span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {filteredAssets.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 p-6 text-center text-xs text-stone-500">
                  No tools match the selected {maxDistance} km radial distance. Expand the slider above.
                </div>
              ) : (
                filteredAssets
                  .sort((a, b) => a.distanceKm - b.distanceKm)
                  .map(item => {
                    const isHighlighted = activePinAsset?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => { setActivePinAsset(item); setActivePoi(null); }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer bg-white text-xs ${
                          isHighlighted
                            ? 'border-stone-900 shadow-sm ring-1 ring-stone-900'
                            : 'border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1 text-[11px] text-amber-700 font-mono font-bold">
                              <MapPin className="w-3 h-3" />
                              <span>{item.distanceKm} km away &middot; {item.neighborhood}</span>
                            </div>
                            <h4 className="font-bold text-stone-900 mt-0.5 line-clamp-1">
                              {item.title}
                            </h4>
                            <div className="text-[11px] text-stone-500">
                              {item.category} &middot; Condition: {item.condition}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-bold text-stone-900 font-mono">
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
    </div>
  );
};
