import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Store, Mail, Percent, Save, Loader2, CheckCircle2, IndianRupee } from 'lucide-react';

interface SettingsViewProps {
  onRefreshData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefreshData }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    store_name: '',
    support_email: '',
    currency: 'INR',
    tax_rate: 18,
  });

  // 1. Fetch Existing Settings
  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          store_name: data.store_name || '',
          support_email: data.support_email || '',
          currency: data.currency || 'INR',
          tax_rate: data.tax_rate || 0,
        });
      }
    } catch (err: any) {
      console.warn("Settings fetch error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // 2. Save Settings to Supabase
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({ 
          id: 1, 
          ...formData, 
          updated_at: new Date().toISOString() 
        });

      if (error) throw error;
      
      setSaveSuccess(true);
      if (onRefreshData) onRefreshData();
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* --- PAGE HEADER --- */}
      <div className="pb-4 border-b border-[#E5E7EB]">
        <h1 className="font-clash text-2xl font-bold text-neutral-900 tracking-tight">Store Settings</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Manage your store details, currency, and tax configurations.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* --- GENERAL SETTINGS --- */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-[#E5E7EB] bg-[#F9FAFB]">
            <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-neutral-500" />
              General Information
            </h2>
            <p className="text-[11px] text-neutral-500 mt-1">These details are used across your dashboard and emails.</p>
          </div>
          
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Store Name */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Store Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Store className="h-4 w-4 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.store_name}
                    onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                    className="w-full text-sm bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-neutral-900 transition-colors"
                    placeholder="e.g. Atelier Monolith"
                  />
                </div>
              </div>

              {/* Support Email */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Support Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-neutral-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.support_email}
                    onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                    className="w-full text-sm bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-neutral-900 transition-colors font-mono"
                    placeholder="support@example.com"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- COMMERCE CONFIGURATION --- */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-[#E5E7EB] bg-[#F9FAFB]">
            <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-neutral-500" />
              Commerce Configuration
            </h2>
            <p className="text-[11px] text-neutral-500 mt-1">Set your regional currency and default tax rate.</p>
          </div>
          
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Currency */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Default Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full text-sm bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-900 transition-colors cursor-pointer"
                >
                  <option value="INR">₹ Indian Rupee (INR)</option>
                  <option value="USD">$ US Dollar (USD)</option>
                  <option value="EUR">€ Euro (EUR)</option>
                  <option value="GBP">£ British Pound (GBP)</option>
                </select>
              </div>

              {/* Tax Rate */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  GST / Tax Rate (%)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Percent className="h-4 w-4 text-neutral-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-neutral-900 transition-colors tabular-nums"
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-1.5">Default GST percentage applied to orders.</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- SUBMIT BUTTON --- */}
        <div className="flex items-center justify-end gap-4">
          {saveSuccess && (
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              Settings saved successfully!
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-md disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};