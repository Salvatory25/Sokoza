import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', showTagline = false }) => {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group ${className}`}>
      {/* Brand Icon */}
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center shadow-purple-glow text-white group-hover:scale-105 transition-transform duration-200">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-6 h-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Shop canopy roof with modern arch */}
          <path d="M3 9l9-6 9 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" fill="white" fillOpacity="0.2" />
          <path d="M3 9l9-6 9 6" stroke="white" strokeWidth="2" />
          {/* Market basket / loop in vivid coral */}
          <path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" stroke="white" strokeWidth="2" />
          <path d="M10 15h4" stroke="#FF7657" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        {/* Accent indicator dot */}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-coral-500 rounded-full border-2 border-white" />
      </div>

      {/* Brand Name & Tagline */}
      <div className="flex flex-col text-left">
        <span className="font-heading font-extrabold text-2xl tracking-tight text-charcoal-900 leading-none">
          Soko<span className="text-brand-600">za</span>
        </span>
        {showTagline && (
          <span className="text-[10px] font-medium tracking-wide text-charcoal-400 uppercase mt-0.5">
            Your Shop. Your Market.
          </span>
        )}
      </div>
    </Link>
  );
};
