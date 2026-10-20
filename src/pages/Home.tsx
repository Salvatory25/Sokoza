import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { fetchCategories, fetchProducts, fetchShops } from '../lib/api';
import { Category, Product, Shop } from '../types/database';
import { ProductCard } from '../components/product/ProductCard';
import { ShopCard } from '../components/shop/ShopCard';
import { Button } from '../components/ui/Button';
import {
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  Truck,
  Sparkles,
  Store,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Tag,
  Clock,
} from 'lucide-react';

export const Home: React.FC = () => {
  const { t, language } = useLanguage();

  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [discountProducts, setDiscountProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [cats, allProds, allShops] = await Promise.all([
          fetchCategories(),
          fetchProducts(),
          fetchShops('approved'),
        ]);

        setCategories(cats);
        setShops(allShops);

        // Trending: products that are featured or top of list
        setTrendingProducts(allProds.slice(0, 4));

        // Recently added: sorted by created date
        setRecentProducts(
          [...allProds]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 4)
        );

        // Featured products
        setFeaturedProducts(allProds.filter((p) => p.is_featured).slice(0, 4));

        // Special offers (has compare_at_price_tzs)
        setDiscountProducts(
          allProds.filter((p) => p.compare_at_price_tzs && p.compare_at_price_tzs > p.price_tzs).slice(0, 4)
        );
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      }
    }

    loadHomeData();
  }, []);

  return (
    <div className="space-y-16 pb-20 overflow-x-hidden">
      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION                                                  */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-8 pb-12 lg:pt-16 lg:pb-20 bg-gradient-to-b from-brand-50/60 via-surface-warm to-surface-warm">
        {/* Decorative soft purple & coral ambient blur glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-coral-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Editorial Headline & Actions */}
            <div className="lg:col-span-7 text-left space-y-6">
              <div className="inline-flex items-center gap-2 bg-brand-100/80 text-brand-800 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase shadow-soft-sm">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>{t('hero.badge')}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-charcoal-900 tracking-tight leading-[1.1]">
                {language === 'sw' ? (
                  <>
                    Maduka Uyapendayo. <br />
                    <span className="text-brand-600 underline decoration-coral-500 decoration-wavy decoration-4">
                      Moja kwa Moja
                    </span>{' '}
                    WhatsApp.
                  </>
                ) : (
                  <>
                    Your Favorite Shops. <br />
                    <span className="text-brand-600 underline decoration-coral-500 decoration-wavy decoration-4">
                      Direct On
                    </span>{' '}
                    WhatsApp.
                  </>
                )}
              </h1>

              <p className="text-base sm:text-lg text-charcoal-600 max-w-xl leading-relaxed">
                {t('hero.description')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/catalog">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    {t('hero.exploreBtn')}
                  </Button>
                </Link>

                <Link to="/seller/onboarding">
                  <Button variant="outline" size="lg" leftIcon={<Store className="w-4 h-4 text-coral-500" />}>
                    {t('hero.sellBtn')}
                  </Button>
                </Link>
              </div>

              {/* Quick trending searches */}
              <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                <span className="font-bold text-charcoal-600">Popular:</span>
                {['Vitenge', 'Kariakoo Tech', 'Handmade Sandals', 'Zanzibar Spices'].map((tag) => (
                  <Link
                    key={tag}
                    to={`/catalog?q=${encodeURIComponent(tag)}`}
                    className="px-2.5 py-1 rounded-full bg-white/90 hover:bg-white text-charcoal-700 hover:text-brand-600 border border-surface-border transition shadow-xs font-medium"
                  >
                    {tag}
                  </Link>
                ))}
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-surface-border/80">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3.5 py-2.5 rounded-2xl border border-surface-border/80 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-charcoal-800">{t('hero.stat1')}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3.5 py-2.5 rounded-2xl border border-surface-border/80 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="text-xs font-bold text-charcoal-800">{t('hero.stat2')}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3.5 py-2.5 rounded-2xl border border-surface-border/80 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-coral-500 shrink-0" />
                  <span className="text-xs font-bold text-charcoal-800">{t('hero.stat3')}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Curated Showcase Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Visual Image Card */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/3] bg-surface-subtle group">
                  <img
                    src="https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=800&q=80"
                    alt="Authentic Tanzanian Fabric Market"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/80 via-charcoal-900/20 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <span className="bg-coral-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                      Dar es Salaam • Kariakoo
                    </span>
                    <h4 className="text-lg font-bold mt-1 text-white">Authentic Vitenge & Artisanal Crafts</h4>
                    <p className="text-xs text-charcoal-200">Chat and order directly in Tanzanian Shillings</p>
                  </div>
                </div>

                {/* Floating WhatsApp Card Badge */}
                <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-soft-lg border border-surface-border max-w-[260px] hidden sm:flex items-center gap-3 transition-transform hover:-translate-y-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-charcoal-900 leading-tight">Instant Order Chat</p>
                    <p className="text-[10px] text-charcoal-400">Prefilled WhatsApp message with 1 click</p>
                  </div>
                </div>

                {/* Floating Currency Pill */}
                <div className="absolute -top-4 -right-4 bg-brand-600 text-white px-3.5 py-2 rounded-2xl shadow-purple-glow text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Always in TZS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: SHOP BY CATEGORY                                   */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900">
              {t('sections.shopByCategory')}
            </h2>
            <p className="text-sm text-charcoal-400 mt-1">
              {t('sections.shopByCategorySubtitle')}
            </p>
          </div>
          <Link
            to="/catalog"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700 transition"
          >
            <span>{t('common.viewAll')}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/catalog?category=${cat.id}`}
              className="group bg-white rounded-3xl border border-surface-border p-4 shadow-soft-sm hover:shadow-soft-lg hover:border-brand-400 hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-subtle mb-3 p-1 ring-1 ring-surface-border/80 group-hover:ring-brand-500/40 group-hover:scale-105 transition-all duration-300">
                <img
                  src={cat.image_path || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=200&q=80'}
                  alt={cat.name_en}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <h3 className="text-xs font-bold text-charcoal-900 group-hover:text-brand-600 transition line-clamp-1">
                {language === 'sw' ? cat.name_sw : cat.name_en}
              </h3>
              <span className="text-[10px] text-charcoal-400 mt-1 font-medium bg-surface-subtle px-2 py-0.5 rounded-full">
                {cat.product_count ? `${cat.product_count} items` : 'Explore'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: TRENDING PRODUCTS                                  */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900">
                {t('sections.trendingProducts')}
              </h2>
              <p className="text-sm text-charcoal-400">
                {t('sections.trendingSubtitle')}
              </p>
            </div>
          </div>
          <Link
            to="/catalog"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700 transition"
          >
            <span>{t('common.viewAll')}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 6: SPECIAL OFFERS & DISCOUNTS                         */}
      {/* ------------------------------------------------------------- */}
      {discountProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-coral-500/10 via-brand-50 to-coral-50 rounded-3xl p-6 sm:p-10 border border-coral-200/60">
            <div className="flex items-end justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-coral-500 text-white flex items-center justify-center shadow-coral-glow">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900">
                    {t('sections.specialOffers')}
                  </h2>
                  <p className="text-sm text-charcoal-500">
                    {t('sections.specialOffersSubtitle')}
                  </p>
                </div>
              </div>
              <Link
                to="/catalog"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-coral-600 hover:text-coral-700 transition"
              >
                <span>{t('common.viewAll')}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {discountProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4: FEATURED PICKS                                     */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900">
              {t('sections.featuredProducts')}
            </h2>
            <p className="text-sm text-charcoal-400 mt-1">
              {t('sections.featuredSubtitle')}
            </p>
          </div>
          <Link
            to="/catalog"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700 transition"
          >
            <span>{t('common.viewAll')}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5: POPULAR SHOPS                                      */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900">
              {t('sections.popularShops')}
            </h2>
            <p className="text-sm text-charcoal-400 mt-1">
              {t('sections.popularShopsSubtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: RECENTLY ADDED PRODUCTS                            */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-subtle text-charcoal-700 flex items-center justify-center border border-surface-border">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900">
                {t('sections.recentlyAdded')}
              </h2>
              <p className="text-sm text-charcoal-400">
                {t('sections.recentlySubtitle')}
              </p>
            </div>
          </div>
          <Link
            to="/catalog"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700 transition"
          >
            <span>{t('common.viewAll')}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 8: HOW WHATSAPP ORDERING WORKS                        */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-surface-border p-8 sm:p-12 shadow-soft-sm">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900">
              {t('sections.howItWorksTitle')}
            </h2>
            <p className="text-sm text-charcoal-500 mt-2">
              {t('sections.howItWorksSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-surface-warm/80 backdrop-blur-xs rounded-3xl p-7 border border-surface-border text-left relative group hover:border-brand-500 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center font-extrabold text-base mb-5 shadow-purple-glow group-hover:scale-105 transition-transform">
                01
              </div>
              <h3 className="text-base font-bold text-charcoal-900 mb-2">
                {t('howItWorks.step1Title')}
              </h3>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                {t('howItWorks.step1Desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-surface-warm/80 backdrop-blur-xs rounded-3xl p-7 border border-surface-border text-left relative group hover:border-coral-500 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-coral-600 to-coral-400 text-white flex items-center justify-center font-extrabold text-base mb-5 shadow-coral-glow group-hover:scale-105 transition-transform">
                02
              </div>
              <h3 className="text-base font-bold text-charcoal-900 mb-2">
                {t('howItWorks.step2Title')}
              </h3>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                {t('howItWorks.step2Desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-surface-warm/80 backdrop-blur-xs rounded-3xl p-7 border border-surface-border text-left relative group hover:border-emerald-500 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center font-extrabold text-base mb-5 shadow-soft-sm group-hover:scale-105 transition-transform">
                03
              </div>
              <h3 className="text-base font-bold text-charcoal-900 mb-2">
                {t('howItWorks.step3Title')}
              </h3>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                {t('howItWorks.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 9: CUSTOMER TRUST AND SAFETY                          */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900">
            {t('sections.trustTitle')}
          </h2>
          <p className="text-sm text-charcoal-500 mt-2">
            {t('sections.trustSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-7 border border-surface-border text-left shadow-soft-sm hover:shadow-soft-lg hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 border border-emerald-100 shadow-xs">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-charcoal-900 mb-2">
              {t('trust.directChatTitle')}
            </h3>
            <p className="text-xs text-charcoal-500 leading-relaxed">
              {t('trust.directChatDesc')}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-7 border border-surface-border text-left shadow-soft-sm hover:shadow-soft-lg hover:border-brand-400 hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5 border border-brand-100 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-charcoal-900 mb-2">
              {t('trust.currencyTitle')}
            </h3>
            <p className="text-xs text-charcoal-500 leading-relaxed">
              {t('trust.currencyDesc')}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-7 border border-surface-border text-left shadow-soft-sm hover:shadow-soft-lg hover:border-coral-400 hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-coral-50 text-coral-600 flex items-center justify-center mb-5 border border-coral-100 shadow-xs">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-charcoal-900 mb-2">
              {t('trust.localDeliveryTitle')}
            </h3>
            <p className="text-xs text-charcoal-500 leading-relaxed">
              {t('trust.localDeliveryDesc')}
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 7: SELLER RECRUITMENT CTA                             */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0E0E14] bg-gradient-to-r from-[#0E0E14] via-[#1F1054] to-[#0E0E14] rounded-3xl p-8 sm:p-14 text-white relative overflow-hidden shadow-2xl border border-brand-700/50">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-coral-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-10 top-0 w-64 h-64 bg-brand-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative max-w-2xl text-left space-y-5">
            <span className="inline-flex items-center gap-1.5 bg-white/10 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider backdrop-blur-md border border-white/20">
              <Store className="w-3.5 h-3.5 text-coral-400" />
              <span>For Independent Tanzanian Sellers</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {t('sections.sellerCtaTitle')}
            </h2>
            <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed max-w-xl">
              {t('sections.sellerCtaDesc')}
            </p>
            <div className="pt-2">
              <Link to="/seller/onboarding">
                <Button variant="accent" size="lg" leftIcon={<Store className="w-5 h-5" />}>
                  {t('sections.sellerCtaButton')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
