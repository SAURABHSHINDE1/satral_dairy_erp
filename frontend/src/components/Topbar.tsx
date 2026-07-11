import { Bell, User, LogOut, Search, Check, LogIn, Plus, Edit, Trash2, XCircle, AlertCircle, Menu } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';
import { notificationService } from '../services/notification.service';
import { formatDateTime } from '../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../lib/utils';
import type { ActivityLog } from '../types';
import { useUIStore } from '../store/ui.store';
import { useIsMobile } from '../hooks/useIsMobile';

export function Topbar() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [readIds, setReadIds] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem('readNotifIds');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const searchRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getRecentActivities(8),
    refetchInterval: 60000, // refresh every minute
    retry: false,
  });

  const activities: ActivityLog[] = notifData?.data || [];
  const unreadCount = activities.filter((a) => !readIds.has(a.id)).length;

  const markAllRead = () => {
    const allIds = new Set(activities.map((a) => a.id));
    setReadIds(allIds);
    localStorage.setItem('readNotifIds', JSON.stringify([...allIds]));
  };

  // Global keyboard shortcut Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (trimmed) {
      navigate(`/tank-records?search=${encodeURIComponent(trimmed)}`);
      setSearchValue('');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    clearAuth();
    navigate('/login');
  };

  const getActionIcon = (action: string) => {
    const iconMap: Record<string, any> = {
      login: LogIn,
      logout: LogOut,
      create: Plus,
      update: Edit,
      delete: Trash2,
      approve: Check,
      reject: XCircle,
    };
    const Icon = iconMap[action] || AlertCircle;
    return Icon;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      login: 'text-success-600 bg-success-100',
      logout: 'text-secondary-500 bg-secondary-100',
      create: 'text-primary-600 bg-primary-100',
      update: 'text-warning-600 bg-warning-100',
      delete: 'text-danger-600 bg-danger-100',
      approve: 'text-success-600 bg-success-100',
      reject: 'text-danger-600 bg-danger-100',
    };
    return colors[action] || 'text-secondary-500 bg-secondary-100';
  };

  const { toggleSidebar } = useUIStore();
  const isMobile = useIsMobile();

  return (
    <header className="bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700 px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center justify-between">
        {isMobile && (
          <button
            onClick={() => toggleSidebar()}
            className="mr-3 p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
          >
            <Menu className="w-5 h-5 text-text-secondary" />
          </button>
        )}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary group-focus-within:text-primary-600 transition-colors" />
            <input
              ref={searchRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setSearchValue('')}
              placeholder={isMobile ? "Search..." : "Search tank records... (Ctrl+K)"}
              className="w-full pl-10 pr-16 py-2 rounded-lg border border-secondary-300 bg-white dark:bg-secondary-800 dark:border-secondary-600 dark:text-secondary-100 dark:placeholder:text-secondary-500 text-text-primary placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            {searchValue ? (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">Press ↵</span>
            ) : (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-xs text-secondary-400 bg-secondary-100 border border-secondary-200 rounded">
                Ctrl K
              </kbd>
            )}
          </div>
        </form>

        <div className="flex items-center gap-3 ml-4">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
              className="p-2 rounded-lg hover:bg-secondary-100 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-text-secondary" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-danger-500 text-white text-xs font-bold rounded-full px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-secondary-800 rounded-xl shadow-strong border border-secondary-200 dark:border-secondary-700 z-50 overflow-hidden animate-fade-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-secondary-100">
                  <h4 className="font-semibold text-text-primary text-sm">Recent Activity</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary text-sm">
                      No recent activity
                    </div>
                  ) : (
                    activities.map((activity) => {
                      const isRead = readIds.has(activity.id);
                      const Icon = getActionIcon(activity.action);
                      const colorClass = getActionColor(activity.action);
                      return (
                        <div
                          key={activity.id}
                          className={cn(
                            'flex items-start gap-3 px-4 py-3 border-b border-secondary-50 hover:bg-secondary-50 transition-colors',
                            !isRead && 'bg-primary-50/30'
                          )}
                        >
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text-primary font-medium">{activity.full_name || 'System'}</p>
                            <p className="text-xs text-text-secondary line-clamp-1">{activity.details}</p>
                            <p className="text-xs text-text-secondary mt-0.5">{formatDateTime(activity.created_at)}</p>
                          </div>
                          {!isRead && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="px-4 py-2 border-t border-secondary-100">
                  <button
                    onClick={() => { navigate('/activity-logs'); setShowNotifications(false); }}
                    className="w-full text-center text-xs text-primary-600 hover:text-primary-800 font-medium py-1"
                  >
                    View all activity logs →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary-100 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-text-primary">{user?.full_name}</p>
                <p className="text-xs text-text-secondary capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-medium border border-secondary-200 py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-secondary-100 mb-1">
                  <p className="text-sm font-medium text-text-primary">{user?.full_name}</p>
                  <p className="text-xs text-text-secondary capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-text-secondary hover:bg-secondary-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
