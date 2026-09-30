import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../lib/currency';
import {
  LayoutDashboard,
  ShoppingBag,
  Sparkles,
  Package,
  Users,
  Settings2,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Database,
  ArrowUpRight,
  Check,
  ShoppingCart, // Naya icon Carts ke liye
  Heart,        // Naya icon Wishlist ke liye
  Star,         // Naya icon Reviews ke liye
} from 'lucide-react';

export type NavTab = 'overview' | 'orders' | 'abandoned_carts' | 'waitlist' | 'products' | 'customers' | 'wishlist' | 'reviews' | 'settings';

interface DashboardLayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  children: React.ReactNode;
  pendingOrdersCount?: number;
  activeWaitlistCount?: number;
  onSearchQuery?: (q: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
  pendingOrdersCount = 2,
  activeWaitlistCount = 8,
  onSearchQuery,
}) => {
  const { user, signOut, isConfigured } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(2);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // YAHAN HUA HAI ASLI MAGIC: 7 Tables ka exact mapping
  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard },
    {
      id: 'orders' as NavTab,
      label: 'Orders',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount}` : undefined,
    },
    { id: 'abandoned_carts' as NavTab, label: 'Abandoned Carts', icon: ShoppingCart },
    {
      id: 'waitlist' as NavTab,
      label: 'Waitlist (Drop 01)',
      icon: Sparkles,
      highlight: true,
      badge: activeWaitlistCount > 0 ? `${activeWaitlistCount}` : undefined,
    },
    { id: 'products' as NavTab, label: 'Products', icon: Package },
    { id: 'customers' as NavTab, label: 'Customers', icon: Users },
    { id: 'wishlist' as NavTab, label: 'Wishlist', icon: Heart },
    { id: 'reviews' as NavTab, label: 'Reviews', icon: Star },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings2 },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearchQuery) {
      onSearchQuery(e.target.value);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile hamburger & Store Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 -ml-1 text-neutral-600 hover:text-neutral-900 rounded-md hover:bg-neutral-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <span className="font-clash text-lg font-bold tracking-tight text-neutral-900">
              A & A
            </span>
            <span className="hidden sm:inline-block text-xs font-normal text-neutral-400">/</span>
            <span className="hidden sm:inline-block text-xs text-neutral-500 font-medium">
              Drop 01 Edition
            </span>
          </div>
        </div>

        {/* Center: Global Search Input */}
        <div className="flex-1 max-w-md mx-4 sm:mx-8">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search orders, waitlist emails, SKUs..."
              className="w-full h-8.5 bg-[#F9FAFB] hover:bg-[#F3F4F6] focus:bg-white border border-[#E5E7EB] focus:border-neutral-900 rounded-lg pl-9 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
            />
          </div>
        </div>

        {/* Right: Notifications & Admin Profile */}
        <div className="flex items-center gap-2">
          {/* Supabase Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-[11px] text-neutral-600">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-medium text-neutral-700">
              {isConfigured ? 'Supabase Live' : 'Demo State'}
            </span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setUnreadCount(0);
              }}
              className="p-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-[#F3F4F6] transition-colors relative"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-neutral-900 rounded-full ring-2 ring-white" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E7EB] rounded-xl shadow-lg p-3 z-40">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E7EB]">
                  <span className="text-xs font-semibold text-neutral-900">Notifications</span>
                  <span className="text-[11px] text-neutral-400">Real-time alerts</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors cursor-pointer">
                    <p className="text-xs font-medium text-neutral-900">Waitlist Spike Detected</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Drop 01 queue reached +34% registration velocity.
                    </p>
                    <span className="text-[10px] text-neutral-400 mt-1 block">12m ago</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors cursor-pointer">
                    <p className="text-xs font-medium text-neutral-900">Paid Order #1049</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Helena Vance ordered 2 items ({formatINR(420)}).
                    </p>
                    <span className="text-[10px] text-neutral-400 mt-1 block">45m ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-lg hover:bg-[#F3F4F6] transition-colors border border-transparent hover:border-[#E5E7EB]"
            >
              <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="hidden sm:inline-block text-xs font-medium text-neutral-800 max-w-[130px] truncate">
                {user?.email || 'Admin'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-lg p-2 z-40">
                <div className="px-3 py-2 border-b border-[#E5E7EB] mb-1">
                  <p className="text-xs font-semibold text-neutral-900 truncate">
                    {user?.email}
                  </p>
                  <p className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                    <span>{user?.role || 'Store Administrator'}</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-medium">Active</span>
                  </p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('settings');
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-neutral-700 hover:bg-[#F3F4F6] rounded-md transition-colors text-left"
                  >
                    <span>Store Settings & Supabase</span>
                    <Settings2 className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('waitlist');
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-neutral-700 hover:bg-[#F3F4F6] rounded-md transition-colors text-left"
                  >
                    <span>Drop 01 Waitlist Hub</span>
                    <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                </div>

                <div className="pt-1 mt-1 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors text-left font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main App Body with Sidebar */}
      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-60 bg-white border-r border-[#E5E7EB] flex-col justify-between p-3 shrink-0">
          <div className="space-y-6">
            {/* Quick Context Card */}
            <div className="px-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
                Storefront
              </span>
              <span className="font-clash text-xs font-semibold text-neutral-900 block mt-0.5">
                Atelier Monolith NYC
              </span>
              <span className="text-[11px] text-neutral-500">Live · Currency INR (₹)</span>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              <span className="px-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                Operations
              </span>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#F3F4F6] text-neutral-900 font-semibold'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded font-mono tabular-nums ${
                          item.highlight
                            ? 'bg-neutral-900 text-white font-semibold'
                            : 'bg-neutral-200 text-neutral-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Info: Supabase Status */}
          <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-700 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-neutral-500" />
                <span>Supabase Core</span>
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isConfigured ? 'CONNECTED' : 'STANDBY'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              {isConfigured
                ? 'Active tables: 7 Live Tables Synced.'
                : 'Plug keys into .env to route queries to your cloud database.'}
            </p>
            <button
              type="button"
              onClick={() => onSelectTab('settings')}
              className="text-[11px] text-neutral-900 hover:underline font-medium flex items-center gap-1"
            >
              <span>View Schema & Keys</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col justify-between p-4 shadow-xl z-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                  <span className="font-clash text-lg font-bold text-neutral-900">
                    ATELIER.
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-md text-neutral-500 hover:text-neutral-900"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#F3F4F6] text-neutral-900 font-semibold'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-neutral-500" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-xs bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded font-mono">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out ({user?.email})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Viewport Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};