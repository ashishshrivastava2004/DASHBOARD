import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Plus, User, Edit, Trash2, Download, ChevronLeft, ChevronRight, Loader2, X, Save, Mail } from 'lucide-react';

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    total_spent: 0,
    orders_count: 0,
  });

  // Indian Currency Formatter
  const formatINR = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 1. Fetch Live Customers
  const fetchCustomers = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const { data, error } = await supabase.from('customers').select('*');
      if (error) throw error;
      
      if (data) {
        const sortedData = data.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        setCustomers(sortedData);
      }
    } catch (err: any) {
      console.warn("Customers fetch error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();

    // Real-time listener
    const channel = supabase
      .channel('public:customers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        () => fetchCustomers(true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. Open Add Drawer
  const openAddDrawer = () => {
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', total_spent: 0, orders_count: 0 });
    setIsDrawerOpen(true);
  };

  // 3. Open Edit Drawer
  const openEditDrawer = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || customer.full_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      total_spent: typeof customer.total_spent === 'string' ? parseFloat(customer.total_spent) : (customer.total_spent || 0),
      orders_count: customer.orders_count || 0,
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingCustomer(null);
  };

  // 4. Save Customer (Insert or Update)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', editingCustomer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([formData]);
        if (error) throw error;
      }
      closeDrawer();
    } catch (err: any) {
      alert("Failed to save customer: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Delete Customer
  const deleteCustomer = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await supabase.from('customers').delete().eq('id', id);
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // 6. Export CSV
  const exportCSV = () => {
    const headers = 'Name,Email,Phone,Orders,Total Spent\n';
    const rows = filteredCustomers
      .map(c => `"${c.name || c.full_name || ''}","${c.email || ''}","${c.phone || ''}",${c.orders_count || 0},${c.total_spent || 0}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering & Pagination
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch = 
        (c.name || c.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || '').includes(searchQuery);
      return matchSearch;
    });
  }, [customers, searchQuery]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;

  return (
    <div className="space-y-5 relative">
      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div>
          <h1 className="font-clash text-2xl font-bold text-neutral-900 tracking-tight">Customers</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Manage your client base and purchase history.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-neutral-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openAddDrawer}
            className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
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
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search name, email, phone..."
                className="w-full sm:w-64 h-8 text-xs bg-[#F9FAFB] hover:bg-[#F3F4F6] focus:bg-white border border-[#E5E7EB] focus:border-neutral-900 rounded-lg pl-8 pr-3 focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div className="text-xs text-neutral-500">
            Total: <span className="font-semibold text-neutral-900">{filteredCustomers.length}</span> customers
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-neutral-500 uppercase tracking-wider font-medium text-[11px]">
              <tr>
                <th className="py-3 px-4">Customer Info</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Total Spent</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {!isLoading && paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-neutral-500">
                    <User className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                    <p className="font-medium text-neutral-900">No customers found</p>
                    <p className="text-[11px] mt-1">Add your first customer to get started.</p>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className="hover:bg-[#F9FAFB] transition-colors group cursor-pointer"
                    onClick={() => openEditDrawer(customer)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-neutral-100 text-neutral-600 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0">
                           {(customer.name || customer.full_name || 'U').charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 line-clamp-1 group-hover:underline">
                            {customer.name || customer.full_name || 'Unknown Customer'}
                          </p>
                          <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            Joined: {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-neutral-600 font-medium">{customer.email || 'No Email'}</p>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{customer.phone || 'No Phone'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-neutral-900">
                      {customer.orders_count || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                      {formatINR(typeof customer.total_spent === 'string' ? parseFloat(customer.total_spent) : (customer.total_spent || 0))}
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {customer.email && (
                          <a 
                            href={`mailto:${customer.email}`}
                            className="p-1.5 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer" 
                            title="Email Customer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button 
                          onClick={() => openEditDrawer(customer)}
                          className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" 
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteCustomer(customer.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" 
                          title="Delete"
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

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div>
            Showing <span className="font-medium text-neutral-900">{paginatedCustomers.length}</span> of <span className="font-medium text-neutral-900">{filteredCustomers.length}</span> customers
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-[#E5E7EB] bg-white text-neutral-600 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono">Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-[#E5E7EB] bg-white text-neutral-600 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- ADD / EDIT SLIDING DRAWER --- */}
      {isDrawerOpen && (
        <>
          <div 
            className="fixed inset-0 bg-neutral-900/30 backdrop-blur-sm z-40 transition-opacity"
            onClick={closeDrawer}
          />
          
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-[#E5E7EB] transform transition-transform duration-300 translate-x-0">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <h2 className="font-clash text-lg font-bold text-neutral-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button 
                onClick={closeDrawer}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-[#E5E7EB] rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-5">
              <form id="customerForm" onSubmit={handleSaveCustomer} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full text-sm bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-900"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Email Address *</label>
                  <input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full text-sm bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-900 font-mono"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full text-sm bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-900 font-mono"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Orders Count</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.orders_count}
                      onChange={(e) => setFormData({...formData, orders_count: parseInt(e.target.value) || 0})}
                      className="w-full text-sm bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-900 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Total Spent (₹)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={formData.total_spent}
                      onChange={(e) => setFormData({...formData, total_spent: parseFloat(e.target.value) || 0})}
                      className="w-full text-sm bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-900 tabular-nums"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Actions */}
            <div className="p-5 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={closeDrawer}
                className="px-4 py-2 text-xs font-medium text-neutral-700 bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="customerForm"
                disabled={isSaving}
                className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-black rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSaving ? 'Saving...' : 'Save Customer'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};