import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  ArrowRight,
  ExternalLink,
  Code2,
  Copy,
  Check,
  Search,
  FileJson,
  Server
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CloudDatabaseSyncModalProps {
  onClose: () => void;
  onOpenAdminDatabaseHub?: () => void;
}

type TabType = 'overview' | 'documents';
type CollectionType = 'assets' | 'rental_requests' | 'users' | 'disputes' | 'broadcasts' | 'reviews';

export const CloudDatabaseSyncModal: React.FC<CloudDatabaseSyncModalProps> = ({ 
  onClose,
  onOpenAdminDatabaseHub 
}) => {
  const { cloudSyncInfo, forceCloudResync, assets, users, rentalRequests, disputes, broadcasts, reviews } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedCollection, setSelectedCollection] = useState<CollectionType>('assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [resyncing, setResyncing] = useState(false);
  const [resyncDone, setResyncDone] = useState(false);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  const consoleUrl = `https://console.firebase.google.com/project/${cloudSyncInfo.projectId}/firestore/databases/${cloudSyncInfo.databaseId}/data`;

  const handleResync = async () => {
    setResyncing(true);
    setResyncDone(false);
    await forceCloudResync();
    setResyncing(false);
    setResyncDone(true);
    setTimeout(() => setResyncDone(false), 3000);
  };

  const getCollectionData = () => {
    switch (selectedCollection) {
      case 'assets': return assets;
      case 'rental_requests': return rentalRequests;
      case 'users': return users;
      case 'disputes': return disputes;
      case 'broadcasts': return broadcasts;
      case 'reviews': return reviews;
      default: return [];
    }
  };

  const rawData = getCollectionData();
  const filteredData = rawData.filter((item: any) => {
    if (!searchQuery.trim()) return true;
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(searchQuery.toLowerCase());
  });

  const handleCopy = (id: string, obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedDocId(id);
    setTimeout(() => setCopiedDocId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">Google Cloud Firestore Database</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AUTO-PERSISTENCE LIVE
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Connected to project <span className="font-mono text-emerald-400">{cloudSyncInfo.projectId}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-stone-200 bg-stone-100/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-emerald-600 text-stone-900 bg-white'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Status &amp; Cloud Details</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'documents'
                  ? 'border-emerald-600 text-stone-900 bg-white'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Browse Cloud Documents ({assets.length + rentalRequests.length + users.length + disputes.length + broadcasts.length + reviews.length})</span>
            </button>
          </div>

          <a
            href={consoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300/60 rounded-lg text-xs font-bold transition-colors"
            title="Open Firebase Web Console directly in Google Cloud"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
            <span>Open in Firebase Console</span>
          </a>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-800 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Connection Status Card */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1 flex-1">
                  <div className="font-bold text-emerald-900 text-sm">
                    Where is your database stored?
                  </div>
                  <p className="text-emerald-800 leading-relaxed">
                    Your database is provisioned and securely hosted in <strong>Google Cloud Platform (GCP) Firestore</strong> under dedicated database instance: <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono text-[11px] font-bold">{cloudSyncInfo.databaseId}</code>.
                  </p>
                  <p className="text-emerald-800 leading-relaxed">
                    Every listing added, rental request booked, handover checklist signed, or status changed is automatically saved and synchronized with Google Cloud Firestore in real time.
                  </p>
                </div>
              </div>

              {/* Database Specs Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Cloud Project ID</div>
                  <div className="font-mono font-semibold text-stone-900 mt-0.5 truncate" title={cloudSyncInfo.projectId}>
                    {cloudSyncInfo.projectId}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1">Google Cloud Platform Project</div>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Firestore Database ID</div>
                  <div className="font-mono font-semibold text-stone-900 mt-0.5 truncate" title={cloudSyncInfo.databaseId}>
                    {cloudSyncInfo.databaseId}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1">Dedicated Named Firestore Instance</div>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Sync Mechanism</div>
                  <div className="font-semibold text-stone-900 mt-0.5">
                    Bidirectional WebSockets (onSnapshot)
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1">Sub-second reactive state persistence</div>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Security Engine</div>
                  <div className="font-semibold text-stone-900 mt-0.5">
                    Cloud Firestore Security Rules
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1">Hardened firestore.rules deployed</div>
                </div>
              </div>

              {/* Direct Firebase Console Card */}
              <div className="p-4 bg-stone-900 text-stone-100 rounded-xl border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                    Direct Cloud Firebase Console URL
                  </div>
                  <div className="text-xs font-mono text-stone-300 break-all select-all">
                    {consoleUrl}
                  </div>
                </div>
                <a
                  href={consoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Console</span>
                </a>
              </div>

              {/* Live Collections Counter */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center justify-between">
                  <span>Synchronized Cloud Collections in Firestore</span>
                  <span className="text-[11px] font-mono text-emerald-600 font-semibold">● Live Auto-Sync Active</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { setSelectedCollection('assets'); setActiveTab('documents'); }}
                    className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-center cursor-pointer group"
                  >
                    <div className="text-lg font-bold text-stone-900 group-hover:text-emerald-700">{assets.length}</div>
                    <div className="text-[10px] text-stone-600 font-medium">/assets (Tools) &rarr;</div>
                  </button>

                  <button
                    onClick={() => { setSelectedCollection('rental_requests'); setActiveTab('documents'); }}
                    className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-center cursor-pointer group"
                  >
                    <div className="text-lg font-bold text-stone-900 group-hover:text-emerald-700">{rentalRequests.length}</div>
                    <div className="text-[10px] text-stone-600 font-medium">/rental_requests &rarr;</div>
                  </button>

                  <button
                    onClick={() => { setSelectedCollection('users'); setActiveTab('documents'); }}
                    className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-center cursor-pointer group"
                  >
                    <div className="text-lg font-bold text-stone-900 group-hover:text-emerald-700">{users.length}</div>
                    <div className="text-[10px] text-stone-600 font-medium">/users (Residents) &rarr;</div>
                  </button>

                  <button
                    onClick={() => { setSelectedCollection('disputes'); setActiveTab('documents'); }}
                    className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-center cursor-pointer group"
                  >
                    <div className="text-lg font-bold text-stone-900 group-hover:text-emerald-700">{disputes.length}</div>
                    <div className="text-[10px] text-stone-600 font-medium">/disputes &rarr;</div>
                  </button>

                  <button
                    onClick={() => { setSelectedCollection('broadcasts'); setActiveTab('documents'); }}
                    className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-center cursor-pointer group"
                  >
                    <div className="text-lg font-bold text-stone-900 group-hover:text-emerald-700">{broadcasts.length}</div>
                    <div className="text-[10px] text-stone-600 font-medium">/broadcasts &rarr;</div>
                  </button>

                  <button
                    onClick={() => { setSelectedCollection('reviews'); setActiveTab('documents'); }}
                    className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-center cursor-pointer group"
                  >
                    <div className="text-lg font-bold text-stone-900 group-hover:text-emerald-700">{reviews.length}</div>
                    <div className="text-[10px] text-stone-600 font-medium">/reviews &rarr;</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* Collection Selector & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                  {(['assets', 'rental_requests', 'users', 'disputes', 'broadcasts', 'reviews'] as CollectionType[]).map((col) => (
                    <button
                      key={col}
                      onClick={() => setSelectedCollection(col)}
                      className={`px-2.5 py-1.5 rounded-lg font-mono font-medium transition-colors shrink-0 ${
                        selectedCollection === col
                          ? 'bg-stone-900 text-white font-bold'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      /{col}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents..."
                    className="pl-8 pr-3 py-1.5 bg-stone-100 border border-stone-200 rounded-lg text-xs w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                </div>
              </div>

              {/* Document List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Showing {filteredData.length} document(s) in <code className="font-bold text-stone-800 font-mono">/{selectedCollection}</code></span>
                  <span className="font-mono text-[11px] text-emerald-600">● Real-time Firestore document view</span>
                </div>

                {filteredData.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-xl border border-dashed border-stone-300 text-xs text-stone-500">
                    No documents found matching "{searchQuery}".
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {filteredData.map((docItem: any, index: number) => {
                      const docId = docItem.id || `doc-${index}`;
                      const isCopied = copiedDocId === docId;
                      return (
                        <div 
                          key={docId}
                          className="p-3.5 bg-stone-900 text-stone-100 rounded-xl border border-stone-800 space-y-2 font-mono text-xs"
                        >
                          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                DOC ID
                              </span>
                              <span className="text-stone-300 font-bold">{docId}</span>
                            </div>

                            <button
                              onClick={() => handleCopy(docId, docItem)}
                              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[11px] flex items-center gap-1 transition-colors"
                              title="Copy JSON document"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{isCopied ? 'Copied' : 'Copy JSON'}</span>
                            </button>
                          </div>

                          <pre className="text-[11px] text-stone-300 overflow-x-auto p-2 bg-stone-950/80 rounded border border-stone-800/80 leading-relaxed max-h-48">
                            {JSON.stringify(docItem, null, 2)}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleResync}
              disabled={resyncing}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resyncing ? 'animate-spin' : ''}`} />
              <span>{resyncDone ? 'All Data Pushed to Cloud!' : resyncing ? 'Re-Syncing...' : 'Force Cloud Re-Sync'}</span>
            </button>

            <a
              href={consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Firebase Console</span>
            </a>
          </div>

          {onOpenAdminDatabaseHub && (
            <button
              onClick={() => {
                onClose();
                onOpenAdminDatabaseHub();
              }}
              className="w-full sm:w-auto px-4 py-2 text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Export PostgreSQL / MySQL DDL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
