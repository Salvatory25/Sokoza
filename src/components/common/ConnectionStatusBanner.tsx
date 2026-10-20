import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Store, UserCheck, X, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

export const ConnectionStatusBanner: React.FC = () => {
  const { user, switchDemoRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const roleLabel =
    user?.role === 'admin'
      ? 'Admin'
      : user?.role === 'seller'
      ? user.shop?.name || 'Seller'
      : 'Shopper';

  return (
    <aside
      aria-label="Demo persona switcher"
      className="fixed bottom-4 left-4 z-50 print:hidden text-left"
    >
      {/* Popover options menu */}
      {isOpen && (
        <div className="mb-2 bg-charcoal-900/95 text-white backdrop-blur-xl border border-charcoal-700 rounded-2xl p-3 shadow-2xl w-72 animate-in fade-in slide-in-from-bottom-2 duration-150 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-charcoal-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Switch Demo Persona</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-charcoal-400 hover:text-white rounded-lg transition"
              aria-label="Close switcher"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                switchDemoRole('customer');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
                !user?.role || user.role === 'customer'
                  ? 'bg-brand-600 text-white font-bold'
                  : 'hover:bg-charcoal-800 text-charcoal-300'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="text-left flex-1">
                <p className="leading-tight">Public Shopper</p>
                <span className="text-[10px] text-charcoal-400">Browse & WhatsApp checkout</span>
              </div>
            </button>

            <button
              onClick={() => {
                switchDemoRole('seller', 0);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
                user?.role === 'seller' && user?.shop?.id === 'shop-1'
                  ? 'bg-brand-600 text-white font-bold'
                  : 'hover:bg-charcoal-800 text-charcoal-300'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div className="text-left flex-1">
                <p className="leading-tight">Kariakoo Tech</p>
                <span className="text-[10px] text-charcoal-400">Electronics seller portal</span>
              </div>
            </button>

            <button
              onClick={() => {
                switchDemoRole('seller', 1);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
                user?.role === 'seller' && user?.shop?.id === 'shop-2'
                  ? 'bg-brand-600 text-white font-bold'
                  : 'hover:bg-charcoal-800 text-charcoal-300'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-coral-400 shrink-0" />
              <div className="text-left flex-1">
                <p className="leading-tight">Swahili Vitenge</p>
                <span className="text-[10px] text-charcoal-400">Fashion seller portal</span>
              </div>
            </button>

            <button
              onClick={() => {
                switchDemoRole('admin');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
                user?.role === 'admin'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'hover:bg-charcoal-800 text-charcoal-300'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <div className="text-left flex-1">
                <p className="leading-tight">Platform Admin</p>
                <span className="text-[10px] text-charcoal-400">Super admin dashboard</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Floating Pill Trigger */}
      <div className="flex items-center gap-1 bg-charcoal-900/90 text-white backdrop-blur-md border border-charcoal-700/80 rounded-full px-3 py-1.5 shadow-lg text-xs">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 hover:text-brand-300 transition"
          aria-expanded={isOpen}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-charcoal-300">Persona:</span>
          <span className="font-bold text-white text-[11px]">{roleLabel}</span>
          {isOpen ? <ChevronDown className="w-3 h-3 text-charcoal-400" /> : <ChevronUp className="w-3 h-3 text-charcoal-400" />}
        </button>

        <span className="w-px h-3 bg-charcoal-700 mx-1" />

        <button
          onClick={() => setIsDismissed(true)}
          className="text-charcoal-400 hover:text-white p-0.5 rounded transition"
          title="Dismiss persona pill"
          aria-label="Dismiss persona pill"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
};
