import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { formatTZS } from '../lib/currency';
import { Button } from '../components/ui/Button';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Store,
  ArrowRight,
  AlertCircle,
  Truck,
} from 'lucide-react';

export const Cart: React.FC = () => {
  const { items, sellerGroups, totalItemCount, updateQuantity, removeItem, clearCart } =
    useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-6 shadow-soft-sm">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-charcoal-900 mb-2">{t('cart.emptyTitle')}</h1>
        <p className="text-sm text-charcoal-500 mb-8 max-w-md mx-auto">
          {t('cart.emptyDesc')}
        </p>
        <Link to="/catalog">
          <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
            {t('cart.startShopping')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
            {t('cart.title')}
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            {t('cart.totalItems', { count: totalItemCount })}
          </p>
        </div>

        <button
          onClick={() => clearCart()}
          className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All Items</span>
        </button>
      </div>

      {/* Multi-Seller Explanation Banner */}
      {sellerGroups.length > 1 && (
        <div className="bg-brand-50/70 border border-brand-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs text-brand-950">
          <AlertCircle className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Multi-Seller Order Policy</h4>
            <p className="leading-relaxed opacity-90">
              {t('cart.multiSellerNotice', { count: sellerGroups.length })}
            </p>
          </div>
        </div>
      )}

      {/* Groups by Seller */}
      <div className="space-y-8">
        {sellerGroups.map((group) => (
          <div
            key={group.shopId}
            className="bg-white rounded-3xl border border-surface-border shadow-soft-sm overflow-hidden"
          >
            {/* Seller Header */}
            <div className="bg-surface-subtle px-6 py-4 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900">{group.shop.name}</h3>
                  <span className="text-xs text-charcoal-500">
                    Location: {group.shop.district}, {group.shop.region}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-charcoal-400 block">{t('cart.shopTotal')}:</span>
                <span className="text-base font-extrabold text-brand-700">
                  {formatTZS(group.subtotalTzs)}
                </span>
              </div>
            </div>

            {/* Items in Shop */}
            <div className="divide-y divide-surface-border p-6">
              {group.items.map((item) => {
                const img =
                  item.product.images && item.product.images.length > 0
                    ? item.product.images[0].storage_path
                    : 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=200&q=80';

                return (
                  <div
                    key={item.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={img}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-surface-border shrink-0"
                      />
                      <div>
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="text-sm font-bold text-charcoal-900 hover:text-brand-600 transition"
                        >
                          {item.product.name}
                        </Link>
                        {item.selectedVariant && (
                          <span className="text-xs text-coral-600 font-medium block mt-0.5">
                            {item.selectedVariant.name}: {item.selectedVariant.value}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-charcoal-700 block mt-1">
                          {formatTZS(item.unitPriceTzs)} each
                        </span>
                      </div>
                    </div>

                    {/* Quantity controls and Line Total */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      {/* Quantity box */}
                      <div className="flex items-center border border-surface-border rounded-xl bg-surface-subtle overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 hover:bg-surface-border text-charcoal-700 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-charcoal-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-surface-border text-charcoal-700 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line subtotal */}
                      <span className="text-sm font-bold text-charcoal-900 min-w-[90px] text-right">
                        {formatTZS(item.unitPriceTzs * item.quantity)}
                      </span>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-charcoal-400 hover:text-red-600 transition p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Shop Checkout Footer */}
            <div className="bg-surface-warm px-6 py-4 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-charcoal-500">
                <Truck className="w-4 h-4 text-coral-500 shrink-0" />
                <span>
                  Delivery arranged directly with {group.shop.name} upon submitting order.
                </span>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(`/checkout?shopId=${group.shopId}`)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {t('cart.checkoutWithSeller', { shopName: group.shop.name })}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
