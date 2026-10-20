import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Store,
  Layers,
  ShoppingBag,
  FileText,
  ArrowLeft,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { isAdmin } = useAuth();

  // Protect route
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-charcoal-900 mb-2">Administrator Access Required</h2>
        <p className="text-xs text-charcoal-500 mb-6">
          This area is restricted to authorized platform administrators. You are currently signed in as a regular user or seller.
        </p>
        <Link to="/">
          <span className="text-xs text-brand-600 hover:underline font-bold">Return to Marketplace</span>
        </Link>
      </div>
    );
  }

  const adminNav = [
    { to: '/admin', end: true, label: 'Overview & Metrics', icon: <Shield className="w-4 h-4" /> },
    { to: '/admin/shops', label: 'Shop Approvals & Moderation', icon: <Store className="w-4 h-4" /> },
    { to: '/admin/orders', label: 'Marketplace Orders', icon: <ShoppingBag className="w-4 h-4" /> },
    { to: '/admin/categories', label: 'Category Manager', icon: <Layers className="w-4 h-4" /> },
    { to: '/admin/audit', label: 'Audit Logs', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Admin Navigation Sidebar */}
        <aside className="lg:col-span-3 bg-white rounded-3xl border border-surface-border p-5 shadow-soft-sm space-y-6 text-left">
          <div className="flex items-center gap-3 pb-4 border-b border-surface-border">
            <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white flex items-center justify-center font-bold shadow-soft-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Admin Control</h3>
              <span className="text-[11px] text-purple-700 font-semibold block">Super Administrator</span>
            </div>
          </div>

          <nav className="space-y-1">
            {adminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-purple-50 text-purple-800 shadow-soft-sm'
                      : 'text-charcoal-600 hover:bg-surface-subtle hover:text-charcoal-900'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="pt-4 border-t border-surface-border">
            <Link
              to="/"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-charcoal-600 hover:text-charcoal-900 hover:bg-surface-subtle transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </Link>
          </div>
        </aside>

        {/* Content Outlet */}
        <main className="lg:col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
