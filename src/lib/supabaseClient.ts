import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order, WaitlistEntry, Product, Customer } from '../types';
import { INITIAL_ORDERS, INITIAL_WAITLIST, INITIAL_PRODUCTS, INITIAL_CUSTOMERS } from '../data/mockData';

// Read keys from environment
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if valid production keys are injected
export const isSupabaseConfigured = (): boolean => {
  if (!rawUrl || !rawKey) return false;
  if (rawUrl.includes('your-project') || rawKey.includes('your-anon-key')) return false;
  return rawUrl.startsWith('https://') && rawKey.length > 20;
};

// Fallback placeholder credentials so createClient never throws on startup if keys are pending
const safeUrl = isSupabaseConfigured() ? rawUrl : 'https://demo-atelier.supabase.co';
const safeKey = isSupabaseConfigured() ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.demo-signature';

export const supabase: SupabaseClient = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// In-memory / local storage sync cache for instantaneous preview before Supabase is linked
const STORAGE_PREFIX = 'atelier_admin_';

const getStoredData = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setStoredData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to local store', err);
  }
};

// Database Query APIs (switches seamlessly between live Supabase and active store state)
export const api = {
  // Orders
  async getOrders(): Promise<Order[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as Order[];
        }
      } catch (err) {
        console.warn('Supabase orders table query error, falling back to local store:', err);
      }
    }
    return getStoredData<Order[]>('orders', INITIAL_ORDERS);
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order[]> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('orders')
          .update({ status })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase update order error:', err);
      }
    }
    const current = getStoredData<Order[]>('orders', INITIAL_ORDERS);
    const updated = current.map(o => o.id === id ? { ...o, status } : o);
    setStoredData('orders', updated);
    return updated;
  },

  async createOrder(newOrder: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    const fullOrder: Order = {
      ...newOrder,
      id: `ord-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('orders').insert([fullOrder]);
      } catch (err) {
        console.warn('Supabase create order error:', err);
      }
    }

    const current = getStoredData<Order[]>('orders', INITIAL_ORDERS);
    const updated = [fullOrder, ...current];
    setStoredData('orders', updated);
    return fullOrder;
  },

  // Waitlist (Drop 01)
  async getWaitlist(): Promise<WaitlistEntry[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('waitlist_subscribers')
          .select('*')
          .order('position', { ascending: true });
        if (!error && data && data.length > 0) {
          return data as WaitlistEntry[];
        }
      } catch (err) {
        console.warn('Supabase waitlist table query error, falling back to local store:', err);
      }
    }
    return getStoredData<WaitlistEntry[]>('waitlist', INITIAL_WAITLIST);
  },

  async addWaitlistEntry(entry: Omit<WaitlistEntry, 'id' | 'signup_date' | 'position'>): Promise<WaitlistEntry> {
    const current = getStoredData<WaitlistEntry[]>('waitlist', INITIAL_WAITLIST);
    const newEntry: WaitlistEntry = {
      ...entry,
      id: `wt-${(current.length + 1).toString().padStart(3, '0')}`,
      position: current.length + 1,
      signup_date: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('waitlist_subscribers').insert([newEntry]);
      } catch (err) {
        console.warn('Supabase waitlist insert error:', err);
      }
    }

    const updated = [...current, newEntry];
    setStoredData('waitlist', updated);
    return newEntry;
  },

  async updateWaitlistStatus(id: string, status: WaitlistEntry['status']): Promise<WaitlistEntry[]> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('waitlist_subscribers')
          .update({ status })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase waitlist status update error:', err);
      }
    }
    const current = getStoredData<WaitlistEntry[]>('waitlist', INITIAL_WAITLIST);
    const updated = current.map(w => w.id === id ? { ...w, status } : w);
    setStoredData('waitlist', updated);
    return updated;
  },

  // Products
  async getProducts(): Promise<Product[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('title', { ascending: true });
        if (!error && data && data.length > 0) {
          return data as Product[];
        }
      } catch (err) {
        console.warn('Supabase products table query error:', err);
      }
    }
    return getStoredData<Product[]>('products', INITIAL_PRODUCTS);
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('total_spent', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as Customer[];
        }
      } catch (err) {
        console.warn('Supabase customers table query error:', err);
      }
    }
    return getStoredData<Customer[]>('customers', INITIAL_CUSTOMERS);
  },

  // Reset to original mock data
  resetDemoData(): void {
    localStorage.removeItem(STORAGE_PREFIX + 'orders');
    localStorage.removeItem(STORAGE_PREFIX + 'waitlist');
    localStorage.removeItem(STORAGE_PREFIX + 'products');
    localStorage.removeItem(STORAGE_PREFIX + 'customers');
  }
};

// SQL Schema for 1-click execution in Supabase SQL editor
export const SUPABASE_SQL_SCHEMA = `-- 1. Orders Table
create table if not exists public.orders (
  id text primary key,
  order_number text not null,
  customer_name text not null,
  customer_email text not null,
  total numeric not null,
  subtotal numeric not null,
  tax numeric default 0,
  shipping numeric default 0,
  status text check (status in ('unfulfilled', 'fulfilled', 'in_progress', 'cancelled')) default 'unfulfilled',
  payment_status text check (payment_status in ('paid', 'pending', 'refunded')) default 'paid',
  items_count integer default 1,
  items jsonb default '[]'::jsonb,
  drop_name text default 'Drop 01: Monolith',
  channel text default 'Online Store',
  shipping_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Waitlist Subscribers Table (Drop 01)
create table if not exists public.waitlist_subscribers (
  id text primary key,
  email text not null unique,
  full_name text not null,
  drop_code text default 'DROP_01',
  tier text check (tier in ('VIP Early Access', 'Standard Queue')) default 'Standard Queue',
  position integer not null,
  referral_count integer default 0,
  status text check (status in ('waiting', 'invited', 'claimed')) default 'waiting',
  phone text,
  notes text,
  signup_date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Products Table
create table if not exists public.products (
  id text primary key,
  title text not null,
  sku text not null unique,
  category text not null,
  price numeric not null,
  inventory_count integer default 0,
  status text check (status in ('active', 'draft', 'archived')) default 'active',
  drop_association text default 'Drop 01: Monolith'
);

-- Enable Row Level Security (RLS)
alter table public.orders enable row level security;
alter table public.waitlist_subscribers enable row level security;
alter table public.products enable row level security;

-- Policies for authenticated admins
create policy "Allow all operations for authenticated users"
  on public.orders for all using (auth.role() = 'authenticated');

create policy "Allow all operations for authenticated users"
  on public.waitlist_subscribers for all using (auth.role() = 'authenticated');

create policy "Allow all operations for authenticated users"
  on public.products for all using (auth.role() = 'authenticated');
`;
