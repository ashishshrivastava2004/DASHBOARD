import React, { useState, useMemo } from 'react';
import { Order, WaitlistEntry } from '../../types';
import {
  TrendingUp, ShoppingBag, Sparkles, ArrowUpRight, ArrowDownRight, Download, Plus, Eye, ChevronLeft, ChevronRight, Search,
} from 'lucide-react';

interface OverviewProps {
  orders: Order[];
  waitlist: WaitlistEntry[];
  onSelectOrder: (order: Order) => void;
  onOpenNewOrder: () => void;
  onOpenNewWaitlist: () => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onSelectTab: (tab: any) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  orders,
  waitlist,
  onSelectOrder,
  onOpenNewOrder,
  onOpenNewWaitlist,
  onUpdateOrderStatus,
  onSelectTab,
}) => {
  const [activeTableTab, setActiveTableTab] = useState<'orders' | 'waitlist'>('orders');
  const [orderFilter, setOrderFilter] = useState<'all' | Order['status']>('all');
  const [waitlistFilter, setWaitlistFilter] = useState<'all' | WaitlistEntry['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Indian Currency Formatter Helper
  const formatINR = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // KPIs Calculation based on real database data
  const kpis = useMemo(() => {
    const totalSales = orders.reduce((sum, o) => {
      const amount = typeof o.total === 'string' ? parseFloat(o.total) : (o.total || 0);
      return sum + amount;
    }, 0);
    
    const pendingOrders = orders.filter((o) => o.status === 'unfulfilled').length;
    const aov = orders.length > 0 ? totalSales / orders.length : 0;
    const activeWaitlistCount = waitlist.length;

    return {
      totalSales: totalSales, 
      salesGrowth: totalSales > 0 ? 18.4 : 0, // Placeholder growth logic
      activeWaitlist: activeWaitlistCount,
      waitlistGrowth: activeWaitlistCount > 0 ? 34.2 : 0, // Placeholder growth logic
      pendingOrders: pendingOrders,
      pendingGrowth: pendingOrders > 0 ? -4.1 : 0, // Placeholder growth logic
      avgOrderValue: aov,
      aovGrowth: aov > 0 ? 6.2 : 0, // Placeholder growth logic
    };
  }, [orders, waitlist]);

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesFilter = orderFilter === 'all' || order.status === orderFilter;
      const matchesSearch =
        (order.order_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer_email || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [orders, orderFilter, searchQuery]);

  const filteredWaitlist = useMemo(() => {
    return waitlist.filter((entry) => {
      const matchesFilter = waitlistFilter === 'all' || entry.status === waitlistFilter;
      const matchesSearch =
        (entry.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.drop_code || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [waitlist, waitlistFilter, searchQuery]);

  // Pagination Logic
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const paginatedWaitlist = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredWaitlist.slice(start, start + itemsPerPage);
  }, [filteredWaitlist, currentPage]);

  const totalPages = Math.ceil(
    (activeTableTab === 'orders' ? filteredOrders.length : filteredWaitlist.length) / itemsPerPage
  ) || 1;

  // Export CSV Action
  const exportCSV = () => {
    if (activeTableTab === 'orders') {
      const headers = 'Order Number,Customer Name,Email,Total,Status,Payment,Created At\n';
      const rows = filteredOrders
        .map(
          (o) =>
            `"${o.order_number || ''}","${o.customer_name || ''}","${o.customer_email || ''}",${o.total || 0},"${o.status || ''}","${o.payment_status || ''}","${o.created_at || ''}"`
        )
        .join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `atelier_orders_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = 'Position,Name,Email,Drop,Tier,Referrals,Status\n';
      const rows = filteredWaitlist
        .map(
          (w) =>
            `${w.position || 1},"${w.full_name || ''}","${w.email || ''}","${w.drop_code || 'Drop 01'}","${w.tier || 'Standard'}","${w.referral_count || 0}","${w.status || ''}"`
        )
        .join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `atelier_waitlist_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getOrderStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'fulfilled': return <span className="inline-flex items-center text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Fulfilled</span>;
      case 'unfulfilled': return <span className="inline-flex items-center text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Unfulfilled</span>;
      case 'in_progress': return <span className="inline-flex items-center text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">In Progress</span>;
      case 'cancelled': return <span className="inline-flex items-center text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300">Cancelled</span>;
      default: return <span className="inline-flex items-center text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300 capitalize">{status || 'Pending'}</span>;
    }
  };

  const getPaymentStatusBadge = (status: Order['payment_status']) => {
    switch (status) {
      case 'paid': return <span className="text-[11px] font-medium text-neutral-800">Paid</span>;
      case 'pending': return <span className="text-[11px] font-medium text-amber-700">Payment Pending</span>;
      case 'refunded': return <span className="text-[11px] font-medium text-neutral-500">Refunded</span>;
      default: return <span className="text-[11px] font-medium text-neutral-800 capitalize">{status || 'Paid'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-clash text-base font-semibold text-neutral-900">Drop 01: Monolith Series</span>
            <span className="text-xs bg-neutral-900 text-white px-2 py-0.5 rounded font-mono font-medium">ACTIVE</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-xl">
            Real-time webhook sync enabled via Supabase (INR Currency Applied).
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button onClick={onOpenNewWaitlist} className="px-3 py-1.5 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-neutral-800 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
            <span>Add to Waitlist</span>
          </button>
          <button onClick={onOpenNewOrder} className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Total Net Sales</span>
              {kpis.salesGrowth !== 0 && (
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /><span>+{kpis.salesGrowth}%</span>
                </span>
              )}
            </div>
            <div className="mt-2">
              <span className="font-clash text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
                {formatINR(kpis.totalSales)}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-neutral-400">
            <span>Real-time metric</span>
            <span className="text-neutral-600 font-medium">{orders.length} total orders</span>
          </div>
        </div>

        {/* Active Waitlist */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Active Waitlist (Drop 01)</span>
              {kpis.waitlistGrowth !== 0 && (
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /><span>+{kpis.waitlistGrowth}%</span>
                </span>
              )}
            </div>
            <div className="mt-2">
              <span className="font-clash text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
                {kpis.activeWaitlist.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-neutral-400">
            <span>VIP conversion</span>
            <span className="text-neutral-600 font-medium">Tracking Active</span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Fulfillment Backlog</span>
              {kpis.pendingGrowth !== 0 && (
                <span className="text-[11px] text-neutral-600 font-medium flex items-center gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" /><span>{kpis.pendingGrowth}%</span>
                </span>
              )}
            </div>
            <div className="mt-2">
              <span className="font-clash text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
                {kpis.pendingOrders}
              </span>
              <span className="text-xs text-neutral-500 font-normal ml-2">unfulfilled</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-neutral-400">
            <span>Action Required</span>
            <span className="text-neutral-600 font-medium">Check Orders tab</span>
          </div>
        </div>

        {/* Avg Order Value */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Avg. Order Value</span>
              {kpis.aovGrowth !== 0 && (
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /><span>+{kpis.aovGrowth}%</span>
                </span>
              )}
            </div>
            <div className="mt-2">
              <span className="font-clash text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
                {formatINR(kpis.avgOrderValue)}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-neutral-400">
            <span>Calculated automatically</span>
            <span className="text-neutral-600 font-medium">Dynamic</span>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-1 p-1 bg-[#F3F4F6] rounded-lg">
            <button onClick={() => { setActiveTableTab('orders'); setCurrentPage(1); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${activeTableTab === 'orders' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-600 hover:text-neutral-900'}`}>
              Recent Orders ({orders.length})
            </button>
            <button onClick={() => { setActiveTableTab('waitlist'); setCurrentPage(1); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${activeTableTab === 'waitlist' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-600 hover:text-neutral-900'}`}>
              Waitlist Signups ({waitlist.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder={activeTableTab === 'orders' ? 'Filter orders...' : 'Filter waitlist...'}
                className="w-48 sm:w-56 h-8 text-xs bg-[#F9FAFB] hover:bg-[#F3F4F6] focus:bg-white border border-[#E5E7EB] focus:border-neutral-900 rounded-lg pl-8 pr-3 focus:outline-none"
              />
            </div>

            {activeTableTab === 'orders' ? (
              <select
                value={orderFilter}
                onChange={(e) => { setOrderFilter(e.target.value as any); setCurrentPage(1); }}
                className="h-8 px-2.5 text-xs bg-white border border-[#E5E7EB] rounded-lg text-neutral-700 focus:outline-none focus:border-neutral-900 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="unfulfilled">Unfulfilled</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="in_progress">In Progress</option>
                <option value="cancelled">Cancelled</option>
              </select>
            ) : (
              <select
                value={waitlistFilter}
                onChange={(e) => { setWaitlistFilter(e.target.value as any); setCurrentPage(1); }}
                className="h-8 px-2.5 text-xs bg-white border border-[#E5E7EB] rounded-lg text-neutral-700 focus:outline-none focus:border-neutral-900 cursor-pointer"
              >
                <option value="all">All States</option>
                <option value="waiting">Waiting</option>
                <option value="invited">Invited</option>
                <option value="claimed">Claimed</option>
              </select>
            )}

            <button onClick={exportCSV} className="h-8 px-3 text-xs font-medium text-neutral-700 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg flex items-center gap-1.5 cursor-pointer">
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Orders Table */}
        {activeTableTab === 'orders' && (
          <div className="overflow-x-auto min-h-[250px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-neutral-500 uppercase tracking-wider font-medium text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold text-neutral-700">Order</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700">Date</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700">Customer</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700">Payment</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700">Status</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700 text-right">Total</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] bg-white">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-500">
                      <ShoppingBag className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-neutral-800">No orders found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#F9FAFB] transition-colors cursor-pointer group" onClick={() => onSelectOrder(order)}>
                      <td className="py-3.5 px-4 font-medium text-neutral-900 whitespace-nowrap">
                        <span className="font-semibold underline decoration-neutral-300 group-hover:decoration-neutral-900">
                          {order.order_number || `ORD-${order.id?.substring(0,6).toUpperCase()}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500 whitespace-nowrap font-mono tabular-nums text-[11px]">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-medium text-neutral-900">{order.customer_name || 'Guest'}</p>
                        <p className="text-neutral-400 text-[11px] truncate max-w-[150px]">{order.customer_email || 'No email'}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">{getPaymentStatusBadge(order.payment_status)}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">{getOrderStatusBadge(order.status)}</td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-mono tabular-nums font-semibold text-neutral-900">
                          {formatINR(typeof order.total === 'string' ? parseFloat(order.total) : (order.total || 0))}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => onSelectOrder(order)} className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F4F6] rounded-md transition-colors cursor-pointer">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {order.status === 'unfulfilled' && (
                            <button onClick={() => onUpdateOrderStatus(order.id, 'fulfilled')} className="px-2 py-1 bg-neutral-900 hover:bg-black text-white text-[11px] font-medium rounded transition-colors cursor-pointer">
                              Fulfill
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Waitlist Table */}
        {activeTableTab === 'waitlist' && (
          <div className="overflow-x-auto min-h-[250px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-neutral-500 uppercase tracking-wider font-medium text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold text-neutral-700">Queue #</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700">Subscriber</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700">Status</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] bg-white">
                {paginatedWaitlist.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-neutral-500">
                      <Sparkles className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-neutral-800">No waitlist entries found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedWaitlist.map((entry, index) => (
                    <tr key={entry.id || index} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">#{(entry.position || index + 1).toString().padStart(3, '0')}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-neutral-900">{entry.full_name || entry.name || 'Anonymous'}</p>
                        <p className="text-neutral-400 text-[11px] font-mono">{entry.email}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${entry.status === 'invited' ? 'bg-blue-50 text-blue-700 border-blue-200' : entry.status === 'claimed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-50 text-neutral-700 border-neutral-200'}`}>
                          {entry.status === 'invited' ? 'Invite Sent' : entry.status === 'claimed' ? 'Converted' : 'In Queue'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button onClick={() => onSelectTab('waitlist')} className="text-xs text-neutral-900 hover:underline font-medium cursor-pointer">
                          Manage Drop
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div>
            Showing {activeTableTab === 'orders' ? paginatedOrders.length : paginatedWaitlist.length} of {activeTableTab === 'orders' ? filteredOrders.length : filteredWaitlist.length} records
          </div>
          <div className="flex items-center gap-2">
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="p-1.5 rounded-md border border-[#E5E7EB] bg-white text-neutral-600 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-mono text-neutral-700 px-2">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="p-1.5 rounded-md border border-[#E5E7EB] bg-white text-neutral-600 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};