import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { PricingType, AssetCondition, PaymentMethod } from '../types';
import { 
  X, 
  Wrench, 
  AlertTriangle, 
  ShieldCheck, 
  Plus, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  Camera, 
  Trash2,
  Sparkles
} from 'lucide-react';

interface CreateListingModalProps {
  onClose: () => void;
}

const PRESET_PHOTOS = [
  { url: '/src/assets/images/tool_pressure_washer_1791625590565.jpg', label: 'Pressure Washer' },
  { url: '/src/assets/images/tool_rotary_drill_1791625603929.jpg', label: 'Rotary Hammer Drill' },
  { url: '/src/assets/images/appliance_mini_fridge_1791625614579.jpg', label: 'Compact Mini Fridge' },
  { url: '/src/assets/images/tool_telescopic_ladder_1791625624898.jpg', label: 'Telescopic Ladder' },
];

export const CreateListingModal: React.FC<CreateListingModalProps> = ({ onClose }) => {
  const { createAsset, currentUser } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Power Tools' | 'Ladders & Access' | 'Household Appliances' | 'Outdoor & Garden' | 'Plumbing & Mechanical' | 'Cleaning Equipment'>('Power Tools');
  const [description, setDescription] = useState('');
  const [pricingType, setPricingType] = useState<PricingType>('daily');
  const [priceAmount, setPriceAmount] = useState<number>(15);
  const [condition, setCondition] = useState<AssetCondition>('Good');
  const [acceptedPayments, setAcceptedPayments] = useState<PaymentMethod>('both');
  const [bankingProvider, setBankingProvider] = useState(currentUser.lenderPaymentDetails?.mobileBankingProvider || 'Zelle');
  const [bankingHandle, setBankingHandle] = useState(currentUser.lenderPaymentDetails?.mobileBankingHandle || currentUser.email);
  const [cashInstructions, setCashInstructions] = useState('Exact cash on physical handover preferred.');
  const [featuresText, setFeaturesText] = useState('Safety guard included, User guide provided');
  
  // Picture upload state
  const [imageSourceMode, setImageSourceMode] = useState<'upload' | 'preset' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState<string>('/src/assets/images/tool_rotary_drill_1791625603929.jpg');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 8MB. Please upload a smaller photo.');
      return;
    }

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageUrl(e.target.result as string);
        setUploadedFileName(file.name);
        const kb = Math.round(file.size / 1024);
        setUploadedFileSize(kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
        setImageSourceMode('upload');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please enter an item title and detailed description.');
      return;
    }

    const features = featuresText
      .split(',')
      .map(f => f.trim())
      .filter(Boolean);

    const result = createAsset({
      title: title.trim(),
      category,
      description: description.trim(),
      imageUrl,
      pricingType,
      priceAmount: pricingType === 'free' ? 0 : priceAmount,
      condition,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      neighborhood: currentUser.neighborhood,
      acceptedPayments,
      lenderPaymentDetails: {
        mobileBankingProvider: bankingProvider,
        mobileBankingHandle: bankingHandle,
        cashInstructions,
      },
      features,
      isNonConsumableVerified: true,
    });

    if (!result.success) {
      setErrorMsg(result.error || 'Failed to list asset.');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-xs font-mono uppercase text-stone-500 tracking-wider">
                INVENTORY CATALOG (FR-01)
              </div>
              <h3 className="text-base font-bold text-stone-900">
                List Reusable Tool or Household Appliance
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Non-consumable guarantee note */}
          <div className="p-3 bg-stone-100 rounded-xl text-xs text-stone-700 flex items-start gap-2.5 border border-stone-200">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 block font-semibold">Strictly Non-Consumable Policy (FR-01.2)</strong>
              Listings must be reusable hardware, equipment, or appliances. Consumables like single-use nails, screws, paints, glue, or fuel will be rejected by policy validation.
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
              Asset Title / Model Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DeWalt 12-inch Miter Saw, Whirlpool Portable Dehumidifier"
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
                Condition Tag (FR-01.5)
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
              >
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Heavy Wear">Heavy Wear</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
              Detailed Description & Specifications
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe capacity, included attachments, operating requirements..."
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Pricing Model Engine (FR-01.3) */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <div className="text-xs font-bold text-stone-800 uppercase tracking-wide">
              Flexible Pricing Engine (FR-01.3)
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['free', 'hourly', 'daily', 'per_use'] as PricingType[]).map(ptype => (
                <button
                  type="button"
                  key={ptype}
                  onClick={() => setPricingType(ptype)}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    pricingType === ptype
                      ? 'border-stone-900 bg-white ring-1 ring-stone-900 font-bold text-stone-900'
                      : 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <div className="text-xs capitalize font-medium">{ptype.replace('_', ' ')}</div>
                  <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                    {ptype === 'free' ? '$0.00 Share' : ptype === 'per_use' ? 'Flat rate' : `$/${ptype}`}
                  </div>
                </button>
              ))}
            </div>

            {pricingType !== 'free' && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-medium text-stone-700">Rate Amount ($):</span>
                <input
                  type="number"
                  min="1"
                  value={priceAmount}
                  onChange={(e) => setPriceAmount(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono focus:ring-1 focus:ring-stone-600 focus:outline-none"
                />
                <span className="text-xs text-stone-500 font-mono">
                  {pricingType === 'hourly' && 'per hour'}
                  {pricingType === 'daily' && 'per 24-hr period'}
                  {pricingType === 'per_use' && 'flat fee per use'}
                </span>
              </div>
            )}
          </div>

          {/* Payment Methods (FR-01.4) */}
          {pricingType !== 'free' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block">
                Accepted Payment Channels (FR-01.4)
              </label>

              <div className="grid grid-cols-3 gap-2">
                {(['cash', 'mobile_banking', 'both'] as PaymentMethod[]).map(pm => (
                  <button
                    type="button"
                    key={pm}
                    onClick={() => setAcceptedPayments(pm)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize text-center transition-all ${
                      acceptedPayments === pm
                        ? 'border-stone-900 bg-stone-900 text-white font-semibold'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {pm.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {(acceptedPayments === 'mobile_banking' || acceptedPayments === 'both') && (
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[11px] text-stone-500 block mb-1">Mobile Banking Service</span>
                    <input
                      type="text"
                      value={bankingProvider}
                      onChange={(e) => setBankingProvider(e.target.value)}
                      placeholder="e.g. Zelle, Venmo, Direct ACH"
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block mb-1">Account Handle / ID</span>
                    <input
                      type="text"
                      value={bankingHandle}
                      onChange={(e) => setBankingHandle(e.target.value)}
                      placeholder="e.g. name@neighborhood.org or @tag"
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono focus:ring-1 focus:ring-stone-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Picture Upload & Selection Option (FR-01) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block">
                Equipment Picture / Photo Upload
              </label>
              
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setImageSourceMode('upload')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    imageSourceMode === 'upload' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageSourceMode('preset')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    imageSourceMode === 'preset' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setImageSourceMode('url')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    imageSourceMode === 'url' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Web URL
                </button>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Mode 1: Drag & Drop File Upload */}
            {imageSourceMode === 'upload' && (
              <div className="space-y-2">
                {imageUrl && (uploadedFileName || imageUrl.startsWith('data:')) ? (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-200 shrink-0 border border-stone-300">
                      <img src={imageUrl} alt="Uploaded preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-stone-900 truncate">
                        {uploadedFileName || 'Uploaded Equipment Picture'}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-mono mt-0.5 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Ready for listing {uploadedFileSize ? `(${uploadedFileSize})` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] font-semibold text-stone-700 hover:text-stone-950 underline"
                        >
                          Change photo
                        </button>
                        <span className="text-stone-300">&middot;</span>
                        <button
                          type="button"
                          onClick={() => {
                            setImageUrl('/src/assets/images/tool_rotary_drill_1791625603929.jpg');
                            setUploadedFileName('');
                            setUploadedFileSize('');
                          }}
                          className="text-[11px] font-semibold text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-stone-900 bg-stone-100' 
                        : 'border-stone-300 hover:border-stone-400 bg-stone-50/70 hover:bg-stone-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-stone-200 flex items-center justify-center mx-auto mb-2 text-stone-600">
                      <Upload className="w-5 h-5 text-stone-700" />
                    </div>
                    <div className="text-xs font-semibold text-stone-800">
                      Click to upload equipment picture or drag and drop
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      High-resolution PNG, JPG, or WebP from your camera or files (up to 8MB)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Curated Presets */}
            {imageSourceMode === 'preset' && (
              <div className="grid grid-cols-4 gap-2">
                {PRESET_PHOTOS.map(img => (
                  <button
                    type="button"
                    key={img.url}
                    onClick={() => {
                      setImageUrl(img.url);
                      setUploadedFileName('');
                    }}
                    className={`aspect-4/3 rounded-lg overflow-hidden border relative group ${
                      imageUrl === img.url ? 'ring-2 ring-stone-900 border-transparent' : 'border-stone-200'
                    }`}
                  >
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-stone-950/70 py-0.5 px-1 text-[9px] text-white truncate text-center">
                      {img.label}
                    </div>
                    {imageUrl === img.url && (
                      <div className="absolute inset-0 bg-stone-900/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Mode 3: Direct Web URL */}
            {imageSourceMode === 'url' && (
              <div className="space-y-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/images/tool.jpg"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-stone-600 focus:outline-none"
                />
                {imageUrl && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-stone-200 bg-stone-100">
                    <img src={imageUrl} alt="URL Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
              Features / Inclusions (Comma-separated)
            </label>
            <input
              type="text"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder="e.g. Includes extra bits, GFCI plug, Carrying case"
              className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMsg}</span>
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
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              Publish to Directory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
