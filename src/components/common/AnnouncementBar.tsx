import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowRight, X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AnnouncementBar: React.FC = () => {
  const { t } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="bg-[#0E0E14] bg-gradient-to-r from-[#0E0E14] via-[#1F1054] to-[#0E0E14] text-white text-xs py-2 px-4 border-b border-white/10 shadow-xs relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="bg-gradient-to-r from-coral-500 to-amber-500 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-xs">
            <Sparkles className="w-3 h-3" />
            <span>{t('announcement.badge')}</span>
          </span>
          <p className="text-charcoal-200 truncate text-[11px] sm:text-xs font-medium">
            {t('announcement.message')}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/catalog"
            className="hidden md:inline-flex items-center gap-1 font-semibold text-coral-400 hover:text-coral-300 text-xs transition group"
          >
            <span>{t('announcement.cta')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <button
            onClick={() => setIsDismissed(true)}
            className="text-charcoal-400 hover:text-white p-1 rounded-md transition"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
