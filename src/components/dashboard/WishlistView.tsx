import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Heart, Mail, Trash2, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Download, Plus, X, Save, Edit } from 'lucide-react';

export const WishlistView: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    product_name: '',
    product_price: 0,
    status: 'active'
  });

  // Indian Currency Formatter
  const formatINR = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 1. Fetch Live Wishlist Data
  const fetchWishlist = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const { data, error } = await supabase.from('wishlist').select('*');
      if (error) throw error;
      
      if (data) {
        const sortedData = data.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        setWishlistItems(sortedData);
      }
    } catch (err: any) {
      console.warn("Wishlist fetch error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
    const channel = supabase.channel('public:wishlist')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist' }, () => fetchWishlist(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // 2. Open Add Drawer
  const openAddDrawer = () => {
    setEditingItem(null);
    setFormData({ customer_name: '', customer_email: '', product_name: '', product_price: 0, status: 'active' });
    setIsDrawerOpen(true);
  };

  // 3. Open Edit Drawer
  const openEditDrawer = (item: any) => {
    setEditingItem(item);
    setFormData({
      customer_name: item.customer_name || '',
      customer_email: item.customer_email || '',
      product_name: item.product_name || '',
      product_price: typeof item.product_price === 'string' ? parseFloat(item.product_price) : (item.product_price || 0),
      status: item.status || 'active'
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingItem(null);
  };

  // 4. Save Item (Insert or Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingItem) {
        const { error } = await supabase.from('wishlist').update(formData).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('wishlist').insert([formData]);
        if (error) throw error;
      }
      closeDrawer();
    } catch (err: any) {
      alert("Failed to save wishlist item: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Update Status Quick Action
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await supabase.from('wishlist').update({ status: newStatus }).eq('id', id);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  // 6. Delete Record
  const deleteRecord = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this item?")) return;
    try {
      await supabase.from('wishlist').delete().eq('id', id);
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // 7. Export CSV
  const exportCSV = () => {
    const headers = 'Customer,Email,Product,Price,Status,Date Added\n';
    const rows = filteredItems
      .map(w => `"${w.customer_name || ''}","${w.customer_email || ''}","${w.product_name || ''}",${typeof w.product_price === 'string' ? parseFloat(w.product_price) : (w.product_price || 0)},"${w.status || 'active'}","${w.created_at}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wishlist_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // Filtering & Pagination
  const filteredItems = useMemo(() => {
    return wishlistItems.filter((item) => {
      const matchFilter = statusFilter === 'all' || item.status === statusFilter;
      const matchSearch = 
        (item.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.customer_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.product_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [wishlistItems, statusFilter, searchQuery]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;

  return (
    <div className="space-y-5 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div>
          <h1 className="font-clash text-2xl font-bold text-neutral-900 tracking-tight">Customer Wishlists</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Track saved products and send targeted promotions (INR).</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-neutral-700 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs">
            <Download className="w-3.5 h-3.5" /><span>Export CSV</span>
          </button>
          <button onClick={openAddDrawer} className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs">
            <Plus className="w-3.5 h-3.5" /><span>Add Record</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden relative min-h-[300px]">
        {isLoading && <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-neutral-900" /></div>}

        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Search product or customer..." className="w-full sm:w-64 h-8 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-8 pr-3" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="h-8 px-2.5 text-xs bg-white border border-[#E5E7EB] rounded-lg cursor-pointer">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="purchased">Purchased</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>
          <div className="text-xs text-neutral-500">Total Items: <span className="font-semibold text-neutral-900">{filteredItems.length}</span></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-neutral-500 uppercase tracking-wider font-medium text-[11px]">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Saved Product</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Date Added</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {!isLoading && paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-neutral-500">
                    <Heart className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                    <p className="font-medium text-neutral-900">No wishlist items found</p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F9FAFB] transition-colors group cursor-pointer" onClick={() => openEditDrawer(item)}>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-neutral-900 group-hover:underline">{item.customer_name || 'Guest User'}</p>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{item.customer_email || 'No email'}</p>
                    </td>
                    <td className="py-3.5 px-4"><p className="font-medium text-neutral-800 line-clamp-1">{item.product_name || 'Unknown Product'}</p></td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-neutral-900 tabular-nums">
                      {formatINR(typeof item.product_price === 'string' ? parseFloat(item.product_price) : (item.product_price || 0))}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded border inline-block ${item.status === 'purchased' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : item.status === 'dropped' ? 'bg-neutral-100 text-neutral-600 border-neutral-300' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Active'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[10px] text-neutral-500 font-mono whitespace-nowrap">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.customer_email && item.status === 'active' && (
                          <a href={`mailto:${item.customer_email}?subject=10% Off Your Favorite Item!`} className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Send Promo"><Mail className="w-3.5 h-3.5" /></a>
                        )}
                        {item.status === 'active' && (
                          <button onClick={() => updateStatus(item.id, 'purchased')} className="p-1.5 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Mark as Purchased"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                        )}
                        <button onClick={() => openEditDrawer(item)} className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteRecord(item.id)} className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div>Showing <span className="font-medium text-neutral-900">{paginatedItems.length}</span> of <span className="font-medium text-neutral-900">{filteredItems.length}</span> items</div>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="p-1.5 rounded border border-[#E5E7EB] bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-mono">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="p-1.5 rounded border border-[#E5E7EB] bg-white disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* --- ADD / EDIT DRAWER --- */}
      {isDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-neutral-900/30 backdrop-blur-sm z-40 transition-opacity" onClick={closeDrawer} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-[#E5E7EB]">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <h2 className="font-clash text-lg font-bold text-neutral-900">{editingItem ? 'Edit Record' : 'Add Record'}</h2>
              <button onClick={closeDrawer} className="p-1.5 text-neutral-500 hover:bg-[#E5E7EB] rounded-md"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <form id="wishlistForm" onSubmit={handleSaveItem} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1.5">Customer Name</label>
                  <input required type="text" value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1.5">Customer Email</label>
                  <input required type="email" value={formData.customer_email} onChange={(e) => setFormData({...formData, customer_email: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1.5">Product Name</label>
                  <input required type="text" value={formData.product_name} onChange={(e) => setFormData({...formData, product_name: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1.5">Price (₹)</label>
                    <input required type="number" step="0.01" min="0" value={formData.product_price} onChange={(e) => setFormData({...formData, product_price: parseFloat(e.target.value) || 0})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 tabular-nums" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1.5">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2">
                      <option value="active">Active</option>
                      <option value="purchased">Purchased</option>
                      <option value="dropped">Dropped</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-end gap-3">
              <button type="button" onClick={closeDrawer} className="px-4 py-2 text-xs font-medium bg-white border border-[#E5E7EB] rounded-lg">Cancel</button>
              <button type="submit" form="wishlistForm" disabled={isSaving} className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 rounded-lg flex items-center gap-1.5 disabled:opacity-70">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};