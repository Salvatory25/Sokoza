import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export const ForgotPassword: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        showToast(error.message, 'error');
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
    setSubmitted(true);
    showToast('Password reset link sent to your email', 'success');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-left space-y-8">
      <div>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-500 hover:text-brand-600 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-charcoal-900 tracking-tight">
          {t('auth.resetPasswordTitle')}
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Enter your registered email address and we will send you a password reset link.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-soft-sm">
        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-charcoal-900">Check Your Email</h3>
            <p className="text-xs text-charcoal-500 max-w-xs mx-auto">
              We have dispatched a password reset link to <strong>{email}</strong>.
            </p>
            <Link to="/login">
              <Button variant="outline" size="sm" className="mt-4">
                Return to Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              placeholder="seller@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center shadow-purple-glow"
              isLoading={isLoading}
            >
              {t('auth.sendResetLink')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
