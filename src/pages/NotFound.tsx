import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home, PackageSearch } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-soft-sm">
        <PackageSearch className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-coral-600 uppercase tracking-widest">
          Error 404 • Ukurasa Haukupatikana
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm text-charcoal-500 max-w-sm mx-auto leading-relaxed">
          The page or product listing you are looking for doesn't exist, was renamed, or has been moved.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link to="/">
          <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
            Back to Home
          </Button>
        </Link>
        <Link to="/catalog">
          <Button variant="outline" size="md" leftIcon={<PackageSearch className="w-4 h-4" />}>
            Explore Products
          </Button>
        </Link>
      </div>
    </div>
  );
};
