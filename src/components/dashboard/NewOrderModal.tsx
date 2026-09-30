import React, { useState } from 'react';
import { Order, OrderItem } from '../../types';
import { formatINR } from '../../lib/currency';
import { X, Plus, Trash2, ShoppingBag } from 'lucide-react';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrder: (order: Omit<Order, 'id' | 'created_at'>) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onCreateOrder,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [channel, setChannel] = useState('Online Store');
  const [dropName, setDropName] = useState('Drop 01: Monolith');
  const [shippingAddress, setShippingAddress] = useState('100 Mercer St, SoHo, New York, NY 10012');
  const [items, setItems] = useState<OrderItem[]>([
    {
      id: 'it-1',
      title: 'Edition 01 Minimal Chronograph',
      sku: 'CHR-ED1-BLK',
      quantity: 1,
      unitPrice: 290.00,
    },
  ]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `it-${Date.now()}`,
        title: 'Raw Selvedge Heavy Canvas Tote',
        sku: 'TOT-ED1-RAW',
        quantity: 1,
        unitPrice: 90.00,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = Number((subtotal * 0.08875).toFixed(2));
  const shipping = subtotal > 300 ? 0 : 15;
  const total = subtotal + tax + shipping;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail) return;

    const randomNum = Math.floor(1050 + Math.random() * 50);
    onCreateOrder({
      order_number: `#${randomNum}`,
      customer_name: customerName,
      customer_email: customerEmail,
      total,
      subtotal,
      tax,
      shipping,
      status: 'unfulfilled',
      payment_status: 'paid',
      items_count: items.reduce((sum, i) => sum + i.quantity, 0),
      items,
      drop_name: dropName,
      channel,
      shipping_address: shippingAddress,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-neutral-900/30 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white border border-[#E5E7EB] rounded-xl shadow-xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-neutral-900" />
            <h2 className="font-clash text-lg font-bold text-neutral-900">Create New Order</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-md hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jane Sterling"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Customer Email
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="jane@atelier-client.com"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-neutral-900"
              >
                <option value="Online Store">Online Store</option>
                <option value="VIP Private Link">VIP Private Link</option>
                <option value="Drop 01 Waitlist">Drop 01 Waitlist</option>
                <option value="Manual Draft">Manual Draft</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Drop Association
              </label>
              <select
                value={dropName}
                onChange={(e) => setDropName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-neutral-900"
              >
                <option value="Drop 01: Monolith">Drop 01: Monolith</option>
                <option value="Permanent Vault">Permanent Vault</option>
                <option value="Drop 02: Nocturne (Preview)">Drop 02: Nocturne</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Shipping Address
            </label>
            <input
              type="text"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-neutral-900"
            />
          </div>

          {/* Line items section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-neutral-700">Order Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-neutral-900 hover:underline flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
            <div className="space-y-2 border border-[#E5E7EB] rounded-lg p-3 bg-[#F9FAFB]">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2 bg-white p-2 rounded border border-[#E5E7EB] text-xs">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].title = e.target.value;
                        setItems(copy);
                      }}
                      className="w-full font-medium text-neutral-900 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={item.sku}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].sku = e.target.value;
                        setItems(copy);
                      }}
                      className="text-[11px] text-neutral-400 font-mono focus:outline-none"
                    />
                  </div>
                  <div className="w-16">
                    <span className="text-[10px] text-neutral-400 block">Qty</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                        setItems(copy);
                      }}
                      className="w-full font-mono text-xs border border-[#E5E7EB] rounded px-1.5 py-0.5"
                    />
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-[10px] text-neutral-400 block">Price</span>
                    <span className="font-mono tabular-nums text-xs font-medium">
                      {formatINR(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-neutral-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pricing summary */}
          <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] text-xs space-y-1.5">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Tax (NYC 8.875%)</span>
              <span className="font-mono tabular-nums">{formatINR(tax)}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Shipping</span>
              <span className="font-mono tabular-nums">{formatINR(shipping)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-[#E5E7EB] font-semibold text-neutral-900">
              <span>Total</span>
              <span className="font-clash text-sm tabular-nums">{formatINR(total)}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-neutral-900 hover:bg-black text-white rounded-lg transition-colors cursor-pointer"
            >
              Create Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
