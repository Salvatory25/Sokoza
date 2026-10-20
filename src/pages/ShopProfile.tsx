import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchShopBySlug, fetchProducts } from '../lib/api';
import { Product, Shop } from '../types/database';
import { ProductCard } from '../components/product/ProductCard';
import { formatPhoneForDisplay } from '../lib/whatsapp';
import {
  MapPin,
  MessageCircle,
  Truck,
  Search,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const ShopProfile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadShopData() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const foundShop = await fetchShopBySlug(slug);
        setShop(foundShop);

        if (foundShop) {
          const prods = await fetchProducts({ shopId: foundShop.id });
          setProducts(prods);
        }
      } catch (err) {
        console.error('Failed to load shop storefront:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadShopData();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-48 bg-surface-subtle rounded-3xl" />
        <div className="h-8 bg-surface-subtle w-1/3 rounded" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-charcoal-900 mb-2">Shop Not Found</h2>
        <p className="text-xs text-charcoal-500 mb-6">
          This seller shop might be pending approval or inactive.
        </p>
        <Link to="/catalog">
          <Button variant="primary">Return to Marketplace</Button>
        </Link>
      </div>
    );
  }

  const filteredProducts = searchQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  return (
    <div className="space-y-10 pb-16 text-left">
      {/* Shop Cover Banner */}
      <div className="relative h-60 sm:h-72 w-full bg-charcoal-900 overflow-hidden">
        <img
          src={
            shop.cover_image_path ||
            'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1600&q=80'
          }
          alt={shop.name}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/40 to-transparent" />
      </div>

      {/* Shop Info Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <div className="bg-white rounded-3xl border border-surface-border shadow-soft-md p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <img
                src={
                  shop.logo_path ||
                  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=200&q=80'
                }
                alt={shop.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-soft-md shrink-0 bg-white"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900">
                  {shop.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-charcoal-500">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-coral-500" />
                    <span>{shop.district}, {shop.region}</span>
                  </span>
                  <span>•</span>
                  <span>{products.length} products published</span>
                </div>
              </div>
            </div>

            {/* Direct Contact Button */}
            <a
              href={`https://wa.me/${shop.whatsapp_number}?text=${encodeURIComponent(
                `Hello! I am browsing your shop "${shop.name}" on Sokoza.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-soft-sm transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat with Seller ({formatPhoneForDisplay(shop.whatsapp_number)})</span>
            </a>
          </div>

          {/* Description & Delivery Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-surface-border text-xs">
            <div className="md:col-span-2">
              <h3 className="font-bold text-charcoal-900 uppercase tracking-wider mb-1">
                About this Shop
              </h3>
              <p className="text-charcoal-600 leading-relaxed">
                {shop.description || 'Verified Tanzanian seller on Sokoza marketplace.'}
              </p>
            </div>
            <div>
              <h3 className="font-bold text-charcoal-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-coral-500" />
                <span>Delivery Terms</span>
              </h3>
              <p className="text-charcoal-600 leading-relaxed">
                {shop.delivery_information || 'Arranged directly with seller on WhatsApp.'}
              </p>
            </div>
          </div>
        </div>

        {/* Shop Products Section */}
        <div className="mt-12 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-charcoal-900">
                Products from {shop.name}
              </h2>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Showing {filteredProducts.length} items
              </p>
            </div>

            {/* Search inside shop */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search this shop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-surface-border shadow-soft-sm focus:ring-1 focus:ring-brand-500"
              />
              <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-surface-border p-12 text-center">
              <p className="text-xs text-charcoal-500">No products match your search in this shop.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={{ ...p, shop }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
