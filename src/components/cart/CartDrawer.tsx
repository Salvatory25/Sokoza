import React from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { Drawer } from '../ui/Drawer';
import { formatTZS } from '../../lib/currency';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Store, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

export const CartDrawer: React.FC = () => {
  const {
    items,
    sellerGroups,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    removeItem,
    totalItemCount,
  } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleCheckoutShop = (shopId: string) => {
    setIsCartDrawerOpen(false);
    navigate(`/checkout?shopId=${shopId}`);
  };

  return (
    <Drawer
      isOpen={isCartDrawerOpen}
      onClose={() => setIsCartDrawerOpen(false)}
      title={`${t('cart.title')} (${totalItemCount})`}
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4 text-brand-600">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-charcoal-900 mb-1">{t('cart.emptyTitle')}</h3>
          <p className="text-xs text-charcoal-400 max-w-xs mb-6">{t('cart.emptyDesc')}</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setIsCartDrawerOpen(false);
              navigate('/catalog');
            }}
          >
            {t('cart.startShopping')}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Multi-Seller Notice if items from > 1 shop */}
          {sellerGroups.length > 1 && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-brand-900">
              <AlertCircle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Separate Seller Orders</p>
                <p className="opacity-90 leading-relaxed">
                  Your cart contains products from {sellerGroups.length} independent shops. Each seller handles their own delivery and orders are sent separately to each shop on WhatsApp.
                </p>
              </div>
            </div>
          )}

          {/* Grouped by Seller */}
          {sellerGroups.map((group) => (
            <div
              key={group.shopId}
              className="bg-surface-warm border border-surface-border rounded-2xl p-4 shadow-soft-sm"
            >
              {/* Seller Header */}
              <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-charcoal-900 leading-none">
                      {group.shop.name}
                    </h4>
                    <span className="text-[11px] text-charcoal-400">
                      {group.shop.region}, {group.shop.district}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-brand-700">
                  {formatTZS(group.subtotalTzs)}
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-surface-border">
                {group.items.map((item) => {
                  const imageSrc =
                    item.product.images && item.product.images.length > 0
                      ? item.product.images[0].storage_path
                      : 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=200&q=80';

                  return (
                    <div key={item.id} className="py-3 flex items-center gap-3">
                      <img
                        src={imageSrc}
                        alt={item.product.name}
                        className="w-14 h-14 object-cover rounded-xl border border-surface-border shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-semibold text-charcoal-900 truncate">
                          {item.product.name}
                        </h5>
                        {item.selectedVariant && (
                          <span className="text-[10px] text-coral-600 font-medium block">
                            {item.selectedVariant.name}: {item.selectedVariant.value}
                          </span>
                        )}
                        <span className="text-xs font-bold text-charcoal-800">
                          {formatTZS(item.unitPriceTzs)}
                        </span>
                      </div>

                      {/* Quantity Control & Remove */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="flex items-center border border-surface-border rounded-lg bg-white overflow-hidden shadow-soft-sm">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-surface-subtle text-charcoal-600 transition"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-charcoal-900 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-surface-subtle text-charcoal-600 transition"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-0.5 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{t('cart.remove')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Shop Subtotal & Checkout Button */}
              <div className="mt-3 pt-3 border-t border-surface-border flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-charcoal-500">{t('cart.shopTotal')}:</span>
                  <span className="font-bold text-charcoal-900">
                    {formatTZS(group.subtotalTzs)}
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => handleCheckoutShop(group.shopId)}
                >
                  <span>Checkout with {group.shop.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* View Full Cart Page Link */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => {
                setIsCartDrawerOpen(false);
                navigate('/cart');
              }}
            >
              View Full Cart Breakdown
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
};
