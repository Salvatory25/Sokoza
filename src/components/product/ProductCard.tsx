import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types/database';
import { formatTZS, calculateDiscountPercent } from '../../lib/currency';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { ShoppingBag, MessageCircle, Store, AlertCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '../../lib/whatsapp';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { t, language } = useLanguage();
  const { addItem, setIsCartDrawerOpen } = useCart();

  const discountPercent = calculateDiscountPercent(
    product.price_tzs,
    product.compare_at_price_tzs
  );

  const mainImage =
    product.images && product.images.length > 0
      ? product.images[0].storage_path
      : 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80';

  const isOutOfStock = product.stock_quantity <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || !product.shop) return;
    const added = addItem(product, product.shop);
    if (added) {
      setIsCartDrawerOpen(true);
    }
  };

  const handleQuickWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.shop) return;

    // Navigate to product details with WhatsApp prompt, or build instant single product WhatsApp chat
    const url = buildWhatsAppUrl({
      shopName: product.shop.name,
      whatsappNumber: product.shop.whatsapp_number,
      orderReference: `INQ-${Math.floor(1000 + Math.random() * 9000)}`,
      items: [
        {
          name: product.name,
          quantity: 1,
          subtotalTzs: product.price_tzs,
        },
      ],
      itemsSubtotalTzs: product.price_tzs,
      deliveryFeeTzs: null,
      fulfillmentMethod: 'delivery',
      customerName: 'Customer',
      customerPhone: '',
      region: 'Tanzania',
      district: '',
      language,
    });

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="group bg-white rounded-2xl border border-surface-border shadow-soft-sm hover:shadow-soft-md hover:border-brand-300 transition-all duration-200 flex flex-col overflow-hidden relative">
      {/* Image Container with Badges */}
      <Link to={`/product/${product.slug}`} className="relative aspect-square overflow-hidden bg-surface-subtle block">
        <img
          src={mainImage}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Discount Badge */}
        {discountPercent && (
          <span className="absolute top-2.5 left-2.5 bg-coral-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-coral-glow uppercase tracking-wider">
            -{discountPercent}%
          </span>
        )}

        {/* Stock status indicator */}
        {isOutOfStock ? (
          <span className="absolute top-2.5 right-2.5 bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>{t('product.outOfStock')}</span>
          </span>
        ) : product.stock_quantity < 5 ? (
          <span className="absolute top-2.5 right-2.5 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-soft-sm">
            {t('product.unitsLeft', { count: product.stock_quantity })}
          </span>
        ) : null}
      </Link>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Shop Tag */}
          {product.shop && (
            <Link
              to={`/shop/${product.shop.slug}`}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-charcoal-400 hover:text-brand-600 transition mb-1 truncate max-w-full"
            >
              <Store className="w-3 h-3 text-brand-600 shrink-0" />
              <span className="truncate">{product.shop.name}</span>
            </Link>
          )}

          {/* Product Name */}
          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="text-sm font-bold text-charcoal-900 group-hover:text-brand-600 transition line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Pricing & Actions */}
        <div className="pt-3 mt-3 border-t border-surface-border">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-base font-extrabold text-charcoal-900 leading-none">
              {formatTZS(product.price_tzs)}
            </span>
            {product.compare_at_price_tzs && (
              <span className="text-xs text-charcoal-400 line-through">
                {formatTZS(product.compare_at_price_tzs)}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full py-2 px-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
              title="Add to cart"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Cart</span>
            </button>

            <button
              onClick={handleQuickWhatsApp}
              disabled={isOutOfStock}
              className="w-full py-2 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-soft-sm transition flex items-center justify-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
              title="Order on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
