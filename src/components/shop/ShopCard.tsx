import React from 'react';
import { Link } from 'react-router-dom';
import { Shop } from '../../types/database';
import { formatPhoneForDisplay } from '../../lib/whatsapp';
import { MapPin, MessageCircle, ArrowUpRight } from 'lucide-react';

export interface ShopCardProps {
  shop: Shop;
}

export const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  const coverImage =
    shop.cover_image_path ||
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80';

  const logoImage =
    shop.logo_path ||
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=150&q=80';

  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-soft-sm hover:shadow-soft-md hover:border-brand-300 transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Cover image header */}
      <div className="relative h-28 bg-surface-subtle overflow-hidden">
        <img
          src={coverImage}
          alt={shop.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/60 to-transparent" />
      </div>

      {/* Profile info & Logo */}
      <div className="px-5 pb-5 pt-0 flex-1 flex flex-col justify-between relative">
        {/* Floating Logo */}
        <div className="-mt-7 mb-3 flex items-end justify-between">
          <img
            src={logoImage}
            alt={shop.name}
            className="w-14 h-14 rounded-2xl border-2 border-white object-cover shadow-soft-md bg-white"
          />
          <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200/50">
            {shop.region}
          </span>
        </div>

        <div>
          <Link to={`/shop/${shop.slug}`} className="block">
            <h3 className="text-base font-bold text-charcoal-900 group-hover:text-brand-600 transition flex items-center gap-1.5">
              <span>{shop.name}</span>
              <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition text-brand-600 shrink-0" />
            </h3>
          </Link>

          <p className="text-xs text-charcoal-400 mt-1 line-clamp-2 leading-relaxed">
            {shop.description || 'Verified Tanzanian seller offering genuine products with WhatsApp order support.'}
          </p>

          <div className="flex items-center gap-2 mt-3 text-xs text-charcoal-600">
            <MapPin className="w-3.5 h-3.5 text-coral-500 shrink-0" />
            <span>{shop.district}, {shop.region}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-4 border-t border-surface-border flex items-center justify-between gap-3">
          <a
            href={`https://wa.me/${shop.whatsapp_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 transition"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{formatPhoneForDisplay(shop.whatsapp_number)}</span>
          </a>

          <Link
            to={`/shop/${shop.slug}`}
            className="px-3 py-1.5 rounded-xl bg-charcoal-100 hover:bg-brand-50 hover:text-brand-700 text-charcoal-800 text-xs font-semibold transition"
          >
            Visit Shop
          </Link>
        </div>
      </div>
    </div>
  );
};
