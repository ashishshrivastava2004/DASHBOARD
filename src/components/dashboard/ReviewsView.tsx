import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Star, Trash2, CheckCircle2, EyeOff, ChevronLeft, ChevronRight, Loader2, Download, MessageSquare, Plus, Edit, X, Save } from 'lucide-react';

export const ReviewsView: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customer_name: '',
    product_name: '',
    rating: 5,
    comment: '',
    status: 'pending'
  });

  // 1. Fetch Live Reviews Data
  const fetchReviews = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const { data, error } = await supabase.from('reviews').select('*');
      if (error) throw error;
      
      if (data) {
        const sortedData = data.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        setReviews(sortedData);
      }
    } catch (err: any) {
      console.warn("Reviews fetch error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();

    // Real-time listener
    const channel = supabase
      .channel('public:reviews')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => fetchReviews(true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. Open Add Drawer
  const openAddDrawer = () => {
    setEditingReview(null);
    setFormData({ customer_name: '', product_name: '', rating: 5, comment: '', status: 'published' });
    setIsDrawerOpen(true);
  };

  // 3. Open Edit Drawer
  const openEditDrawer = (review: any) => {
    setEditingReview(review);
    setFormData({
      customer_name: review.customer_name || '',
      product_name: review.product_name || '',
      rating: review.rating || 5,
      comment: review.comment || '',
      status: review.status || 'pending'
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingReview(null);
  };

  // 4. Save Review (Insert or Update)
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingReview) {
        const { error } = await supabase.from('reviews').update(formData).eq('id', editingReview.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('reviews').insert([formData]);
        if (error) throw error;
      }
      closeDrawer();
    } catch (err: any) {
      alert("Failed to save review: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Update Status Quick Action
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await supabase.from('reviews').update({ status: newStatus }).eq('id', id);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  // 6. Delete Review
  const deleteReview = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) return;
    try {
      await supabase.from('reviews').delete().eq('id', id);
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // 7. Export CSV
  const exportCSV = () => {
    const headers = 'Customer,Product,Rating,Comment,Status,Date\n';
    const rows = filteredReviews
      .map(r => `"${r.customer_name || ''}","${r.product_name || ''}",${r.rating || 0},"${(r.comment || '').replace(/"/g, '""')}","${r.status || 'pending'}","${r.created_at}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reviews_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to render stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`w-3.5 h-3.5 ${star <= (rating || 5) ? 'fill-amber-400 text-amber-400' : 'fill-neutral-200 text-neutral-200'}`} 
          />
        ))}
      </div>
    );
  };

  // Filtering & Pagination
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchFilter = statusFilter === 'all' || r.status === statusFilter;
      const matchSearch = 
        (r.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (r.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.comment || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [reviews, statusFilter, searchQuery]);

  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReviews.slice(start, start + itemsPerPage);
  }, [filteredReviews, currentPage]);

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage) || 1;

  // Stats calculation
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <div className="space-y-5 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div>
          <h1 className="font-clash text-2xl font-bold text-neutral-900 tracking-tight">Product Reviews</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Moderate customer feedback and ratings.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">Avg Store Rating</span>
            <div className="flex items-center justify-end gap-1.5">
              <span className="font-clash text-lg font-bold text-neutral-900 tabular-nums">{averageRating}</span>
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <button onClick={exportCSV} className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-neutral-700 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs">
            <Download className="w-3.5 h-3.5" /><span>Export</span>
          </button>
          <button onClick={openAddDrawer} className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs">
            <Plus className="w-3.5 h-3.5" /><span>Add Review</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden relative min-h-[300px]">
        {isLoading && <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-neutral-900" /></div>}

        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Search reviews or customers..." className="w-full sm:w-64 h-8 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-8 pr-3" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="h-8 px-2.5 text-xs bg-white border border-[#E5E7EB] rounded-lg cursor-pointer">
              <option value="all">All Reviews</option>
              <option value="pending">Pending Review</option>
              <option value="published">Published</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
          <div className="text-xs text-neutral-500">Total Reviews: <span className="font-semibold text-neutral-900">{filteredReviews.length}</span></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-neutral-500 uppercase tracking-wider font-medium text-[11px]">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Rating & Comment</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {!isLoading && paginatedReviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-neutral-500">
                    <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                    <p className="font-medium text-neutral-900">No reviews found</p>
                  </td>
                </tr>
              ) : (
                paginatedReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-[#F9FAFB] transition-colors group cursor-pointer" onClick={() => openEditDrawer(review)}>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-medium text-neutral-900 group-hover:underline">{review.customer_name || 'Anonymous'}</p>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{review.created_at ? new Date(review.created_at).toLocaleDateString() : 'N/A'}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap"><p className="font-medium text-neutral-700">{review.product_name || 'Unknown Product'}</p></td>
                    <td className="py-3.5 px-4 min-w-[250px]">
                      <div className="mb-1.5">{renderStars(review.rating)}</div>
                      <p className="text-neutral-600 text-[11px] line-clamp-2" title={review.comment}>{review.comment || 'No comment provided.'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded border inline-block ${review.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : review.status === 'hidden' ? 'bg-neutral-100 text-neutral-600 border-neutral-300' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {review.status ? review.status.charAt(0).toUpperCase() + review.status.slice(1) : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {review.status !== 'published' && (
                          <button onClick={() => updateStatus(review.id, 'published')} className="p-1.5 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Publish"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                        )}
                        {review.status !== 'hidden' && (
                          <button onClick={() => updateStatus(review.id, 'hidden')} className="p-1.5 text-neutral-500 hover:text-amber-600 hover:bg-amber-50 rounded" title="Hide"><EyeOff className="w-3.5 h-3.5" /></button>
                        )}
                        <button onClick={() => openEditDrawer(review)} className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteReview(review.id)} className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div>Showing <span className="font-medium text-neutral-900">{paginatedReviews.length}</span> of <span className="font-medium text-neutral-900">{filteredReviews.length}</span> reviews</div>
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
              <h2 className="font-clash text-lg font-bold text-neutral-900">{editingReview ? 'Edit Review' : 'Add Review'}</h2>
              <button onClick={closeDrawer} className="p-1.5 text-neutral-500 hover:bg-[#E5E7EB] rounded-md"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <form id="reviewForm" onSubmit={handleSaveReview} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1.5">Customer Name *</label>
                  <input required type="text" value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1.5">Product Name *</label>
                  <input required type="text" value={formData.product_name} onChange={(e) => setFormData({...formData, product_name: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2" placeholder="e.g. Monolith Hoodie" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1.5">Rating (1-5) *</label>
                    <input required type="number" min="1" max="5" value={formData.rating} onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value) || 5})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 tabular-nums" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1.5">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2">
                      <option value="pending">Pending</option>
                      <option value="published">Published</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1.5">Comment</label>
                  <textarea rows={4} value={formData.comment} onChange={(e) => setFormData({...formData, comment: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 resize-none" placeholder="Customer's feedback..." />
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-end gap-3">
              <button type="button" onClick={closeDrawer} className="px-4 py-2 text-xs font-medium bg-white border border-[#E5E7EB] rounded-lg">Cancel</button>
              <button type="submit" form="reviewForm" disabled={isSaving} className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 rounded-lg flex items-center gap-1.5 disabled:opacity-70">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Review</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};