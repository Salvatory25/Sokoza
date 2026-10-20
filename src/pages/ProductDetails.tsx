import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProductBySlug, fetchProducts } from '../lib/api';
import { Product, ProductVariant } from '../types/database';
import { formatTZS, calculateDiscountPercent } from '../lib/currency';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { buildWhatsAppUrl } from '../lib/whatsapp';
import { ProductCard } from '../components/product/ProductCard';
import { Button } from '../components/ui/Button';
import {
  ShoppingBag,
  MessageCircle,
  Store,
  Share2,
  CheckCircle,
  Truck,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Minus,
  Plus,
} from 'lucide-react';

export const ProductDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const { addItem, setIsCartDrawerOpen } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const prod = await fetchProductBySlug(slug);
        setProduct(prod);

        if (prod) {
          // Preselect first variant if available
          if (prod.variants && prod.variants.length > 0) {
            setSelectedVariant(prod.variants[0]);
          }

          // Fetch related in same category
          const related = await fetchProducts({
            categoryId: prod.category_id,
            limit: 4,
          });
          setRelatedProducts(related.filter((r) => r.id !== prod.id));
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-6 bg-surface-subtle w-48 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-surface-subtle rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-surface-subtle w-3/4 rounded" />
            <div className="h-6 bg-surface-subtle w-1/3 rounded" />
            <div className="h-24 bg-surface-subtle w-full rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-charcoal-900 mb-2">Product Not Found</h2>
        <p className="text-xs text-charcoal-500 mb-6">
          This product may have been unpublished, sold out, or moved by the seller.
        </p>
        <Link to="/catalog">
          <Button variant="primary">Explore Available Products</Button>
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [
    {
      id: 'default',
      product_id: product.id,
      storage_path: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
      alt_text: product.name,
      sort_order: 0,
    },
  ];

  const currentPrice = product.price_tzs + (selectedVariant?.price_adjustment_tzs || 0);
  const discountPercent = calculateDiscountPercent(currentPrice, product.compare_at_price_tzs);

  const availableStock = selectedVariant
    ? selectedVariant.stock_quantity
    : product.stock_quantity;
  const isOutOfStock = availableStock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock || !product.shop) return;
    const added = addItem(product, product.shop, selectedVariant, quantity);
    if (added) {
      setIsCartDrawerOpen(true);
    }
  };

  const handleInstantWhatsApp = () => {
    if (!product.shop) return;

    // Single item direct checkout via WhatsApp
    const orderRef = `DIR-${Math.floor(1000 + Math.random() * 9000)}`;
    const lineTotal = currentPrice * quantity;

    const url = buildWhatsAppUrl({
      shopName: product.shop.name,
      whatsappNumber: product.shop.whatsapp_number,
      orderReference: orderRef,
      items: [
        {
          name: product.name,
          quantity,
          subtotalTzs: lineTotal,
          variantName: selectedVariant ? `${selectedVariant.name}: ${selectedVariant.value}` : null,
        },
      ],
      itemsSubtotalTzs: lineTotal,
      deliveryFeeTzs: null,
      fulfillmentMethod: 'delivery',
      customerName: 'Customer',
      customerPhone: '',
      region: product.shop.region,
      district: '',
      language,
    });

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${product.name} | Sokoza Tanzania`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast(t('product.copied'), 'success');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 text-left">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-charcoal-400">
        <Link to="/" className="hover:text-brand-600 transition">
          {t('nav.home')}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/catalog" className="hover:text-brand-600 transition">
          {t('nav.catalog')}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-charcoal-800 font-semibold truncate max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden border border-surface-border bg-white shadow-soft-sm">
            <img
              src={images[selectedImageIndex]?.storage_path}
              alt={images[selectedImageIndex]?.alt_text || product.name}
              className="w-full h-full object-cover"
            />
            {discountPercent && (
              <span className="absolute top-4 left-4 bg-coral-500 text-white font-bold text-xs px-3 py-1 rounded-full shadow-coral-glow uppercase tracking-wider">
                -{discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-brand-600 shadow-soft-md'
                      : 'border-surface-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.storage_path} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Meta, Variants, Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Shop Card Link */}
          {product.shop && (
            <Link
              to={`/shop/${product.shop.slug}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold border border-brand-200/60 transition"
            >
              <Store className="w-3.5 h-3.5 text-brand-600" />
              <span>{t('product.shop')}: {product.shop.name}</span>
            </Link>
          )}

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight leading-snug">
            {product.name}
          </h1>

          {/* Pricing */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-charcoal-900">
              {formatTZS(currentPrice)}
            </span>
            {product.compare_at_price_tzs && (
              <span className="text-base text-charcoal-400 line-through">
                {formatTZS(product.compare_at_price_tzs)}
              </span>
            )}
          </div>

          {/* Stock Availability */}
          <div className="flex items-center gap-2">
            {isOutOfStock ? (
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                {t('product.outOfStock')}
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>
                  {t('product.inStock')} ({availableStock} units)
                </span>
              </span>
            )}
            {product.sku && (
              <span className="text-xs text-charcoal-400 ml-2">SKU: {product.sku}</span>
            )}
          </div>

          {/* Variant Selector (if variants exist) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-surface-border">
              <label className="block text-xs font-bold text-charcoal-800 uppercase tracking-wider">
                Options / Variants:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      selectedVariant?.id === variant.id
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-soft-sm'
                        : 'border-surface-border text-charcoal-700 hover:bg-surface-subtle'
                    }`}
                  >
                    <span>{variant.name}: {variant.value}</span>
                    {variant.price_adjustment_tzs > 0 && (
                      <span className="ml-1 text-[10px] text-brand-600 font-normal">
                        (+{formatTZS(variant.price_adjustment_tzs)})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider">
              {t('product.quantity')}:
            </span>
            <div className="flex items-center border border-surface-border rounded-xl bg-white shadow-soft-sm overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="p-2 text-charcoal-600 hover:bg-surface-subtle transition disabled:opacity-40"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-4 text-sm font-bold text-charcoal-900">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                disabled={quantity >= availableStock}
                className="p-2 text-charcoal-600 hover:bg-surface-subtle transition disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CTAs: Add to Cart and Direct WhatsApp */}
          <div className="space-y-3 pt-4 border-t border-surface-border">
            <Button
              variant="accent"
              size="lg"
              className="w-full justify-center shadow-coral-glow"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              leftIcon={<ShoppingBag className="w-5 h-5" />}
            >
              {t('product.addToCart')}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full justify-center border-emerald-500/50 text-emerald-700 hover:bg-emerald-50"
              disabled={isOutOfStock}
              onClick={handleInstantWhatsApp}
              leftIcon={<MessageCircle className="w-5 h-5 text-emerald-600" />}
            >
              {t('product.orderNow')}
            </Button>
          </div>

          {/* Share & Trust Note */}
          <div className="pt-4 border-t border-surface-border flex items-center justify-between text-xs text-charcoal-500">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 hover:text-brand-600 transition font-medium"
            >
              <Share2 className="w-4 h-4 text-brand-600" />
              <span>{t('product.share')}</span>
            </button>
            <div className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
              <span>Direct WhatsApp Guarantee</span>
            </div>
          </div>

          {/* Description Section */}
          <div className="pt-6 border-t border-surface-border">
            <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider mb-2">
              {t('product.description')}
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Seller Location & Delivery Note */}
          {product.shop && (
            <div className="bg-surface-warm border border-surface-border rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-charcoal-900">
                <Truck className="w-4 h-4 text-coral-500" />
                <span>Delivery & Dispatch</span>
              </div>
              <p className="text-charcoal-600 leading-relaxed">
                {product.shop.delivery_information ||
                  `Dispatches from ${product.shop.district}, ${product.shop.region}. Parcel shipping arranged directly with seller.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="pt-12 border-t border-surface-border">
          <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal-900 mb-6">
            {t('product.relatedProducts')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
