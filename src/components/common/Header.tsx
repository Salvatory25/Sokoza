import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  ShoppingBag,
  Store,
  User,
  Menu,
  X,
  Shield,
  LayoutDashboard,
  LogOut,
  Truck,
  Compass,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { t } = useLanguage();
  const { totalItemCount, setIsCartDrawerOpen } = useCart();
  const { user, isSeller, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-surface-border/70 shadow-xs transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo */}
          <div className="shrink-0">
            <Logo showTagline={false} />
          </div>

          {/* Interactive Modern Search Bar on Desktop */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-lg mx-6 relative items-center"
          >
            <div className="relative w-full flex items-center">
              <Search className="w-4 h-4 text-charcoal-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('catalog.searchPlaceholder')}
                className="w-full pl-11 pr-14 py-2.5 text-sm rounded-full bg-surface-subtle/80 hover:bg-surface-subtle border border-surface-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-charcoal-400"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 p-1 rounded-full text-charcoal-400 hover:text-charcoal-700 hover:bg-surface-subtle transition"
                  aria-label="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="hidden xl:inline-flex items-center absolute right-3.5 px-2 py-0.5 text-[10px] font-bold text-charcoal-400 bg-surface-subtle rounded-md border border-surface-border/80 pointer-events-none">
                  ⌘K
                </span>
              )}
            </div>
          </form>

          {/* Desktop Navigation & Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/catalog"
              className="flex items-center gap-1.5 text-sm font-semibold text-charcoal-700 hover:text-brand-600 px-3 py-2 rounded-full hover:bg-surface-subtle transition"
            >
              <Compass className="w-4 h-4 text-charcoal-400" />
              <span>{t('nav.catalog')}</span>
            </Link>

            <Link
              to="/track-order"
              className="flex items-center gap-1.5 text-sm font-semibold text-charcoal-700 hover:text-brand-600 px-3 py-2 rounded-full hover:bg-surface-subtle transition"
            >
              <Truck className="w-4 h-4 text-charcoal-400" />
              <span>{t('nav.trackOrder')}</span>
            </Link>

            {/* Seller Portal or Start Selling CTA */}
            {isSeller ? (
              <Link
                to="/seller"
                className="flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-3.5 py-2 rounded-full border border-brand-200/70 transition shadow-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-brand-600" />
                <span>{t('nav.sellerDashboard')}</span>
              </Link>
            ) : (
              <Link
                to="/seller/onboarding"
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 px-4 py-2 rounded-full shadow-coral-glow hover:shadow-lg transition-all group"
              >
                <Store className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>{t('nav.startSelling')}</span>
              </Link>
            )}

            {/* Admin Link if role is admin */}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-full border border-purple-200 transition shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>{t('nav.adminDashboard')}</span>
              </Link>
            )}

            {/* Divider */}
            <div className="w-px h-5 bg-surface-border mx-1" />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative p-2.5 rounded-full bg-surface-subtle/80 hover:bg-surface-subtle text-charcoal-800 border border-surface-border/60 transition flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label={`Open Cart with ${totalItemCount} items`}
            >
              <ShoppingBag className="w-5 h-5 text-charcoal-700" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-tr from-coral-500 to-amber-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                  {totalItemCount}
                </span>
              )}
            </button>

            {/* User Account / Profile */}
            {user ? (
              <div className="flex items-center gap-2 pl-1">
                <Link
                  to="/seller"
                  className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-surface-subtle transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.profile?.display_name ? user.profile.display_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-bold text-charcoal-800 max-w-[100px] truncate hidden xl:inline">
                    {user.profile?.display_name || user.email.split('@')[0]}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                  title={t('nav.logout')}
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-xs font-bold text-charcoal-700 hover:text-brand-600 px-3 py-2 rounded-full hover:bg-surface-subtle border border-surface-border transition"
              >
                <User className="w-3.5 h-3.5 text-charcoal-500" />
                <span>{t('nav.login')}</span>
              </Link>
            )}
          </div>

          {/* Mobile Right Controls: Language, Cart & Menu */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher compact />

            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative p-2 rounded-full bg-surface-subtle text-charcoal-800 border border-surface-border transition"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-coral-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full bg-surface-subtle text-charcoal-800 border border-surface-border transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search input bar */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('catalog.searchPlaceholder')}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-full bg-surface-subtle border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-0.5 text-charcoal-400"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-surface-border bg-white/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top duration-200 shadow-xl">
          <Link
            to="/catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-charcoal-800 hover:bg-surface-subtle rounded-xl"
          >
            <Compass className="w-4 h-4 text-brand-600" />
            <span>{t('nav.catalog')}</span>
          </Link>

          <Link
            to="/track-order"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-charcoal-800 hover:bg-surface-subtle rounded-xl"
          >
            <Truck className="w-4 h-4 text-brand-600" />
            <span>{t('nav.trackOrder')}</span>
          </Link>

          <Link
            to="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold text-charcoal-800 hover:bg-surface-subtle rounded-xl"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-brand-600" />
              <span>{t('nav.cart')}</span>
            </div>
            <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold">
              {totalItemCount}
            </span>
          </Link>

          {isSeller ? (
            <Link
              to="/seller"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-brand-700 bg-brand-50 rounded-xl"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('nav.sellerDashboard')}</span>
            </Link>
          ) : (
            <Link
              to="/seller/onboarding"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-coral-500 to-coral-600 rounded-xl shadow-coral-glow"
            >
              <Store className="w-4 h-4" />
              <span>{t('nav.startSelling')}</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-purple-700 bg-purple-50 rounded-xl"
            >
              <Shield className="w-4 h-4" />
              <span>{t('nav.adminDashboard')}</span>
            </Link>
          )}

          <div className="pt-2 border-t border-surface-border">
            {user ? (
              <div className="flex items-center justify-between px-3 py-2 bg-surface-subtle rounded-xl">
                <span className="text-xs font-semibold text-charcoal-700 truncate">
                  {user.profile?.display_name || user.email}
                </span>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-600 font-bold flex items-center gap-1 hover:underline"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-purple-glow"
              >
                {t('nav.login')} / {t('nav.register')}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
