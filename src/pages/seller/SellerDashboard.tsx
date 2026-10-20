import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchProducts, fetchOrdersByShop } from '../../lib/api';
import { Order, Product } from '../../types/database';
import { formatTZS } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { OrderNotificationPrompt } from '../../components/seller/OrderNotificationPrompt';
import {
  Package,
  ShoppingBag,
  Clock,
  AlertTriangle,
  Plus,
  ExternalLink,
  Store,
  MessageCircle,
} from 'lucide-react';

export const SellerDashboard: React.FC = () => {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const shop = user?.shop;

  useEffect(() => {
    async function loadSellerData() {
      if (!shop) return;
      setIsLoading(true);
      try {
        const [prods, ords] = await Promise.all([
          fetchProducts({ shopId: shop.id }),
          fetchOrdersByShop(shop.id),
        ]);
        setProducts(prods);
        setOrders(ords);
      } catch (err) {
        console.error('Failed to load seller dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSellerData();
  }, [shop]);

  if (!shop) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-charcoal-900 mb-2">No Shop Created Yet</h2>
        <p className="text-xs text-charcoal-500 mb-6">
          Set up your shop profile to access your seller dashboard, inventory management, and incoming WhatsApp orders.
        </p>
        <Link to="/seller/onboarding">
          <Button variant="accent">Complete Shop Setup</Button>
        </Link>
      </div>
    );
  }

  const publishedCount = products.filter((p) => p.status === 'published').length;
  const outOfStockCount = products.filter((p) => p.stock_quantity <= 0).length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="p-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mx-auto" />
        <p className="text-xs text-charcoal-500 font-medium">Loading dashboard overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* Top Welcome & Storefront link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
            {shop.name}
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Seller Dashboard • {shop.district}, {shop.region}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to={`/shop/${shop.slug}`} target="_blank">
            <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
              Preview Public Store
            </Button>
          </Link>

          <Link to="/seller/products/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Push Notification Banner */}
      <OrderNotificationPrompt
        onNewOrderReceived={(newOrder) => {
          setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
        }}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-soft-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-charcoal-500 font-medium block">Total Products</span>
            <span className="text-2xl font-extrabold text-charcoal-900">{products.length}</span>
          </div>
        </div>

        {/* Active Published */}
        <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-soft-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-charcoal-500 font-medium block">Active Listings</span>
            <span className="text-2xl font-extrabold text-emerald-700">{publishedCount}</span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-soft-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-coral-50 text-coral-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-charcoal-500 font-medium block">Pending Orders</span>
            <span className="text-2xl font-extrabold text-coral-600">{pendingOrdersCount}</span>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-soft-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-charcoal-500 font-medium block">Out of Stock</span>
            <span className="text-2xl font-extrabold text-amber-600">{outOfStockCount}</span>
          </div>
        </div>
      </div>

      {/* Recent Incoming Orders & Quick Product List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-surface-border shadow-soft-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand-600" />
              <h2 className="text-base font-bold text-charcoal-900">Recent Marketplace Orders</h2>
            </div>
            <Link to="/seller/orders" className="text-xs text-brand-600 hover:underline font-semibold">
              View All Orders →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-xs text-charcoal-400">
              <p>No orders recorded yet. As customers order via WhatsApp, they will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {orders.slice(0, 5).map((ord) => (
                <div key={ord.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-charcoal-900">{ord.order_reference}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ord.status === 'pending'
                          ? 'bg-amber-50 text-amber-700'
                          : ord.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-charcoal-100 text-charcoal-700'
                      }`}>
                        {ord.status}
                      </span>
                    </div>
                    <span className="text-charcoal-500 block mt-0.5">
                      {ord.customer_name} • {ord.delivery_district}, {ord.delivery_region}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <span className="font-extrabold text-charcoal-900">
                      {formatTZS(ord.items_subtotal_tzs)}
                    </span>
                    <a
                      href={`https://wa.me/${ord.customer_phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                      title="Open Customer WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Inventory Stock Alert */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-surface-border shadow-soft-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h3 className="text-sm font-bold text-charcoal-900">Inventory Status</h3>
            <Link to="/seller/products" className="text-xs text-brand-600 hover:underline font-semibold">
              Manage →
            </Link>
          </div>

          <div className="space-y-3">
            {products.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs py-1.5">
                <span className="truncate max-w-[160px] text-charcoal-800 font-medium">{p.name}</span>
                <span className={`font-bold px-2 py-0.5 rounded-md ${
                  p.stock_quantity <= 0
                    ? 'bg-red-50 text-red-700'
                    : p.stock_quantity < 5
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {p.stock_quantity} left
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
