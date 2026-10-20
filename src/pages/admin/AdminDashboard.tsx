import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchShops, fetchProducts, fetchAllOrders, updateShopApproval } from '../../lib/api';
import { Order, Product, Shop } from '../../types/database';
import { formatTZS } from '../../lib/currency';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import {
  Store,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  ExternalLink,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();

  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchShop, setSearchShop] = useState('');
  const [filterShopStatus, setFilterShopStatus] = useState('all');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allShops, allProds, allOrds] = await Promise.all([
        fetchShops(''),
        fetchProducts(),
        fetchAllOrders(),
      ]);
      setShops(allShops);
      setProducts(allProds);
      setOrders(allOrds);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (shopId: string) => {
    try {
      await updateShopApproval(shopId, 'approved');
      showToast('Shop approved successfully', 'success');
      setShops((prev) =>
        prev.map((s) => (s.id === shopId ? { ...s, approval_status: 'approved' } : s))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to approve shop', 'error');
    }
  };

  const handleSuspend = async (shopId: string) => {
    try {
      await updateShopApproval(shopId, 'suspended');
      showToast('Shop suspended', 'warning');
      setShops((prev) =>
        prev.map((s) => (s.id === shopId ? { ...s, approval_status: 'suspended' } : s))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to suspend shop', 'error');
    }
  };

  const pendingShops = shops.filter((s) => s.approval_status === 'pending');
  const totalVolumeTzs = orders.reduce((sum, o) => sum + o.items_subtotal_tzs, 0);

  const filteredShops = shops.filter((s) => {
    const matchesStatus = filterShopStatus === 'all' || s.approval_status === filterShopStatus;
    const q = searchShop.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.district.toLowerCase().includes(q) ||
      s.region.toLowerCase().includes(q) ||
      s.whatsapp_number.includes(q);
    return matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="p-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-700 animate-spin mx-auto" />
        <p className="text-xs text-charcoal-500 font-medium">Loading marketplace overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">
          Marketplace Administration
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Overview of Tanzanian sellers, catalog moderation, and WhatsApp order volumes.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-soft-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-charcoal-500 font-medium block">Total Shops</span>
            <span className="text-2xl font-extrabold text-charcoal-900">{shops.length}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-soft-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-charcoal-500 font-medium block">Published Items</span>
            <span className="text-2xl font-extrabold text-purple-700">{products.length}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-soft-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-charcoal-500 font-medium block">Total Orders</span>
            <span className="text-2xl font-extrabold text-emerald-700">{orders.length}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-soft-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-coral-50 text-coral-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-charcoal-500 font-medium block">Order Volume (TZS)</span>
            <span className="text-lg font-extrabold text-coral-600 truncate block">
              {formatTZS(totalVolumeTzs)}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Shop Approvals Queue */}
      <div className="bg-white rounded-3xl border border-surface-border p-6 shadow-soft-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="text-base font-bold text-charcoal-900">
              Pending Seller Approvals ({pendingShops.length})
            </h2>
          </div>
        </div>

        {pendingShops.length === 0 ? (
          <div className="py-6 text-center text-xs text-charcoal-400">
            No seller shops currently awaiting administrative approval.
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {pendingShops.map((shop) => (
              <div
                key={shop.id}
                className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <h4 className="font-bold text-charcoal-900 text-sm">{shop.name}</h4>
                  <p className="text-charcoal-500">
                    Location: {shop.district}, {shop.region} • WhatsApp: +{shop.whatsapp_number}
                  </p>
                  <p className="text-charcoal-400 mt-1 line-clamp-1">{shop.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(shop.id)}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuspend(shop.id)}
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Shops Table */}
      <div className="bg-white rounded-3xl border border-surface-border p-6 shadow-soft-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-surface-border">
          <h2 className="text-base font-bold text-charcoal-900">
            Registered Marketplace Shops ({filteredShops.length})
          </h2>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search shops or region..."
                value={searchShop}
                onChange={(e) => setSearchShop(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-surface-subtle border border-surface-border focus:ring-1 focus:ring-purple-600"
              />
              <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-2.5 top-2 pointer-events-none" />
            </div>

            <select
              value={filterShopStatus}
              onChange={(e) => setFilterShopStatus(e.target.value)}
              className="text-xs rounded-xl border border-surface-border px-3 py-1.5 bg-surface-subtle text-charcoal-700 font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle text-charcoal-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Shop</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">WhatsApp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredShops.map((s) => (
                <tr key={s.id} className="hover:bg-surface-subtle/50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-charcoal-900">{s.name}</span>
                      <Link
                        to={`/shop/${s.slug}`}
                        target="_blank"
                        className="text-charcoal-400 hover:text-brand-600"
                        title="View public storefront"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-charcoal-600">{s.district}, {s.region}</td>
                  <td className="py-3 px-4 text-charcoal-600">+{s.whatsapp_number}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.approval_status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : s.approval_status === 'suspended'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {s.approval_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {s.approval_status === 'approved' ? (
                      <button
                        onClick={() => handleSuspend(s.id)}
                        className="text-red-600 hover:underline font-semibold"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(s.id)}
                        className="text-emerald-600 hover:underline font-semibold"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
