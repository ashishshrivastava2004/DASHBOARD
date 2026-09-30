import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, ShoppingCart, Mail, Trash2, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react';

export const AbandonedCartsView: React.FC = () => {
  const [carts, setCarts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Indian Currency Formatter
  const formatINR = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 1. Fetch Live Abandoned Carts
  const fetchCarts = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const { data, error } = await supabase.from('abandoned_carts').select('*');
      if (error) throw error;
      
      if (data) {
        const sortedData = data.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        setCarts(sortedData);
      }
    } catch (err: any) {
      console.warn("Abandoned carts fetch error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();

    const channel = supabase
      .channel('public:abandoned_carts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'abandoned_carts' },
        () => fetchCarts(true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. Update Status
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await supabase.from('abandoned_carts').update({ status: newStatus }).eq('id', id);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  // 3. Delete Cart Record
  const deleteCart = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this cart record?")) return;
    try {
      await supabase.from('abandoned_carts').delete().eq('id', id);
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // 4. Export CSV
  const exportCSV = () => {
    const headers = 'Customer,Email,Items,Total Value,Status,Date\n';
    const rows = filteredCarts
      .map(c => `"${c.customer_name || ''}","${c.customer_email || ''}",${c.items_count || 0},${typeof c.total_value === 'string' ? parseFloat(c.total_value) : (c.total_value || 0)},"${c.status || 'pending'}","${c.created_at}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `abandoned_carts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering & Pagination
  const filteredCarts = useMemo(() => {
    return carts.filter((c) => {
      const matchFilter = statusFilter === 'all' || c.status === statusFilter;
      const matchSearch = 
        (c.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.customer_email || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [carts, statusFilter, searchQuery]);

  const paginatedCarts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCarts.slice(start, start + itemsPerPage);
  }, [filteredCarts, currentPage]);

  const totalPages = Math.ceil(filteredCarts.length / itemsPerPage) || 1;

  // Potential Revenue Calculation
  const potentialRevenue = useMemo(() => {
    return filteredCarts.reduce((acc, curr) => {
      if (curr.status !== 'recovered' && curr.status !== 'lost') {
        return acc + (typeof curr.total_value === 'string' ? parseFloat(curr.total_value) : (curr.total_value || 0));
      }
      return acc;
    }, 0);
  }, [filteredCarts]);

  return (
    <div className="space-y-5 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div>
          <h1 className="font-clash text-2xl font-bold text-neutral-900 tracking-tight">Abandoned Carts</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Track unfinished checkouts and recover lost revenue in INR.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">Potential Recovery</span>
            <span className="font-clash text-lg font-bold text-neutral-900 tabular-nums">{formatINR(potentialRevenue)}</span>
          </div>
          <button
            onClick={exportCSV}
            className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-neutral-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-900" />
          </div>
        )}

        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search email or name..."
                className="w-full sm:w-64 h-8 text-xs bg-[#F9FAFB] hover:bg-[#F3F4F6] focus:bg-white border border-[#E5E7EB] focus:border-neutral-900 rounded-lg pl-8 pr-3 focus:outline-none transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 px-2.5 text-xs bg-white border border-[#E5E7EB] rounded-lg text-neutral-700 focus:outline-none focus:border-neutral-900 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reminded">Reminded</option>
              <option value="recovered">Recovered</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div className="text-xs text-neutral-500">
            Total Carts: <span className="font-semibold text-neutral-900">{filteredCarts.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-neutral-500 uppercase tracking-wider font-medium text-[11px]">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Cart Value</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {!isLoading && paginatedCarts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-neutral-500">
                    <ShoppingCart className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                    <p className="font-medium text-neutral-900">No abandoned carts found</p>
                  </td>
                </tr>
              ) : (
                paginatedCarts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-[#F9FAFB] transition-colors group">
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-neutral-900">{cart.customer_name || 'Guest User'}</p>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{cart.customer_email || 'No email provided'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-neutral-700">
                      {cart.items_count || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-neutral-900 tabular-nums">
                      {formatINR(typeof cart.total_value === 'string' ? parseFloat(cart.total_value) : (cart.total_value || 0))}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded border inline-block ${
                          cart.status === 'recovered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          cart.status === 'reminded' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          cart.status === 'lost' ? 'bg-neutral-100 text-neutral-600 border-neutral-300' : 
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {cart.status ? cart.status.charAt(0).toUpperCase() + cart.status.slice(1) : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[10px] text-neutral-500 font-mono whitespace-nowrap">
                      {cart.created_at ? new Date(cart.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {cart.customer_email && cart.status !== 'recovered' && (
                          <a 
                            href={`mailto:${cart.customer_email}?subject=Did you forget something?&body=Hi ${cart.customer_name || 'there'},\n\nWe noticed you left some items in your cart. Come back and complete your purchase!`}
                            onClick={() => updateStatus(cart.id, 'reminded')}
                            className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" 
                            title="Send Recovery Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {cart.status !== 'recovered' && (
                          <button 
                            onClick={() => updateStatus(cart.id, 'recovered')}
                            className="p-1.5 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer" 
                            title="Mark as Recovered"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteCart(cart.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" 
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div>Showing <span className="font-medium text-neutral-900">{paginatedCarts.length}</span> of <span className="font-medium text-neutral-900">{filteredCarts.length}</span> carts</div>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="p-1.5 rounded border border-[#E5E7EB] bg-white text-neutral-600 hover:text-neutral-900 disabled:opacity-50 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-mono">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="p-1.5 rounded border border-[#E5E7EB] bg-white text-neutral-600 hover:text-neutral-900 disabled:opacity-50 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};