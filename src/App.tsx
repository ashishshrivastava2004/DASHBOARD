/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/auth/Login';
import { DashboardLayout, NavTab } from './components/layout/DashboardLayout';
import { Overview } from './components/dashboard/Overview';
import { OrdersView } from './components/dashboard/OrdersView';
import { WaitlistView } from './components/dashboard/WaitlistView';
import { ProductsView } from './components/dashboard/ProductsView';
import { CustomersView } from './components/dashboard/CustomersView';
import { SettingsView } from './components/dashboard/SettingsView';
import { OrderDetailsDrawer } from './components/dashboard/OrderDetailsDrawer';
import { NewOrderModal } from './components/dashboard/NewOrderModal';
import { NewWaitlistModal } from './components/dashboard/NewWaitlistModal';
import { AbandonedCartsView } from './components/dashboard/AbandonedCartsView';
import { WishlistView } from './components/dashboard/WishlistView';
import { ReviewsView } from './components/dashboard/ReviewsView';

import { Order, WaitlistEntry, Product, Customer } from './types';
import { api } from './lib/supabaseClient';
import { INITIAL_ORDERS, INITIAL_WAITLIST, INITIAL_PRODUCTS, INITIAL_CUSTOMERS } from './data/mockData';

const MainAppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');

  // Core Data States
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(INITIAL_WAITLIST);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);

  // Modals & Drawers
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [newWaitlistModalOpen, setNewWaitlistModalOpen] = useState(false);

  // Load from Supabase / cache on mount or user change
  const refreshAllData = async () => {
    try {
      const [ordData, wtData, prdData, cstData] = await Promise.all([
        api.getOrders(),
        api.getWaitlist(),
        api.getProducts(),
        api.getCustomers(),
      ]);
      if (ordData) setOrders(ordData);
      if (wtData) setWaitlist(wtData);
      if (prdData) setProducts(prdData);
      if (cstData) setCustomers(cstData);
    } catch (err) {
      console.warn('Data sync note:', err);
    }
  };

  useEffect(() => {
    if (user) {
      refreshAllData();
    }
  }, [user]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#F9FAFB] flex flex-col items-center justify-center">
        <div className="w-10 h-10 bg-white border border-[#E5E7EB] rounded-xl flex items-center justify-center shadow-xs mb-3 animate-pulse">
          <span className="font-clash text-lg font-bold text-neutral-900">A</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-neutral-900 animate-ping" />
          <span>Synchronizing Atelier Supabase Client...</span>
        </div>
      </div>
    );
  }

  // Not authenticated -> Show Login screen
  if (!user) {
    return <Login />;
  }

  // Action Handlers
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    const updated = await api.updateOrderStatus(orderId, status);
    setOrders(updated);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status });
    }
  };

  const handleCreateOrder = async (orderData: Omit<Order, 'id' | 'created_at'>) => {
    const newOrd = await api.createOrder(orderData);
    setOrders((prev) => [newOrd, ...prev]);
  };

  const handleAddWaitlist = async (entryData: Omit<WaitlistEntry, 'id' | 'signup_date' | 'position'>) => {
    const newEntry = await api.addWaitlistEntry(entryData);
    setWaitlist((prev) => [...prev, newEntry]);
  };

  const handleUpdateWaitlistStatus = async (id: string, status: WaitlistEntry['status']) => {
    const updated = await api.updateWaitlistStatus(id, status);
    setWaitlist(updated);
  };

  const pendingCount = orders.filter((o) => o.status === 'unfulfilled').length;
  const activeWaitlistCount = waitlist.filter((w) => w.status === 'waiting' || w.status === 'active' || !w.status).length;

  return (
    <DashboardLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      pendingOrdersCount={pendingCount}
      activeWaitlistCount={activeWaitlistCount}
    >
      {currentTab === 'overview' && (
        <Overview
          orders={orders}
          waitlist={waitlist}
          onSelectOrder={setSelectedOrder}
          onOpenNewOrder={() => setNewOrderModalOpen(true)}
          onOpenNewWaitlist={() => setNewWaitlistModalOpen(true)}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onSelectTab={setCurrentTab}
        />
      )}

      {currentTab === 'orders' && (
        <OrdersView
          orders={orders}
          onSelectOrder={setSelectedOrder}
          onOpenNewOrder={() => setNewOrderModalOpen(true)}
          onUpdateOrderStatus={handleUpdateOrderStatus}
        />
      )}

      {currentTab === 'waitlist' && (
        <WaitlistView
          waitlist={waitlist}
          onOpenNewWaitlist={() => setNewWaitlistModalOpen(true)}
          onUpdateStatus={handleUpdateWaitlistStatus}
        />
      )}

      {currentTab === 'products' && (
        <ProductsView />
      )}

      {currentTab === 'customers' && (
        <CustomersView />
      )}

      {currentTab === 'abandoned_carts' && (
        <AbandonedCartsView />
      )}

      {currentTab === 'wishlist' && (
        <WishlistView />
      )}

      {currentTab === 'reviews' && (
        <ReviewsView />
      )}

      {currentTab === 'settings' && (
        <SettingsView onRefreshData={refreshAllData} />
      )}

      {/* Slide-over Order Details Drawer */}
      <OrderDetailsDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateOrderStatus}
      />

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={newOrderModalOpen}
        onClose={() => setNewOrderModalOpen(false)}
        onCreateOrder={handleCreateOrder}
      />

      {/* New Waitlist Modal */}
      <NewWaitlistModal
        isOpen={newWaitlistModalOpen}
        onClose={() => setNewWaitlistModalOpen(false)}
        onAddEntry={handleAddWaitlist}
      />
    </DashboardLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}