import React from 'react';
import { Logo } from './Logo';
import { useLanguage } from '../../context/LanguageContext';
import { Link } from 'react-router-dom';
import { MessageCircle, ShieldCheck, Truck, Store, MapPin, Heart } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-charcoal-900 text-charcoal-300 pt-16 pb-12 border-t border-charcoal-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-charcoal-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/10 p-2 rounded-2xl inline-block backdrop-blur-sm">
              <Logo className="text-white" showTagline />
            </div>
            <p className="text-sm text-charcoal-300 leading-relaxed max-w-sm">
              {t('footer.about')}
            </p>
            <div className="flex items-center gap-2 text-xs text-charcoal-400">
              <MapPin className="w-4 h-4 text-coral-500 shrink-0" />
              <span>Dar es Salaam • Arusha • Mwanza • Zanzibar • Dodoma</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/catalog" className="hover:text-white transition">
                  {t('nav.catalog')}
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=cat-electronics" className="hover:text-white transition">
                  Electronics & Tech
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=cat-fashion" className="hover:text-white transition">
                  Fashion & Vitenge
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=cat-crafts" className="hover:text-white transition">
                  Crafts & Art
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition">
                  {t('nav.cart')}
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-white transition">
                  {t('nav.trackOrder')}
                </Link>
              </li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              {t('footer.sellers')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/seller/onboarding" className="hover:text-coral-400 font-semibold transition flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-coral-500" />
                  <span>{t('nav.startSelling')}</span>
                </Link>
              </li>
              <li>
                <Link to="/seller" className="hover:text-white transition">
                  {t('nav.sellerPortal')}
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  {t('nav.login')}
                </Link>
              </li>
              <li>
                <span className="text-xs text-charcoal-400 block pt-1">
                  Zero setup fees • Direct WhatsApp sales
                </span>
              </li>
            </ul>
          </div>

          {/* Trust & Guarantees */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Marketplace Trust
            </h4>
            <div className="space-y-3 text-xs text-charcoal-400">
              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Direct communication with verified local shop owners</span>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-coral-400 shrink-0 mt-0.5" />
                <span>Parcel dispatch across all 25+ Tanzanian regions</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>Transparent TZS pricing with zero hidden currency fees</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-charcoal-400">
          <p>© {CURRENT_YEAR} Sokoza. {t('footer.allRightsReserved')}</p>
          <div className="flex items-center gap-1">
            <span>Crafted for Tanzania with</span>
            <Heart className="w-3.5 h-3.5 text-coral-500 fill-coral-500" />
            <span className="ml-1">🇹🇿</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
