import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Wrench, 
  ShieldAlert, 
  PlusCircle, 
  Radio, 
  MapPin, 
  ChevronDown, 
  Bell, 
  LogIn, 
  UserPlus, 
  User,
  LogOut,
  FileText,
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
  activeTab: 'directory' | 'requests' | 'broadcast' | 'admin' | 'map';
  setActiveTab: (tab: 'directory' | 'requests' | 'broadcast' | 'admin' | 'map') => void;
  onOpenCreateListing: () => void;
  onOpenBroadcast: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateListing,
  onOpenBroadcast,
  onOpenAuth,
  onOpenProfile,
}) => {
  const { 
    currentUser, 
    users, 
    setCurrentUserById, 
    rentalRequests, 
    isAuthenticated,
    unreadNotificationsCount,
    logout,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // User-isolated rentals count
  const myRentalsCount = rentalRequests.filter(
    r => r.lenderId === currentUser.id || r.borrowerId === currentUser.id
  ).length;

  // Incoming pending requests count for items owned by this user
  const pendingRequestsCount = rentalRequests.filter(
    r => r.lenderId === currentUser.id && r.status === 'requested'
  ).length;
  const displayedStanding = currentUser.standing || (currentUser.rating < 3.0 ? 'Red Badge' : 'Active');

  // Active disputes count
  const mobileTabs: { id: HeaderProps['activeTab']; label: string }[] = [
    { id: 'directory', label: 'Inventory' },
    { id: 'requests', label: `Rental Track (${myRentalsCount})` },
    { id: 'broadcast', label: 'Broadcasts' },
    { id: 'map', label: 'Radius Map' },
  ];
  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-40">
      {/* Blacklist banner if user is blacklisted */}
      {isAuthenticated && currentUser.isBlacklisted && (
        <div className="bg-red-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              ACCOUNT RESTRICTED: You are currently blacklisted by platform administration.
              {currentUser.blacklistedReason && ` Reason: "${currentUser.blacklistedReason}".`} Borrowing capabilities are locked and your listings are hidden.
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 min-h-16 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2 lg:flex-nowrap lg:gap-8 lg:py-0">
        {/* Zone 1: Brand wordmark (single text element wordmark, no pill badge) */}
        <button 
          onClick={() => setActiveTab('directory')} 
          className="text-left flex items-center gap-2.5 min-w-0 group focus-visible:outline-none"
        >
          <div className="w-9 h-9 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center font-bold tracking-tight shrink-0">
            <Wrench className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <span className="block truncate text-sm sm:text-base font-bold tracking-tight text-stone-900 group-hover:text-stone-700 transition-colors">
              Community Tool & Appliance Directory
            </span>
            <div className="text-[10px] sm:text-[11px] text-stone-600 font-medium tracking-normal truncate">
              Peer lending & equipment sharing
            </div>
          </div>
        </button>

        {/* Zone 2: 4-5 single-line clean nav links */}
        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-stone-600">
          <button
            onClick={() => setActiveTab('directory')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-900 ${
              activeTab === 'directory' ? 'text-stone-900 font-semibold border-b-2 border-stone-900 py-5' : 'py-5'
            }`}
          >
            Inventory Catalog
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-900 relative ${
              activeTab === 'requests' ? 'text-stone-900 font-semibold border-b-2 border-stone-900 py-5' : 'py-5'
            }`}
          >
            Rental Track ({myRentalsCount})
            {pendingRequestsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-stone-950 text-[10px] font-bold rounded-sm">
                {pendingRequestsCount} new
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-900 ${
              activeTab === 'broadcast' ? 'text-stone-900 font-semibold border-b-2 border-stone-900 py-5' : 'py-5'
            }`}
          >
            Broadcast Demands
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-900 ${
              activeTab === 'map' ? 'text-stone-900 font-semibold border-b-2 border-stone-900 py-5' : 'py-5'
            }`}
          >
            Radius Map
          </button>
        </nav>

        {/* Zone 3: Actions & Auth / Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {isAuthenticated ? (
            <>
              {/* Notification Bell Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors relative"
                  title="Notifications & Activity"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white" />
                  )}
                </button>

                {showNotifications && (
                  <NotificationDropdown
                    onClose={() => setShowNotifications(false)}
                    onNavigateTab={setActiveTab}
                  />
                )}
              </div>

              {/* Authenticated Account Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-medium text-stone-800 transition-colors min-w-0"
                  title="Manage account profile and rentals"
                >
                  <div className="text-left hidden sm:block">
                    <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                      {currentUser.isBlacklisted ? (
                        <span className="text-[10px] text-red-600 font-bold tracking-wider">[BLACKLISTED]</span>
                      ) : currentUser.role === 'admin' || currentUser.role === 'assistant' ? (
                        <span className="text-[10px] text-amber-600 font-bold font-mono">
                          {currentUser.role === 'assistant' ? '[ASSISTANT ADMIN]' : '[ADMIN]'}
                        </span>
                      ) : currentUser.role === 'moderator' ? (
                        <span className="text-[10px] text-blue-600 font-bold font-mono">[MODERATOR]</span>
                      ) : (
                        <span className={`text-[10px] font-bold ${
                          displayedStanding === 'Red Badge' ? 'text-red-600'
                            : displayedStanding === 'Suspicious' ? 'text-orange-600'
                              : displayedStanding === 'Monitoring' ? 'text-blue-600'
                                : displayedStanding === 'Improving' ? 'text-violet-600'
                                  : 'text-emerald-600'
                        }`}>
                          [{displayedStanding.toUpperCase()}]
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      {currentUser.neighborhood} &middot; {currentUser.rating.toFixed(1)} ★
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                </button>

                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowUserMenu(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-stone-200 shadow-xl py-2 z-20 overflow-hidden divide-y divide-stone-100">
                      {/* User Account Snapshot */}
                      <div className="px-4 py-3 bg-stone-50/70">
                        <div className="font-bold text-stone-900 text-xs truncate">
                          {currentUser.name}
                        </div>
                        <div className="text-[11px] text-stone-500 truncate font-mono">
                          {currentUser.email}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-[11px]">
                          <span className="px-1.5 py-0.5 rounded bg-stone-200 text-stone-800 font-semibold font-mono text-[10px]">
                            {currentUser.role === 'admin'
                              ? 'System Administrator'
                              : currentUser.role === 'assistant'
                                ? 'Assistant Administrator'
                                : currentUser.role === 'moderator'
                                  ? 'Moderator'
                                  : 'Community Resident'}
                          </span>
                          <span className="text-stone-400">&middot;</span>
                          <span className="text-stone-600 font-mono">
                            {currentUser.totalLent} lent &middot; {currentUser.totalBorrowed} borrowed
                          </span>
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenProfile();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 hover:text-stone-900 flex items-center gap-2.5 transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-stone-500" />
                          <span>My Account Profile &amp; Standing</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setActiveTab('requests');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 hover:text-stone-900 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-3.5 h-3.5 text-stone-500" />
                            <span>My Private Rental Track</span>
                          </div>
                          {myRentalsCount > 0 && (
                            <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded font-semibold">
                              {myRentalsCount}
                            </span>
                          )}
                        </button>

                      </div>

                      {/* Switch Account & Logout */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenAuth('login');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-900 flex items-center gap-2.5 transition-colors"
                        >
                          <LogIn className="w-3.5 h-3.5 text-stone-500" />
                          <span>Sign in with different account</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors font-semibold"
                        >
                          <LogOut className="w-3.5 h-3.5 text-red-600" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Primary Action Button: Any resident can list their tool or broadcast! */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenCreateListing}
                  className="px-2 sm:px-3 py-2 text-xs font-semibold text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
                  title="List your idle power tool or appliance for neighbors to rent"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">List Tool / Item</span>
                </button>

                <button
                  onClick={onOpenBroadcast}
                  className="hidden sm:flex px-2.5 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors items-center gap-1 whitespace-nowrap shrink-0"
                  title="Broadcast equipment need to nearby neighbors"
                >
                  <Radio className="w-3.5 h-3.5 text-amber-600" />
                  <span>Broadcast</span>
                </button>
              </div>

                    </>
          ) : (
            /* Guest / Logged Out state */
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <nav className="xl:hidden flex items-center gap-1 overflow-x-auto border-t border-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600">
        {mobileTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 whitespace-nowrap rounded-md px-3 py-2 transition-colors ${
              activeTab === tab.id
                ? 'bg-stone-900 text-white font-semibold'
                : 'hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

    </header>
  );
};
