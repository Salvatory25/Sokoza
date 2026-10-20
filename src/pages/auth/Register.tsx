import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { isValidTanzanianPhone } from '../../lib/whatsapp';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User, Mail, Lock, Phone } from 'lucide-react';

export const Register: React.FC = () => {
  const { signup } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (phone && !isValidTanzanianPhone(phone)) {
      showToast('Please enter a valid Tanzanian mobile number (e.g. 0712 345 678)', 'error');
      return;
    }

    setIsLoading(true);
    const res = await signup(email, password, name, phone);
    setIsLoading(false);

    if (res.success) {
      // Direct seller to onboarding setup
      navigate('/seller/onboarding');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-left space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-charcoal-900 tracking-tight">
          {t('auth.signUpTitle')}
        </h1>
        <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
          {t('auth.signUpSubtitle')}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-soft-sm space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Your Full Name"
            placeholder="e.g. Asha Bakari"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label={t('auth.email')}
            type="email"
            placeholder="asha@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="WhatsApp Mobile Number"
            placeholder="0712 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
            hint="For order inquiries and buyer communications"
            required
          />

          <Input
            label={t('auth.password')}
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Input
            label={t('auth.confirmPassword')}
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="w-full justify-center shadow-coral-glow"
            isLoading={isLoading}
          >
            {t('auth.signUpBtn')}
          </Button>
        </form>

        <div className="text-center pt-2 text-xs text-charcoal-500">
          <span>{t('auth.hasAccount')} </span>
          <Link to="/login" className="font-bold text-brand-600 hover:underline">
            {t('auth.signInBtn')}
          </Link>
        </div>
      </div>
    </div>
  );
};
