import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Plus, Package, Edit, Trash2, Download, ChevronLeft, ChevronRight, Loader2, X, Save, CheckCircle2, XCircle } from 'lucide-react';

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockFilter, setInStockFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State mapped EXACTLY to the Supabase Table Schema
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    description: '',
    category: '',
    in_stock: true,
  });
  
  const [sizesInput, setSizesInput] = useState('');
  const [imagesInput, setImagesInput] = useState('');

  // Indian Currency Formatter Helper
  const formatINR = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 1. Fetch Live Products
  const fetchProducts = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      
      if (data) {
        const sortedData = data.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA; // Newest first
        });
        setProducts(sortedData);
      }
    } catch (err: any) {
      console.error("Products fetch error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const channel = supabase.channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchProducts(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // 2. Open Add Drawer
  const openAddDrawer = () => {
    setEditingProduct(null);
    setFormData({ name: '', price: 0, description: '', category: '', in_stock: true });
    setSizesInput('');
    setImagesInput('');
    setIsDrawerOpen(true);
  };

  // 3. Open Edit Drawer
  const openEditDrawer = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      price: product.price || 0,
      description: product.description || '',
      category: product.category || '',
      in_stock: product.in_stock ?? true,
    });
    setSizesInput(Array.isArray(product.sizes) ? product.sizes.join(', ') : '');
    setImagesInput(Array.isArray(product.images_url) ? product.images_url.join(', ') : '');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingProduct(null);
  };

  // 4. Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const parsedSizes = sizesInput.split(',').map(s => s.trim()).filter(Boolean);
    const parsedImages = imagesInput.split(',').map(s => s.trim()).filter(Boolean);

    const dataToSave = {
      ...formData,
      sizes: parsedSizes,
      images_url: parsedImages
    };

    try {
      if (editingProduct) {
        const { error } = await supabase.from('products').update(dataToSave).eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([dataToSave]);
        if (error) throw error;
      }
      closeDrawer();
    } catch (err: any) {
      alert("Failed to save product: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Toggle In-Stock Status
  const toggleInStock = async (id: string, currentStatus: boolean) => {
    try {
      await supabase.from('products').update({ in_stock: !currentStatus }).eq('id', id);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  // 6. Delete Product
  const deleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // Filtering & Pagination
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchFilter = inStockFilter === 'all' || 
        (inStockFilter === 'in_stock' && p.in_stock === true) ||
        (inStockFilter === 'out_of_stock' && p.in_stock === false);
        
      const matchSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [products, inStockFilter, searchQuery]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // Export CSV
  const exportCSV = () => {
    const headers = 'Name,Category,Price,In Stock,Sizes\n';
    const rows = filteredProducts
      .map(p => `"${p.name || ''}","${p.category || ''}",${p.price || 0},${p.in_stock ? 'Yes' : 'No'},"${Array.isArray(p.sizes) ? p.sizes.join(', ') : ''}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `products_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-5 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div>
          <h1 className="font-clash text-2xl font-bold text-neutral-900 tracking-tight">Products Catalog</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Manage inventory and pricing in Indian Rupees (₹).</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-neutral-700 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs">
            <Download className="w-3.5 h-3.5" /><span>Export CSV</span>
          </button>
          <button onClick={openAddDrawer} className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs">
            <Plus className="w-3.5 h-3.5" /><span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden relative min-h-[300px]">
        {isLoading && <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-neutral-900" /></div>}

        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Search products..." className="w-full sm:w-64 h-8 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-8 pr-3" />
            </div>
            <select value={inStockFilter} onChange={(e) => { setInStockFilter(e.target.value); setCurrentPage(1); }} className="h-8 px-2.5 text-xs bg-white border border-[#E5E7EB] rounded-lg cursor-pointer">
              <option value="all">Availability</option>
              <option value="in_stock">In Stock Only</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
          <div className="text-xs text-neutral-500">Total: <span className="font-semibold text-neutral-900">{filteredProducts.length}</span> products</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-neutral-500 uppercase tracking-wider font-medium text-[11px]">
              <tr>
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Sizes</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {!isLoading && paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-neutral-500">
                    <Package className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                    <p className="font-medium text-neutral-900">No products found</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const firstImage = Array.isArray(product.images_url) && product.images_url.length > 0 ? product.images_url[0] : null;
                  const sizeList = Array.isArray(product.sizes) ? product.sizes.join(', ') : 'None';

                  return (
                    <tr key={product.id} className="hover:bg-[#F9FAFB] transition-colors group cursor-pointer" onClick={() => openEditDrawer(product)}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#F3F4F6] border border-[#E5E7EB] rounded-md flex items-center justify-center overflow-hidden shrink-0">
                            {firstImage ? <img src={firstImage} alt={product.name} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-neutral-400" />}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 line-clamp-1 group-hover:underline">{product.name || 'Untitled'}</p>
                            <p className="text-[10px] text-neutral-500 truncate w-40 mt-0.5">{product.description || 'No description'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 font-medium">{product.category || 'N/A'}</td>
                      <td className="py-3.5 px-4 font-mono text-[10px] text-neutral-500">{sizeList}</td>
                      {/* Formatting Price as INR */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-neutral-900">
                        {formatINR(typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0))}
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => toggleInStock(product.id, product.in_stock)} className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border transition-colors cursor-pointer ${product.in_stock === true ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {product.in_stock === true ? <><CheckCircle2 className="w-3 h-3" /> In Stock</> : <><XCircle className="w-3 h-3" /> Out of Stock</>}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditDrawer(product)} className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteProduct(product.id)} className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div>Showing {paginatedProducts.length} of {filteredProducts.length} products</div>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="p-1.5 rounded border border-[#E5E7EB] bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-mono">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="p-1.5 rounded border border-[#E5E7EB] bg-white disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* --- ADD / EDIT SLIDING DRAWER --- */}
      {isDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-neutral-900/30 backdrop-blur-sm z-40 transition-opacity" onClick={closeDrawer} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-[#E5E7EB]">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <h2 className="font-clash text-lg font-bold text-neutral-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={closeDrawer} className="p-1.5 text-neutral-500 hover:bg-[#E5E7EB] rounded-md"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <form id="productForm" onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Product Name *</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 focus:border-neutral-900" placeholder="e.g. Lining Navy Shirt" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {/* Showing ₹ in the Drawer Label */}
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Price (₹) *</label>
                    <input required type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 tabular-nums" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Category</label>
                    <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2" placeholder="e.g. Shirts" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 resize-none" placeholder="Product details..." />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Availability (in_stock)</label>
                  <select value={formData.in_stock ? 'true' : 'false'} onChange={(e) => setFormData({...formData, in_stock: e.target.value === 'true'})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2">
                    <option value="true">True (In Stock)</option>
                    <option value="false">False (Out of Stock)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Sizes (comma separated)</label>
                  <input type="text" value={sizesInput} onChange={(e) => setSizesInput(e.target.value)} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono" placeholder="e.g. S, M, L, XL" />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Image URLs (comma separated)</label>
                  <textarea rows={2} value={imagesInput} onChange={(e) => setImagesInput(e.target.value)} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono resize-none" placeholder="e.g. https://image1.jpg" />
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-end gap-3">
              <button type="button" onClick={closeDrawer} className="px-4 py-2 text-xs font-medium bg-white border border-[#E5E7EB] rounded-lg">Cancel</button>
              <button type="submit" form="productForm" disabled={isSaving} className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 rounded-lg flex items-center gap-1.5 disabled:opacity-70">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSaving ? 'Saving...' : 'Save Product'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};