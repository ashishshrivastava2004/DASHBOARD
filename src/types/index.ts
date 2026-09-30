export type OrderStatus = 'unfulfilled' | 'fulfilled' | 'in_progress' | 'cancelled';
export type PaymentStatus = 'paid' | 'pending' | 'refunded';

export interface OrderItem {
  id: string;
  title: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  items_count: number;
  items: OrderItem[];
  drop_name: string;
  channel: string;
  shipping_address: string;
  created_at: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  full_name: string;
  drop_code: string;
  tier: 'VIP Early Access' | 'Standard Queue';
  position: number;
  signup_date: string;
  referral_count: number;
  status: 'waiting' | 'invited' | 'claimed';
  phone?: string;
  notes?: string;
}

export interface Product {
  id: string;
  title: string;
  sku: string;
  category: string;
  price: number;
  inventory_count: number;
  status: 'active' | 'draft' | 'archived';
  drop_association: string;
  image_url?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  orders_count: number;
  total_spent: number;
  last_order_date: string;
  tag: 'VIP' | 'Regular' | 'Drop Collector';
}

export interface KPIMetrics {
  totalSales: number;
  salesGrowth: number;
  activeWaitlist: number;
  waitlistGrowth: number;
  pendingOrders: number;
  pendingGrowth: number;
  avgOrderValue: number;
  aovGrowth: number;
}
