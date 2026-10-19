/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { DirectoryView } from './components/DirectoryView';
import { RentalTrackView } from './components/RentalTrackView';
import { BroadcastBoard } from './components/BroadcastBoard';
import { NeighborhoodMapView } from './components/NeighborhoodMapView';
import { AdminConsoleLayout } from './components/AdminConsoleLayout';
import { AssetDetailModal } from './components/AssetDetailModal';
import { CreateListingModal } from './components/CreateListingModal';
import { PaymentModal } from './components/PaymentModal';
import { PickupHandoverModal } from './components/PickupHandoverModal';
import { DisputeModal } from './components/DisputeModal';
import { BroadcastModal } from './components/BroadcastModal';
import { ReviewModal } from './components/ReviewModal';
import { AuthModal } from './components/AuthModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ResidentSupportChat } from './components/ResidentSupportChat';
import { Asset, RentalRequest } from './types';
import { KeyRound, ShieldAlert, ArrowRight, Building2 } from 'lucide-react';

function MainApp() {
  const { assets, isAuthenticated, isAdmin, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'directory' | 'requests' | 'broadcast' | 'admin' | 'map'>('directory');
  const [adminViewMode, setAdminViewMode] = useState<'console' | 'resident'>('console');

  // Modal states
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [paymentReq, setPaymentReq] = useState<RentalRequest | null>(null);
  const [handoverReq, setHandoverReq] = useState<RentalRequest | null>(null);
  const [disputeReq, setDisputeReq] = useState<RentalRequest | null>(null);
  const [reviewReq, setReviewReq] = useState<RentalRequest | null>(null);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleOpenCreateListing = () => {
    if (!isAuthenticated) {
      handleOpenAuth('login');
      return;
    }
    setShowCreateListing(true);
  };

  const handleOpenBroadcast = () => {
    if (!isAuthenticated) {
      handleOpenAuth('login');
      return;
    }
    setShowBroadcastModal(true);
  };

  const paymentAsset = paymentReq ? assets.find(a => a.id === paymentReq.assetId) || null : null;

  // If Admin is logged in and in console mode, show the completely distinct Admin Console!
  if (isAuthenticated && isAdmin && adminViewMode === 'console') {
    return (
      <>
        <AdminConsoleLayout
          onExitToResidentView={() => setAdminViewMode('resident')}
        />
        <ResidentSupportChat />
        {/* Modals available if needed */}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      {/* Admin Floating Banner if Admin is browsing in Resident View */}
      {isAuthenticated && isAdmin && adminViewMode === 'resident' && (
        <div className="bg-stone-900 text-stone-200 px-4 py-2 text-xs flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>
              You are viewing the platform in <strong>Resident Preview Mode</strong> as Administrator ({currentUser.name}).
            </span>
            <button
              onClick={() => setAdminViewMode('console')}
              className="ml-auto px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded text-[11px] flex items-center gap-1 transition-colors"
            >
              <span>Return to Admin Console</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'admin') {
            setAdminViewMode('console');
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenCreateListing={handleOpenCreateListing}
        onOpenBroadcast={handleOpenBroadcast}
        onOpenAuth={handleOpenAuth}
        onOpenProfile={() => setShowProfileModal(true)}
      />
      <ResidentSupportChat />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {activeTab === 'directory' && (
          <DirectoryView
            onSelectAsset={(asset) => setSelectedAsset(asset)}
            onOpenCreateListing={handleOpenCreateListing}
            onOpenBroadcast={handleOpenBroadcast}
          />
        )}

        {activeTab === 'requests' && (
          <RentalTrackView
            onOpenPaymentModal={(req) => setPaymentReq(req)}
            onOpenHandoverModal={(req) => setHandoverReq(req)}
            onOpenDisputeModal={(req) => setDisputeReq(req)}
            onOpenReviewModal={(req) => setReviewReq(req)}
            onOpenAuth={(mode) => handleOpenAuth(mode)}
          />
        )}

        {activeTab === 'broadcast' && (
          <BroadcastBoard
            onOpenBroadcastModal={handleOpenBroadcast}
            onSelectAsset={(asset) => setSelectedAsset(asset)}
          />
        )}

        {activeTab === 'map' && (
          <NeighborhoodMapView
            onSelectAsset={(asset) => setSelectedAsset(asset)}
          />
        )}
      </main>

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setShowAuthModal(false)}
          onOpenAdminAuth={() => {
            setShowAuthModal(false);
            setShowAdminAuthModal(true);
          }}
        />
      )}

      {showAdminAuthModal && (
        <AdminAuthModal
          onClose={() => setShowAdminAuthModal(false)}
          onSuccess={() => {
            setAdminViewMode('console');
          }}
        />
      )}

      {showProfileModal && (
        <UserProfileModal
          onClose={() => setShowProfileModal(false)}
          onOpenAuth={() => handleOpenAuth('login')}
        />
      )}

      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onOpenAuth={(mode) => handleOpenAuth(mode)}
          onRequestSuccess={(requestId) => {
            setSelectedAsset(null);
            setActiveTab('requests');
          }}
        />
      )}

      {showCreateListing && (
        <CreateListingModal
          onClose={() => setShowCreateListing(false)}
        />
      )}

      {showBroadcastModal && (
        <BroadcastModal
          onClose={() => setShowBroadcastModal(false)}
        />
      )}

      {paymentReq && paymentAsset && (
        <PaymentModal
          request={paymentReq}
          asset={paymentAsset}
          onClose={() => setPaymentReq(null)}
        />
      )}

      {handoverReq && (
        <PickupHandoverModal
          request={handoverReq}
          onClose={() => setHandoverReq(null)}
        />
      )}

      {disputeReq && (
        <DisputeModal
          request={disputeReq}
          onClose={() => setDisputeReq(null)}
        />
      )}

      {reviewReq && (
        <ReviewModal
          request={reviewReq}
          onClose={() => setReviewReq(null)}
        />
      )}

      {/* Professional Community Footer with Discrete Admin Gateway */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-12 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-900">Neighborhood Tool & Equipment Directory</span>
            <span>&middot;</span>
            <span>Non-Consumable P2P Resource Sharing</span>
          </div>

          <div className="flex items-center gap-4 text-stone-500">
            <span>Zero Security Deposit</span>
            <span>&middot;</span>
            {/* Discrete Hidden Admin Access Gateway */}
            <button
              onClick={() => setShowAdminAuthModal(true)}
              className="text-stone-400 hover:text-stone-800 transition-colors flex items-center gap-1 font-mono hover:underline"
              title="Restricted Staff Authentication Portal"
            >
              <KeyRound className="w-3.5 h-3.5 text-stone-400" />
              <span>Staff Gateway</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
