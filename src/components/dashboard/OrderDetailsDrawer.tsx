import React from 'react';
import { Order } from '../../types';
import { formatINR } from '../../lib/currency';
import { X, CheckCircle2, Clock, Ban, Truck, DollarSign, Mail, MapPin, Package, Calendar } from 'lucide-react';

interface OrderDetailsDrawerProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: Order['status']) => void;
}

export const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({
  order,
  onClose,
  onUpdateStatus,
}) => {
  if (!order) return null;

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'fulfilled':
        return <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Fulfilled</span>;
      case 'unfulfilled':
        return <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Unfulfilled</span>;
      case 'in_progress':
        return <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">In Progress</span>;
      case 'cancelled':
        return <span className="text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300">Cancelled</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-900/30 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl z-10 flex flex-col justify-between border-l border-[#E5E7EB] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-clash text-lg font-bold text-neutral-900">
                Order {order.order_number}
              </span>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>{formatDate(order.created_at)}</span>
              <span>·</span>
              <span>{order.channel}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-md hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Status Management */}
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3.5">
            <span className="text-xs font-medium text-neutral-700 block mb-2">
              Update Fulfillment Status
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateStatus(order.id, 'fulfilled')}
                className={`py-1.5 px-2 text-xs font-medium rounded-md border text-center transition-colors cursor-pointer ${
                  order.status === 'fulfilled'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-neutral-700 border-[#E5E7EB] hover:bg-neutral-50'
                }`}
              >
                Fulfilled
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus(order.id, 'in_progress')}
                className={`py-1.5 px-2 text-xs font-medium rounded-md border text-center transition-colors cursor-pointer ${
                  order.status === 'in_progress'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-neutral-700 border-[#E5E7EB] hover:bg-neutral-50'
                }`}
              >
                In Progress
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus(order.id, 'cancelled')}
                className={`py-1.5 px-2 text-xs font-medium rounded-md border text-center transition-colors cursor-pointer ${
                  order.status === 'cancelled'
                    ? 'bg-neutral-800 text-white border-neutral-800'
                    : 'bg-white text-neutral-700 border-[#E5E7EB] hover:bg-neutral-50'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <span className="text-xs font-semibold text-neutral-900 uppercase tracking-wider block mb-3">
              Line Items ({order.items.length})
            </span>
            <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-lg overflow-hidden">
              {order.items.map((item) => (
                <div key={item.id} className="p-3 bg-white flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium text-neutral-900">{item.title}</p>
                    <p className="text-neutral-500 font-mono text-[11px] mt-0.5">
                      SKU: {item.sku} · Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono tabular-nums text-neutral-900 font-medium">
                      {formatINR(item.unitPrice * item.quantity)}
                    </span>
                    <p className="text-[11px] text-neutral-400 font-mono">
                      {formatINR(item.unitPrice)} ea
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer & Shipping Summary */}
          <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white space-y-3">
            <span className="text-xs font-semibold text-neutral-900 uppercase tracking-wider block">
              Customer Details
            </span>
            <div className="text-xs space-y-1.5">
              <p className="font-medium text-neutral-900">{order.customer_name}</p>
              <p className="text-neutral-600 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                <span>{order.customer_email}</span>
              </p>
              <p className="text-neutral-600 flex items-start gap-1.5 pt-1">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                <span>{order.shipping_address || '742 Evergreen Terrace, Brooklyn, NY 11201'}</span>
              </p>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white space-y-2 text-xs">
            <span className="text-xs font-semibold text-neutral-900 uppercase tracking-wider block mb-2">
              Financial Breakdown
            </span>
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">{formatINR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Estimated Tax</span>
              <span className="font-mono tabular-nums">{formatINR(order.tax)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Standard Shipping</span>
              <span className="font-mono tabular-nums">{formatINR(order.shipping)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#E5E7EB] text-sm font-semibold text-neutral-900">
              <span>Total Paid</span>
              <span className="font-clash text-base font-bold tabular-nums">
                {formatINR(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
          <span className="text-xs text-neutral-500 font-mono">
            ID: {order.id}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
