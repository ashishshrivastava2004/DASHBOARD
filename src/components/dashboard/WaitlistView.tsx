import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Sparkles, Download, ChevronLeft, ChevronRight, Plus, Mail, CheckCircle2, Loader2, X, Save, Edit, Trash2 } from 'lucide-react';

export const WaitlistView: React.FC = () => {
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    drop_code: 'DROP-01',
    tier: 'Standard',
    status: 'waiting',
    referral_count: 0
  });

  // 1. Fetch Live Waitlist Data
  const fetchWaitlist = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const { data, error } = await supabase.from('waitlist').select('*');
      if (error) throw error;
      
      if (data) {
        const sortedData = data.sort((a, b) => {
          const posA = a.position || 999999;
          const posB = b.position || 999999;
          return posA - posB; // Sort by queue position
        });
        setWaitlist(sortedData);
      }
    } catch (err: any) {
      console.warn("Waitlist fetch error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
    const channel = supabase.channel('public:waitlist')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist' }, () => fetchWaitlist(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // 2. Open Add Drawer
  const openAddDrawer = () => {
    setEditingEntry(null);
    setFormData({ full_name: '', email: '', drop_code: 'DROP-01', tier: 'Standard', status: 'waiting', referral_count: 0 });
    setIsDrawerOpen(true);
  };

  // 3. Open Edit Drawer
  const openEditDrawer = (entry: any) => {
    setEditingEntry(entry);
    setFormData({
      full_name: entry.full_name || '',
      email: entry.email || '',
      drop_code: entry.drop_code || 'DROP-01',
      tier: entry.tier || 'Standard',
      status: entry.status || 'waiting',
      referral_count: entry.referral_count || 0
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingEntry(null);
  };

  // 4. Save Entry (Insert or Update)
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingEntry) {
        const { error } = await supabase.from('waitlist').update(formData).eq('id', editingEntry.id);
        if (error) throw error;
      } else {
        // Assign next position
        const nextPos = waitlist.length > 0 ? Math.max(...waitlist.map(w => w.position || 0)) + 1 : 1;
        const { error } = await supabase.from('waitlist').insert([{ ...formData, position: nextPos }]);
        if (error) throw error;
      }
      closeDrawer();
    } catch (err: any) {
      alert("Failed to save entry: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Update Status
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await supabase.from('waitlist').update({ status: newStatus }).eq('id', id);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  // 6. Delete Entry
  const deleteEntry = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this person from the waitlist?")) return;
    try {
      await supabase.from('waitlist').delete().eq('id', id);
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // 7. Export CSV
  const exportCSV = () => {
    const headers = 'Position,Name,Email,Drop,Tier,Referrals,Status\n';
    const rows = filteredWaitlist
      .map(w => `${w.position || 0},"${w.full_name || ''}","${w.email || ''}","${w.drop_code || ''}","${w.tier || ''}",${w.referral_count || 0},"${w.status || ''}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `waitlist_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // Filtering & Pagination
  const filteredWaitlist = useMemo(() => {
    return waitlist.filter((entry) => {
      const matchesFilter = statusFilter === 'all' || entry.status === statusFilter;
      const matchesSearch = 
        (entry.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (entry.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [waitlist, statusFilter, searchQuery]);

  const paginatedWaitlist = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredWaitlist.slice(start, start + itemsPerPage);
  }, [filteredWaitlist, currentPage]);

  const totalPages = Math.ceil(filteredWaitlist.length / itemsPerPage) || 1;

  return (
    <div className="space-y-5 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div>
          <h1 className="font-clash text-2xl font-bold text-neutral-900 tracking-tight">Drop Waitlist</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Manage early access candidates for your upcoming drops.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-neutral-700 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs">
            <Download className="w-3.5 h-3.5" /><span>Export CSV</span>
          </button>
          <button onClick={openAddDrawer} className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs">
            <Plus className="w-3.5 h-3.5" /><span>Add Subscriber</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden relative min-h-[300px]">
        {isLoading && <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-neutral-900" /></div>}

        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Search emails, names..." className="w-full sm:w-64 h-8 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-8 pr-3" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="h-8 px-2.5 text-xs bg-white border border-[#E5E7EB] rounded-lg cursor-pointer">
              <option value="all">All Statuses</option>
              <option value="waiting">Waiting</option>
              <option value="invited">Invited</option>
              <option value="claimed">Claimed</option>
            </select>
          </div>
          <div className="text-xs text-neutral-500">Total: <span className="font-semibold text-neutral-900">{filteredWaitlist.length}</span> people</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-neutral-500 uppercase tracking-wider font-medium text-[11px]">
              <tr>
                <th className="py-3 px-4">Queue #</th>
                <th className="py-3 px-4">Subscriber Info</th>
                <th className="py-3 px-4">Tier / Drop</th>
                <th className="py-3 px-4 text-center">Referrals</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {!isLoading && paginatedWaitlist.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-neutral-500">
                    <Sparkles className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                    <p className="font-medium text-neutral-900">No subscribers found</p>
                  </td>
                </tr>
              ) : (
                paginatedWaitlist.map((entry, idx) => (
                  <tr key={entry.id || idx} className="hover:bg-[#F9FAFB] transition-colors group cursor-pointer" onClick={() => openEditDrawer(entry)}>
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">#{(entry.position || idx + 1).toString().padStart(3, '0')}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-neutral-900 group-hover:underline">{entry.full_name}</p>
                      <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{entry.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block bg-[#F3F4F6] text-neutral-700 px-2 py-0.5 rounded border border-[#E5E7EB] text-[10px] font-medium mb-1">{entry.tier || 'Standard'}</span>
                      <p className="text-[10px] text-neutral-500 font-mono">{entry.drop_code || 'DROP-01'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-neutral-700">{entry.referral_count || 0}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded border inline-block ${entry.status === 'invited' ? 'bg-blue-50 text-blue-700 border-blue-200' : entry.status === 'claimed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {entry.status === 'invited' ? 'Invited' : entry.status === 'claimed' ? 'Converted' : 'Waiting'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {entry.status === 'waiting' && (
                          <button onClick={() => updateStatus(entry.id, 'invited')} className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Send Invite"><Mail className="w-3.5 h-3.5" /></button>
                        )}
                        {entry.status === 'invited' && (
                          <button onClick={() => updateStatus(entry.id, 'claimed')} className="p-1.5 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Mark as Converted"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                        )}
                        <button onClick={() => openEditDrawer(entry)} className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteEntry(entry.id)} className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div>Showing <span className="font-medium text-neutral-900">{paginatedWaitlist.length}</span> of <span className="font-medium text-neutral-900">{filteredWaitlist.length}</span> people</div>
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
              <h2 className="font-clash text-lg font-bold text-neutral-900">{editingEntry ? 'Edit Subscriber' : 'Add Subscriber'}</h2>
              <button onClick={closeDrawer} className="p-1.5 text-neutral-500 hover:bg-[#E5E7EB] rounded-md"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <form id="waitlistForm" onSubmit={handleSaveEntry} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1.5">Full Name *</label>
                  <input required type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1.5">Email *</label>
                  <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1.5">Drop Code</label>
                    <input type="text" value={formData.drop_code} onChange={(e) => setFormData({...formData, drop_code: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1.5">Tier</label>
                    <select value={formData.tier} onChange={(e) => setFormData({...formData, tier: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2">
                      <option value="Standard">Standard</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1.5">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2">
                      <option value="waiting">Waiting</option>
                      <option value="invited">Invited</option>
                      <option value="claimed">Claimed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1.5">Referrals</label>
                    <input type="number" min="0" value={formData.referral_count} onChange={(e) => setFormData({...formData, referral_count: parseInt(e.target.value) || 0})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 tabular-nums" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-end gap-3">
              <button type="button" onClick={closeDrawer} className="px-4 py-2 text-xs font-medium bg-white border border-[#E5E7EB] rounded-lg">Cancel</button>
              <button type="submit" form="waitlistForm" disabled={isSaving} className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 rounded-lg flex items-center gap-1.5 disabled:opacity-70">
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