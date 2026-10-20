import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fetchOrdersByShop, updateOrderStatus } from '../../lib/api';
import { Order, OrderStatus } from '../../types/database';
import { formatTZS } from '../../lib/currency';
import { formatPhoneForDisplay } from '../../lib/whatsapp';
import {
  ShoppingBag,
  MessageCircle,
  MapPin,
} from 'lucide-react';
import { Select } from '../../components/ui/Select';

export const SellerOrders: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const shop = user?.shop;

  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!shop) return;
    setIsLoading(true);
    try {
      const data = await fetchOrdersByShop(shop.id);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load seller orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [shop]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      showToast(`Order status updated to ${newStatus}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending Confirmation' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'ready_for_collection', label: 'Ready for Collection' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const filteredOrders =
    filterStatus === 'all' ? orders : orders.filter((o) => o.status === filterStatus);

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Incoming Orders</h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Manage your orders and contact buyers directly on WhatsApp.
          </p>
        </div>

        {/* Status Filter */}
        <div className="w-56">
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={statusOptions}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-charcoal-400">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-surface-border p-12 text-center max-w-md mx-auto space-y-3">
          <ShoppingBag className="w-10 h-10 text-charcoal-300 mx-auto" />
          <h3 className="text-base font-bold text-charcoal-900">No Orders Found</h3>
          <p className="text-xs text-charcoal-400">
            Orders submitted by customers via WhatsApp will be listed here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-surface-border p-6 shadow-soft-sm space-y-4"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-extrabold text-sm text-charcoal-900 bg-surface-subtle px-2.5 py-1 rounded-lg border">
                    {order.order_reference}
                  </span>
                  <span className="text-xs text-charcoal-400">
                    {new Date(order.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-charcoal-500 font-medium">Status:</span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                    className="text-xs font-bold rounded-xl border border-surface-border px-3 py-1.5 bg-white text-charcoal-900 shadow-soft-sm focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="ready_for_collection">Ready for Collection</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Items Snapshot */}
              <div className="divide-y divide-surface-border/60">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-charcoal-900">
                        {item.product_name_snapshot}
                      </span>
                      {item.selected_variant_snapshot && (
                        <span className="text-coral-600 font-medium block">
                          {item.selected_variant_snapshot}
                        </span>
                      )}
                      <span className="text-charcoal-400">
                        Qty: {item.quantity} × {formatTZS(item.unit_price_tzs)}
                      </span>
                    </div>
                    <span className="font-bold text-charcoal-900">
                      {formatTZS(item.line_subtotal_tzs)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery Details & WhatsApp Contact */}
              <div className="pt-3 border-t border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs bg-surface-subtle p-4 rounded-2xl">
                <div className="space-y-1">
                  <p className="font-bold text-charcoal-900">Customer: {order.customer_name}</p>
                  <p className="text-charcoal-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-coral-500 shrink-0" />
                    <span>
                      {order.delivery_area}, {order.delivery_district}, {order.delivery_region}
                    </span>
                  </p>
                  {order.delivery_instructions && (
                    <p className="text-charcoal-500 italic">"{order.delivery_instructions}"</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="text-right">
                    <span className="text-charcoal-400 block text-[11px]">Items Total:</span>
                    <span className="text-sm font-extrabold text-brand-700">
                      {formatTZS(order.items_subtotal_tzs)}
                    </span>
                  </div>

                  <a
                    href={`https://wa.me/${order.customer_phone}?text=${encodeURIComponent(
                      `Hello ${order.customer_name}! Regarding your Sokoza order ${order.order_reference}...`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-soft-sm transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Chat ({formatPhoneForDisplay(order.customer_phone)})</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
