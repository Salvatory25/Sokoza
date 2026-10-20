import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { TANZANIA_REGIONS } from '../../lib/tanzania';
import { isValidTanzanianPhone, normalizeTanzanianPhone, formatPhoneForDisplay } from '../../lib/whatsapp';
import { saveShopProfile } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ImageUpload } from '../../components/ui/ImageUpload';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  MapPin,
} from 'lucide-react';

export const SellerOnboarding: React.FC = () => {
  const { user, refreshUserShop } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [shopName, setShopName] = useState(user?.shop?.name || '');
  const [shopSlug, setShopSlug] = useState(user?.shop?.slug || '');
  const [description, setDescription] = useState(user?.shop?.description || '');
  const [logoUrl, setLogoUrl] = useState(
    user?.shop?.logo_path ||
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=300&q=80'
  );
  const [coverUrl, setCoverUrl] = useState(
    user?.shop?.cover_image_path ||
      'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80'
  );
  const [whatsappNumber, setWhatsappNumber] = useState(user?.shop?.whatsapp_number || '');
  const [region, setRegion] = useState(user?.shop?.region || 'Dar es Salaam');
  const [district, setDistrict] = useState(user?.shop?.district || 'Ilala');
  const [deliveryInfo, setDeliveryInfo] = useState(
    user?.shop?.delivery_information ||
      'Daily bus parcel shipping from Dar es Salaam to all upcountry terminals. In-store pickup available.'
  );

  const [phoneError, setPhoneError] = useState('');

  // Auto-generate slug from shop name
  const handleShopNameChange = (name: string) => {
    setShopName(name);
    if (!shopSlug || shopSlug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setShopSlug(generated);
    }
  };

  const steps = [
    { number: 1, title: 'Shop Name & Slug' },
    { number: 2, title: 'Branding & Description' },
    { number: 3, title: 'WhatsApp Number' },
    { number: 4, title: 'Location & Delivery' },
    { number: 5, title: 'Store Preview & Launch' },
  ];

  const handleNext = () => {
    if (currentStep === 1) {
      if (!shopName.trim()) {
        showToast('Please enter your shop name', 'error');
        return;
      }
      if (!shopSlug.trim()) {
        showToast('Please specify a unique shop slug', 'error');
        return;
      }
    } else if (currentStep === 3) {
      if (!whatsappNumber.trim() || !isValidTanzanianPhone(whatsappNumber)) {
        setPhoneError('Please enter a valid Tanzanian mobile number (e.g. 0712 345 678)');
        showToast('Valid Tanzanian WhatsApp number required', 'error');
        return;
      }
    }
    setCurrentStep((s) => Math.min(s + 1, 5));
  };

  const handlePrevious = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      const ownerId = user?.id || `user-seller-${Date.now()}`;
      const normalizedPhone = normalizeTanzanianPhone(whatsappNumber);

      await saveShopProfile({
        owner_id: ownerId,
        name: shopName.trim(),
        slug: shopSlug.trim(),
        description: description.trim(),
        logo_path: logoUrl,
        cover_image_path: coverUrl,
        whatsapp_number: normalizedPhone,
        region,
        district,
        delivery_information: deliveryInfo.trim(),
      });

      await refreshUserShop();
      showToast('Shop profile saved successfully! Welcome to Sokoza Seller Center.', 'success');
      navigate('/seller');
    } catch (err: any) {
      console.error('Failed to save shop:', err);
      showToast(err.message || 'Error saving shop profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Regions & districts options
  const currentRegionObj = TANZANIA_REGIONS.find((r) => r.name === region);
  const districtOptions = currentRegionObj
    ? currentRegionObj.districts.map((d) => ({ value: d, label: d }))
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-charcoal-900 tracking-tight">
          {t('seller.onboardingTitle')}
        </h1>
        <p className="text-sm text-charcoal-500 mt-1">
          Complete your shop profile to start receiving direct WhatsApp orders across Tanzania.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="bg-white rounded-2xl border border-surface-border p-4 shadow-soft-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[500px]">
          {steps.map((st, idx) => (
            <React.Fragment key={st.number}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                    currentStep === st.number
                      ? 'bg-brand-600 text-white shadow-purple-glow'
                      : currentStep > st.number
                      ? 'bg-emerald-500 text-white'
                      : 'bg-surface-subtle text-charcoal-400'
                  }`}
                >
                  {currentStep > st.number ? <CheckCircle2 className="w-4 h-4" /> : st.number}
                </div>
                <span
                  className={`text-xs font-semibold whitespace-nowrap ${
                    currentStep === st.number ? 'text-charcoal-900' : 'text-charcoal-400'
                  }`}
                >
                  {st.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-3 bg-surface-border" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-10 shadow-soft-sm space-y-6">
        {/* STEP 1: SHOP NAME & SLUG */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-lg font-bold text-charcoal-900">Name Your Shop</h3>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Choose a recognizable name for your business. Customers will see this everywhere.
              </p>
            </div>

            <Input
              label="Shop Name"
              placeholder="e.g. Kariakoo Smart Electronics or Swahili Vitenge Studio"
              value={shopName}
              onChange={(e) => handleShopNameChange(e.target.value)}
              required
            />

            <div>
              <Input
                label="Unique Shop URL Slug"
                placeholder="kariakoo-smart-electronics"
                value={shopSlug}
                onChange={(e) => setShopSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                hint={`Your storefront link will be: https://sokoza.co.tz/shop/${shopSlug || 'your-shop'}`}
                required
              />
            </div>
          </div>
        )}

        {/* STEP 2: BRANDING & LOGO */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-lg font-bold text-charcoal-900">Branding & Shop Story</h3>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Tell buyers what you sell and upload your shop logo and banner.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
                Shop Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what products you specialize in, authenticity guarantees, and return policies..."
                className="w-full rounded-xl border border-surface-border p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ImageUpload
                label="Shop Logo"
                folder="shops/logos"
                onImageUploaded={(url) => setLogoUrl(url)}
              />
              <ImageUpload
                label="Cover Banner"
                folder="shops/banners"
                onImageUploaded={(url) => setCoverUrl(url)}
              />
            </div>

            {/* Visual Preview */}
            <div className="border border-surface-border rounded-2xl p-4 bg-surface-subtle flex items-center gap-4">
              <img src={logoUrl} alt="Logo preview" className="w-14 h-14 rounded-2xl object-cover border" />
              <div className="text-xs">
                <span className="font-bold text-charcoal-900 block">{shopName || 'Shop Name'}</span>
                <span className="text-charcoal-500">Logo and banner ready</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: WHATSAPP NUMBER */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-lg font-bold text-charcoal-900">WhatsApp Contact for Orders</h3>
              <p className="text-xs text-charcoal-400 mt-0.5">
                All customer orders will be sent directly to this WhatsApp number.
              </p>
            </div>

            <Input
              label="WhatsApp Phone Number"
              placeholder="e.g. 0712 345 678 or 255712345678"
              value={whatsappNumber}
              onChange={(e) => {
                setWhatsappNumber(e.target.value);
                if (phoneError) setPhoneError('');
              }}
              error={phoneError}
              hint="Must be a Tanzanian mobile number capable of receiving WhatsApp messages."
              leftIcon={<MessageCircle className="w-4 h-4 text-emerald-600" />}
              required
            />

            {whatsappNumber && isValidTanzanianPhone(whatsappNumber) && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Valid Tanzanian number recognized: <strong>{formatPhoneForDisplay(whatsappNumber)}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: LOCATION & DELIVERY */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-lg font-bold text-charcoal-900">Location & Delivery Arrangements</h3>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Let shoppers know where your shop or dispatch depot is located.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Region in Tanzania"
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  const regObj = TANZANIA_REGIONS.find((r) => r.name === e.target.value);
                  if (regObj && regObj.districts.length > 0) {
                    setDistrict(regObj.districts[0]);
                  }
                }}
                options={TANZANIA_REGIONS.map((r) => ({ value: r.name, label: r.name }))}
              />

              <Select
                label="District"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                options={districtOptions}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
                Delivery & Parcel Shipping Policy
              </label>
              <textarea
                rows={3}
                value={deliveryInfo}
                onChange={(e) => setDeliveryInfo(e.target.value)}
                placeholder="e.g. Bus parcel to all regions via Mbezi Luis / Ubungo terminal. Free collection in town..."
                className="w-full rounded-xl border border-surface-border p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 5: PREVIEW & LAUNCH */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-lg font-bold text-charcoal-900">Storefront Review</h3>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Here is how your storefront card will appear to shoppers across Tanzania.
              </p>
            </div>

            {/* Live Card Preview */}
            <div className="max-w-md mx-auto bg-white rounded-3xl border border-surface-border shadow-soft-md overflow-hidden">
              <div className="h-32 bg-charcoal-900 overflow-hidden relative">
                <img src={coverUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-6 pt-0 relative">
                <img
                  src={logoUrl}
                  alt=""
                  className="w-16 h-16 rounded-2xl border-4 border-white object-cover -mt-8 shadow-soft-sm bg-white"
                />
                <h4 className="text-lg font-bold text-charcoal-900 mt-2">{shopName}</h4>
                <p className="text-xs text-charcoal-500 line-clamp-2 mt-1">{description}</p>
                <div className="flex items-center gap-2 text-xs text-charcoal-600 mt-3">
                  <MapPin className="w-3.5 h-3.5 text-coral-500" />
                  <span>{district}, {region}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-700 mt-2 font-semibold">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp: {formatPhoneForDisplay(whatsappNumber)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-6 border-t border-surface-border flex items-center justify-between">
          {currentStep > 1 ? (
            <Button
              variant="outline"
              size="md"
              onClick={handlePrevious}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <Button
              variant="primary"
              size="md"
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="accent"
              size="lg"
              onClick={handleFinishOnboarding}
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-5 h-5" />}
            >
              Launch My Shop Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
