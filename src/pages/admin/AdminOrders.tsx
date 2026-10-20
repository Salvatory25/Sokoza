import React, { useEffect, useState, useCallback } from 'react';
import { fetchAllOrders, updateOrderStatus } from '../../lib/api';
import { Order, OrderStatus } from '../../types/database';
import { formatTZS } from '../../lib/currency';
import { formatPhoneForDisplay } from '../../lib/whatsapp';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import {
  ShoppingBag,
  Search,
  Clock,
  Eye,
  MessageCircle,
  Store,
} from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load marketplace orders:', err);
      showToast('Failed to load orders', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      showToast(`Order status updated to ${newStatus}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'ready_for_collection', label: 'Ready for Collection' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      o.order_reference.toLowerCase().includes(query) ||
      o.customer_name.toLowerCase().includes(query) ||
      o.customer_phone.includes(query) ||
      (o.shop?.name && o.shop.name.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const totalVolumeTzs = orders.reduce((sum, o) => sum + o.items_subtotal_tzs, 0);

  return (
    <div className="space-y-6 text-left">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">
            Marketplace Orders
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Monitor and moderate all orders placed across Tanzanian seller shops.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrders}
            leftIcon={<Clock className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-surface-border shadow-soft-sm">
          <span className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider block">
            Total Orders
          </span>
          <span className="text-2xl font-extrabold text-charcoal-900">{orders.length}</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-surface-border shadow-soft-sm">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
            Pending Confirmation
          </span>
          <span className="text-2xl font-extrabold text-amber-600">{pendingCount}</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-surface-border shadow-soft-sm">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Completed Orders
          </span>
          <span className="text-2xl font-extrabold text-emerald-600">{completedCount}</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-surface-border shadow-soft-sm">
          <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider block">
            Total Volume (TZS)
          </span>
          <span className="text-lg font-extrabold text-brand-700 truncate block">
            {formatTZS(totalVolumeTzs)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by reference, buyer name, phone, or shop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-surface-border shadow-soft-sm focus:ring-1 focus:ring-purple-600"
          />
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={statusOptions}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-surface-border shadow-soft-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-charcoal-400">Loading marketplace orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-charcoal-400 space-y-2">
            <ShoppingBag className="w-8 h-8 text-charcoal-300 mx-auto" />
            <p>No orders found matching the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-charcoal-600 font-bold uppercase tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Shop</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-4">Total (TZS)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-subtle/50 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-charcoal-900 bg-surface-subtle px-2 py-0.5 rounded border">
                        {order.order_reference}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-charcoal-800">
                      {order.shop?.name || 'Local Seller'}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-charcoal-900 block">{order.customer_name}</span>
                      <span className="text-charcoal-400 text-[10px]">
                        {formatPhoneForDisplay(order.customer_phone)}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-charcoal-900">
                      {formatTZS(order.items_subtotal_tzs)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          order.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : order.status === 'cancelled'
                            ? 'bg-red-50 text-red-700'
                            : order.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-brand-50 text-brand-700'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-charcoal-400 text-[11px]">
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Order ${selectedOrder.order_reference}`}
          maxWidth="lg"
        >
          <div className="space-y-6 text-left text-xs">
            {/* Header info */}
            <div className="bg-surface-warm p-4 rounded-2xl border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-charcoal-400 block font-medium">Shop / Seller</span>
                <h4 className="font-bold text-sm text-charcoal-900 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-brand-600" />
                  <span>{selectedOrder.shop?.name || 'Local Seller'}</span>
                </h4>
              </div>

              <div>
                <span className="text-[11px] text-charcoal-400 block font-medium mb-1">Status Override:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                  className="rounded-xl border border-surface-border px-3 py-1 font-bold bg-white text-charcoal-900"
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

            {/* Buyer & Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-surface-border space-y-1">
                <span className="font-bold text-charcoal-900 uppercase tracking-wider text-[11px] block mb-1">
                  Customer
                </span>
                <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                <p><strong>Phone:</strong> {formatPhoneForDisplay(selectedOrder.customer_phone)}</p>
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${selectedOrder.customer_phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-600 font-bold hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Open WhatsApp Chat</span>
                  </a>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-surface-border space-y-1">
                <span className="font-bold text-charcoal-900 uppercase tracking-wider text-[11px] block mb-1">
                  Delivery Destination
                </span>
                <p><strong>Method:</strong> {selectedOrder.fulfillment_method}</p>
                <p><strong>Area:</strong> {selectedOrder.delivery_area}, {selectedOrder.delivery_district}, {selectedOrder.delivery_region}</p>
                {selectedOrder.delivery_instructions && (
                  <p className="italic text-charcoal-500">"{selectedOrder.delivery_instructions}"</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="bg-white p-4 rounded-2xl border border-surface-border space-y-3">
              <h5 className="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">
                Order Items ({selectedOrder.items?.length || 0})
              </h5>

              <div className="divide-y divide-surface-border">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-charcoal-900">{item.product_name_snapshot}</span>
                      {item.selected_variant_snapshot && (
                        <span className="text-coral-600 block text-[11px]">
                          {item.selected_variant_snapshot}
                        </span>
                      )}
                      <span className="text-charcoal-400 block text-[10px]">
                        Qty: {item.quantity} × {formatTZS(item.unit_price_tzs)}
                      </span>
                    </div>
                    <span className="font-bold text-charcoal-900">
                      {formatTZS(item.line_subtotal_tzs)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-between items-center text-sm font-extrabold text-charcoal-900">
                <span>Total Items Amount:</span>
                <span className="text-brand-700">{formatTZS(selectedOrder.items_subtotal_tzs)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
