import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Plus, Eye, ShoppingBag, Download, ChevronLeft, ChevronRight, Loader2, X, Save, Trash2, CheckCircle2 } from 'lucide-react';

export const OrdersView: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    total: 0,
    status: 'unfulfilled',
    payment_status: 'pending'
  });

  // Indian Currency Formatter
  const formatINR = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 1. Fetch Live Orders
  const fetchOrders = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const { data, error } = await supabase.from('orders').select('*');
      if (error) throw error;
      
      if (data) {
        const sortedData = data.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        setOrders(sortedData);
      }
    } catch (err: any) {
      console.warn("Orders fetch error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Real-time listener
    const channel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders(true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. Open Add Drawer
  const openAddDrawer = () => {
    setEditingOrder(null);
    setFormData({
      customer_name: '',
      customer_email: '',
      total: 0,
      status: 'unfulfilled',
      payment_status: 'pending'
    });
    setIsDrawerOpen(true);
  };

  // 3. Open Edit/View Drawer
  const openEditDrawer = (order: any) => {
    setEditingOrder(order);
    setFormData({
      customer_name: order.customer_name || '',
      customer_email: order.customer_email || '',
      total: typeof order.total === 'string' ? parseFloat(order.total) : (order.total || 0),
      status: order.status || 'unfulfilled',
      payment_status: order.payment_status || 'pending'
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingOrder(null);
  };

  // 4. Save Order (Insert or Update)
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingOrder) {
        // Update existing order
        const { error } = await supabase
          .from('orders')
          .update(formData)
          .eq('id', editingOrder.id);
        if (error) throw error;
      } else {
        // Create new order with a generated order number
        const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
        const { error } = await supabase
          .from('orders')
          .insert([{ ...formData, order_number: orderNumber }]);
        if (error) throw error;
      }
      closeDrawer();
    } catch (err: any) {
      alert("Failed to save order: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Quick Fulfill Status Update
  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  // 6. Delete Order
  const deleteOrder = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this order?")) return;
    try {
      await supabase.from('orders').delete().eq('id', id);
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // 7. Export CSV
  const exportCSV = () => {
    const headers = 'Order Number,Customer Name,Email,Total,Status,Payment,Created At\n';
    const rows = filteredOrders
      .map(
        (o) =>
          `"${o.order_number || ''}","${o.customer_name || ''}","${o.customer_email || ''}",${typeof o.total === 'string' ? parseFloat(o.total) : (o.total || 0)},"${o.status || ''}","${o.payment_status || ''}","${o.created_at || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Pagination
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesFilter = statusFilter === 'all' || order.status === statusFilter;
      const matchesSearch =
        (order.order_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer_email || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;

  // UI Badges Helper
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'fulfilled': return <span className="inline-flex items-center text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Fulfilled</span>;
      case 'unfulfilled': return <span className="inline-flex items-center text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Unfulfilled</span>;
      case 'in_progress': return <span className="inline-flex items-center text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">In Progress</span>;
      case 'cancelled': return <span className="inline-flex items-center text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300">Cancelled</span>;
      default: return <span className="inline-flex items-center text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300 capitalize">{status || 'Pending'}</span>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="text-[11px] font-medium text-neutral-800 capitalize">Paid</span>;
      case 'pending': return <span className="text-[11px] font-medium text-amber-700 capitalize">Payment Pending</span>;
      case 'refunded': return <span className="text-[11px] font-medium text-neutral-500 capitalize">Refunded</span>;
      default: return <span className="text-[11px] font-medium text-neutral-800 capitalize">{status || 'Paid'}</span>;
    }
  };

  return (
    <div className="space-y-5 relative">
      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div>
          <h1 className="font-clash text-2xl font-bold text-neutral-900 tracking-tight">Orders</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Manage and fulfill your customer orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-neutral-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button onClick={openAddDrawer} className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-900" />
          </div>
        )}

        {/* Controls */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Search orders, customers..." className="w-full sm:w-64 h-8 text-xs bg-[#F9FAFB] hover:bg-[#F3F4F6] focus:bg-white border border-[#E5E7EB] focus:border-neutral-900 rounded-lg pl-8 pr-3 focus:outline-none transition-colors" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }} className="h-8 px-2.5 text-xs bg-white border border-[#E5E7EB] rounded-lg text-neutral-700 focus:outline-none focus:border-neutral-900 cursor-pointer">
              <option value="all">All Statuses</option>
              <option value="unfulfilled">Unfulfilled</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="in_progress">In Progress</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="text-xs text-neutral-500">
            Total: <span className="font-semibold text-neutral-900">{filteredOrders.length}</span> orders
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-neutral-500 uppercase tracking-wider font-medium text-[11px]">
              <tr>
                <th className="py-3 px-4">Order Number</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] bg-white">
              {!isLoading && paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-neutral-500">
                    <ShoppingBag className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                    <p className="font-medium text-neutral-900">No orders found</p>
                    <p className="text-[11px] mt-1">Create a new order or adjust your filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#F9FAFB] transition-colors cursor-pointer group" onClick={() => openEditDrawer(order)}>
                    <td className="py-3.5 px-4 font-medium text-neutral-900 whitespace-nowrap">
                      <span className="font-semibold group-hover:underline">
                        {order.order_number || `ORD-${order.id?.substring(0, 6).toUpperCase()}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-500 font-mono text-[11px] whitespace-nowrap tabular-nums">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-medium text-neutral-900">{order.customer_name || 'Guest'}</p>
                      <p className="text-[11px] text-neutral-400 truncate w-32">{order.customer_email || 'No email'}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{getPaymentStatusBadge(order.payment_status)}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{getOrderStatusBadge(order.status)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-neutral-900 whitespace-nowrap tabular-nums">
                      {formatINR(typeof order.total === 'string' ? parseFloat(order.total) : (order.total || 0))}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {order.status === 'unfulfilled' && (
                          <button onClick={() => updateOrderStatus(order.id, 'fulfilled')} className="p-1.5 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer" title="Mark as Fulfilled">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => openEditDrawer(order)} className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" title="View/Edit Details">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteOrder(order.id)} className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" title="Delete Order">
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

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div>Showing <span className="font-medium text-neutral-900">{paginatedOrders.length}</span> of <span className="font-medium text-neutral-900">{filteredOrders.length}</span> orders</div>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="p-1.5 rounded border border-[#E5E7EB] bg-white text-neutral-600 hover:text-neutral-900 disabled:opacity-50 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-mono">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="p-1.5 rounded border border-[#E5E7EB] bg-white text-neutral-600 hover:text-neutral-900 disabled:opacity-50 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* --- ADD / EDIT SLIDING DRAWER --- */}
      {isDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-neutral-900/30 backdrop-blur-sm z-40 transition-opacity" onClick={closeDrawer} />
          
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-[#E5E7EB] transform transition-transform duration-300 translate-x-0">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <h2 className="font-clash text-lg font-bold text-neutral-900">
                {editingOrder ? `Edit Order ${editingOrder.order_number}` : 'Create Manual Order'}
              </h2>
              <button onClick={closeDrawer} className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-[#E5E7EB] rounded-md transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <form id="orderForm" onSubmit={handleSaveOrder} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Customer Name *</label>
                  <input required type="text" value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} className="w-full text-sm bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-900 transition-all" placeholder="e.g. John Doe" />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Customer Email *</label>
                  <input required type="email" value={formData.customer_email} onChange={(e) => setFormData({...formData, customer_email: e.target.value})} className="w-full text-sm bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-900 transition-all font-mono" placeholder="john@example.com" />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Total Amount (₹) *</label>
                  <input required type="number" step="0.01" min="0" value={formData.total} onChange={(e) => setFormData({...formData, total: parseFloat(e.target.value) || 0})} className="w-full text-sm bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-900 transition-all tabular-nums" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Fulfillment Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full text-sm bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-900 cursor-pointer">
                      <option value="unfulfilled">Unfulfilled</option>
                      <option value="in_progress">In Progress</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Payment Status</label>
                    <select value={formData.payment_status} onChange={(e) => setFormData({...formData, payment_status: e.target.value})} className="w-full text-sm bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-900 cursor-pointer">
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-end gap-3">
              <button type="button" onClick={closeDrawer} className="px-4 py-2 text-xs font-medium text-neutral-700 bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] rounded-lg transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="submit" form="orderForm" disabled={isSaving} className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-black rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-70">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSaving ? 'Saving...' : 'Save Order'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};