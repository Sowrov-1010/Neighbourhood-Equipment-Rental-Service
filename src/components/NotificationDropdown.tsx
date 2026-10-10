import React from 'react';
import { useApp } from '../context/AppContext';
import { AppNotification } from '../types';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Radio, 
  CreditCard,
  FileCheck,
  ChevronRight
} from 'lucide-react';

interface NotificationDropdownProps {
  onClose: () => void;
  onNavigateTab: (tab: 'directory' | 'requests' | 'broadcast' | 'admin' | 'map') => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onClose,
  onNavigateTab,
}) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.linkTab) {
      onNavigateTab(notif.linkTab);
      onClose();
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'request':
        return <Clock className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'approval':
        return <Check className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'handover':
        return <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'dispute':
        return <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />;
      case 'broadcast':
        return <Radio className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-stone-500 shrink-0" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-stone-200 shadow-2xl py-2 z-30 overflow-hidden">
        <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-stone-700" />
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">
              Activity & Notifications
            </span>
          </div>
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllNotificationsAsRead}
              className="text-[11px] text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500">
              No recent alerts for your account.
            </div>
          ) : (
            notifications.map(notif => (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full text-left p-3.5 hover:bg-stone-50 transition-colors flex items-start gap-3 ${
                  !notif.read ? 'bg-amber-50/40' : ''
                }`}
              >
                <div className="mt-0.5">{getIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h5 className={`text-xs truncate ${!notif.read ? 'font-bold text-stone-900' : 'font-medium text-stone-700'}`}>
                      {notif.title}
                    </h5>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-600 line-clamp-2 mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-stone-400 font-mono mt-1 block">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 self-center shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
};
