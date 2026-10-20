import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center bg-surface-subtle p-1 rounded-xl border border-surface-border">
      <button
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
          language === 'en'
            ? 'bg-white text-brand-700 shadow-soft-sm'
            : 'text-charcoal-400 hover:text-charcoal-900'
        }`}
        aria-label="Switch to English"
      >
        {!compact && <Globe className="w-3.5 h-3.5 text-brand-600" />}
        <span>EN</span>
      </button>

      <button
        onClick={() => setLanguage('sw')}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
          language === 'sw'
            ? 'bg-white text-brand-700 shadow-soft-sm'
            : 'text-charcoal-400 hover:text-charcoal-900'
        }`}
        aria-label="Badilisha lugha kuwa Kiswahili"
      >
        <span>SW</span>
      </button>
    </div>
  );
};
