import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  ExternalLink,
  Store,
} from 'lucide-react';

export const SellerLayout: React.FC = () => {
  const { user } = useAuth();
  const shop = user?.shop;

  const navLinks = [
    { to: '/seller', end: true, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/seller/products', label: 'Products & Inventory', icon: <Package className="w-4 h-4" /> },
    { to: '/seller/orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
    { to: '/seller/onboarding', label: 'Shop Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Seller Sidebar Navigation */}
        <aside className="lg:col-span-3 bg-white rounded-3xl border border-surface-border p-5 shadow-soft-sm space-y-6 text-left">
          {/* Shop Quick Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-surface-border">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-soft-sm">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-charcoal-900 truncate">
                {shop?.name || 'Seller Center'}
              </h3>
              <span className="text-[11px] text-charcoal-400 block truncate">
                {shop ? `${shop.district}, ${shop.region}` : 'Complete Setup'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-soft-sm'
                      : 'text-charcoal-600 hover:bg-surface-subtle hover:text-charcoal-900'
                  }`
                }
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Public Store Preview Link */}
          {shop && (
            <div className="pt-4 border-t border-surface-border">
              <Link
                to={`/shop/${shop.slug}`}
                target="_blank"
                className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-surface-subtle hover:bg-brand-50 text-xs font-semibold text-charcoal-700 hover:text-brand-700 transition"
              >
                <span>View Public Store</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </aside>

        {/* Seller Content Outlet */}
        <main className="lg:col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
