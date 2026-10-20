import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { fetchCategories, fetchProducts, fetchShops } from '../lib/api';
import { Category, Product, Shop } from '../types/database';
import { ProductCard } from '../components/product/ProductCard';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  PackageOpen,
  Store,
  Check,
} from 'lucide-react';
import { formatTZS } from '../lib/currency';

export const Catalog: React.FC = () => {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state from URL or local
  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedShop = searchParams.get('shop') || '';
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'name'>('newest');

  // Mobile Filter Drawer
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [cats, shps] = await Promise.all([fetchCategories(), fetchShops('approved')]);
        setCategories(cats);
        setShops(shps);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    async function loadFilteredProducts() {
      setIsLoading(true);
      try {
        const data = await fetchProducts({
          categoryId: selectedCategory || undefined,
          shopId: selectedShop || undefined,
          search: searchQuery || undefined,
          minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
          maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
          inStockOnly: inStockOnly || undefined,
          sortBy,
        });
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch filtered products:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadFilteredProducts();
  }, [searchQuery, selectedCategory, selectedShop, minPrice, maxPrice, inStockOnly, sortBy]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set('q', val);
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

  const handleCategorySelect = (catId: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (catId === selectedCategory) {
      newParams.delete('category');
    } else {
      newParams.set('category', catId);
    }
    setSearchParams(newParams);
  };

  const handleShopSelect = (shopId: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (shopId === selectedShop) {
      newParams.delete('shop');
    } else {
      newParams.set('shop', shopId);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSortBy('newest');
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(selectedCategory) ||
    Boolean(selectedShop) ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    inStockOnly;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header & Search Bar */}
      <div>
        <h1 className="text-3xl font-extrabold text-charcoal-900 tracking-tight">
          {t('catalog.title')}
        </h1>
        <p className="text-sm text-charcoal-500 mt-1">{t('catalog.subtitle')}</p>
      </div>

      {/* Search Input & Mobile Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-lg">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t('catalog.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white border border-surface-border shadow-soft-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          />
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3.5 pointer-events-none" />
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-surface-border bg-white text-xs font-semibold px-3 py-2.5 text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-soft-sm"
          >
            <option value="newest">{t('catalog.sortNewest')}</option>
            <option value="price_asc">{t('catalog.sortPriceLow')}</option>
            <option value="price_desc">{t('catalog.sortPriceHigh')}</option>
            <option value="name">{t('catalog.sortName')}</option>
          </select>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3.5 py-2.5 bg-brand-50 text-brand-700 rounded-xl border border-brand-200 text-xs font-bold transition"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-600" />
            <span>{t('catalog.filters')}</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-coral-500" />
            )}
          </button>
        </div>
      </div>

      {/* Main Layout: Filters Sidebar (Desktop) + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block bg-white rounded-2xl border border-surface-border p-6 shadow-soft-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-brand-600" />
              <span>{t('catalog.filters')}</span>
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-coral-600 hover:text-coral-700 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <h4 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider mb-3">
              {t('catalog.categories')}
            </h4>
            <div className="space-y-1.5">
              <button
                onClick={() => handleCategorySelect('')}
                className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                  !selectedCategory
                    ? 'bg-brand-50 text-brand-700 font-bold'
                    : 'text-charcoal-600 hover:bg-surface-subtle'
                }`}
              >
                {t('catalog.allCategories')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg font-medium transition flex items-center justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-brand-50 text-brand-700 font-bold'
                      : 'text-charcoal-600 hover:bg-surface-subtle'
                  }`}
                >
                  <span className="truncate">
                    {language === 'sw' ? cat.name_sw : cat.name_en}
                  </span>
                  {selectedCategory === cat.id && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Shop Filter */}
          <div className="pt-4 border-t border-surface-border">
            <h4 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-brand-600" />
              <span>Shops</span>
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
              {shops.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleShopSelect(s.id)}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg font-medium transition flex items-center justify-between ${
                    selectedShop === s.id
                      ? 'bg-brand-50 text-brand-700 font-bold'
                      : 'text-charcoal-600 hover:bg-surface-subtle'
                  }`}
                >
                  <span className="truncate">{s.name}</span>
                  {selectedShop === s.id && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="pt-4 border-t border-surface-border">
            <h4 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider mb-3">
              {t('catalog.priceRange')}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder={t('catalog.minPrice')}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-surface-border focus:ring-1 focus:ring-brand-500"
              />
              <input
                type="number"
                placeholder={t('catalog.maxPrice')}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-surface-border focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Availability */}
          <div className="pt-4 border-t border-surface-border">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-charcoal-700">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span>{t('catalog.inStockOnly')}</span>
            </label>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-charcoal-400">Active filters:</span>
              {selectedCategory && (
                <span className="bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1 border border-brand-200">
                  Category:{' '}
                  {language === 'sw'
                    ? categories.find((c) => c.id === selectedCategory)?.name_sw
                    : categories.find((c) => c.id === selectedCategory)?.name_en}
                  <button onClick={() => handleCategorySelect(selectedCategory)} className="font-bold">×</button>
                </span>
              )}
              {selectedShop && (
                <span className="bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1 border border-brand-200">
                  Shop: {shops.find((s) => s.id === selectedShop)?.name}
                  <button onClick={() => handleShopSelect(selectedShop)} className="font-bold">×</button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1 border border-brand-200">
                  Price: {minPrice ? formatTZS(parseInt(minPrice, 10)) : '0'} –{' '}
                  {maxPrice ? formatTZS(parseInt(maxPrice, 10)) : 'Any'}
                  <button
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                    }}
                    className="font-bold"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-coral-600 hover:underline font-semibold ml-1"
              >
                {t('catalog.clearFilters')}
              </button>
            </div>
          )}

          {/* Results Count */}
          <div className="text-xs text-charcoal-400 font-medium">
            {t('catalog.showingResults', { count: products.length })}
          </div>

          {/* Products Loading Skeletons */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl border border-surface-border p-4 h-80 animate-pulse flex flex-col justify-between"
                >
                  <div className="bg-surface-subtle w-full h-44 rounded-xl" />
                  <div className="space-y-2 pt-3">
                    <div className="bg-surface-subtle h-4 w-3/4 rounded" />
                    <div className="bg-surface-subtle h-3 w-1/2 rounded" />
                  </div>
                  <div className="bg-surface-subtle h-8 w-full rounded-xl mt-3" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-surface-border p-12 text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
                <PackageOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-charcoal-900 mb-1">
                {t('catalog.noProductsFound')}
              </h3>
              <p className="text-xs text-charcoal-400 mb-6">
                {t('catalog.noProductsDesc')}
              </p>
              <Button variant="primary" size="sm" onClick={clearAllFilters}>
                {t('catalog.clearFilters')}
              </Button>
            </div>
          ) : (
            /* Product Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title={t('catalog.filterDrawerTitle')}
      >
        <div className="space-y-6 text-left">
          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider mb-2">
              {t('catalog.categories')}
            </h4>
            <div className="space-y-1">
              <button
                onClick={() => handleCategorySelect('')}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg ${
                  !selectedCategory ? 'bg-brand-50 text-brand-700 font-bold' : 'text-charcoal-700'
                }`}
              >
                {t('catalog.allCategories')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg ${
                    selectedCategory === cat.id
                      ? 'bg-brand-50 text-brand-700 font-bold'
                      : 'text-charcoal-700'
                  }`}
                >
                  {language === 'sw' ? cat.name_sw : cat.name_en}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="pt-4 border-t border-surface-border">
            <h4 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider mb-2">
              {t('catalog.priceRange')}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder={t('catalog.minPrice')}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border"
              />
              <input
                type="number"
                placeholder={t('catalog.maxPrice')}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border"
              />
            </div>
          </div>

          {/* Action */}
          <div className="pt-6 border-t border-surface-border">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => setIsFilterDrawerOpen(false)}
            >
              {t('catalog.applyFilters')}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
