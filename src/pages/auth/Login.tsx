import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Store, Shield, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);
    if (res.success) {
      if (email.includes('admin')) {
        navigate('/admin');
      } else {
        navigate('/seller');
      }
    }
  };

  const handleQuickDemo = (role: 'seller' | 'admin') => {
    switchDemoRole(role);
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/seller');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-left space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-charcoal-900 tracking-tight">
          {t('auth.signInTitle')}
        </h1>
        <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
          {t('auth.signInSubtitle')}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-soft-sm space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('auth.email')}
            type="email"
            placeholder="seller@kariakootech.co.tz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
                {t('auth.password')}
              </label>
              <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center shadow-purple-glow"
            isLoading={isLoading}
          >
            {t('auth.signInBtn')}
          </Button>
        </form>

        {/* Quick Demo Sign In Shortcut */}
        <div className="pt-4 border-t border-surface-border space-y-3">
          <span className="text-[11px] text-charcoal-400 font-semibold uppercase tracking-wider block text-center">
            Or Demo Sign-In
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('seller')}
              className="px-3 py-2 rounded-xl bg-surface-subtle hover:bg-brand-50 border border-surface-border text-xs font-bold text-charcoal-800 transition flex items-center justify-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-brand-600" />
              <span>Seller Demo</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="px-3 py-2 rounded-xl bg-surface-subtle hover:bg-purple-50 border border-surface-border text-xs font-bold text-charcoal-800 transition flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>Admin Demo</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-2 text-xs text-charcoal-500">
          <span>{t('auth.noAccount')} </span>
          <Link to="/register" className="font-bold text-brand-600 hover:underline">
            {t('auth.signUpBtn')}
          </Link>
        </div>
      </div>
    </div>
  );
};
