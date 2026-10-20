import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TANZANIA_REGIONS } from '../lib/tanzania';
import { formatTZS } from '../lib/currency';
import { isValidTanzanianPhone, normalizeTanzanianPhone, buildWhatsAppUrl } from '../lib/whatsapp';
import { createOrder } from '../lib/api';
import { broadcastOrderNotification } from '../lib/notifications';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import {
  Store,
  MessageCircle,
  Truck,
  Building,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

export const Checkout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get('shopId');
  const navigate = useNavigate();

  const { sellerGroups, clearCart } = useCart();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Find the targeted seller group
  const activeGroup = sellerGroups.find((g) => g.shopId === shopId) || sellerGroups[0];

  // Customer Form State
  const [customerName, setCustomerName] = useState(user?.profile?.display_name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.profile?.phone || '');
  const [region, setRegion] = useState('Dar es Salaam');
  const [district, setDistrict] = useState('Kinondoni');
  const [deliveryArea, setDeliveryArea] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'delivery' | 'collection'>('delivery');

  const [phoneError, setPhoneError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available districts for current region
  const currentRegionObj = TANZANIA_REGIONS.find((r) => r.name === region);
  const districtOptions = currentRegionObj
    ? currentRegionObj.districts.map((d) => ({ value: d, label: d }))
    : [];

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    const regObj = TANZANIA_REGIONS.find((r) => r.name === newRegion);
    if (regObj && regObj.districts.length > 0) {
      setDistrict(regObj.districts[0]);
    }
  };

  const handlePhoneBlur = () => {
    if (customerPhone && !isValidTanzanianPhone(customerPhone)) {
      setPhoneError('Please enter a valid Tanzanian phone number (e.g. 0712 345 678 or 255712345678)');
    } else {
      setPhoneError('');
    }
  };

  if (!activeGroup || activeGroup.items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h2 className="text-xl font-bold text-charcoal-900 mb-2">No Items to Checkout</h2>
        <p className="text-xs text-charcoal-500 mb-6">
          Your cart for this shop is empty. Return to cart to select products.
        </p>
        <Link to="/cart">
          <Button variant="primary">Return to Cart</Button>
        </Link>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }

    if (!customerPhone.trim() || !isValidTanzanianPhone(customerPhone)) {
      setPhoneError('Please enter a valid Tanzanian WhatsApp number (e.g. 0712 345 678)');
      showToast('Please enter a valid Tanzanian WhatsApp number', 'error');
      return;
    }

    if (fulfillmentMethod === 'delivery' && !deliveryArea.trim()) {
      showToast('Please specify your delivery area / street / ward', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Prepare and persist order in database
      const createdOrder = await createOrder({
        shopId: activeGroup.shopId,
        customerUserId: user?.id || null,
        customerName: customerName.trim(),
        customerPhone: normalizeTanzanianPhone(customerPhone),
        deliveryRegion: region,
        deliveryDistrict: district,
        deliveryArea: deliveryArea.trim() || 'Store Pickup',
        deliveryInstructions: deliveryInstructions.trim() || null,
        fulfillmentMethod,
        itemsSubtotalTzs: activeGroup.subtotalTzs,
        deliveryFeeTzs: null, // Subject to seller confirmation
        customerLanguage: language,
        items: activeGroup.items.map((it) => ({
          productId: it.productId,
          productName: it.product.name,
          unitPriceTzs: it.unitPriceTzs,
          quantity: it.quantity,
          variantName: it.selectedVariant
            ? `${it.selectedVariant.name}: ${it.selectedVariant.value}`
            : null,
          imageUrl:
            it.product.images && it.product.images.length > 0
              ? it.product.images[0].storage_path
              : null,
        })),
      });

      // 2. Broadcast push notification to seller
      broadcastOrderNotification(createdOrder);

      // 3. Build WhatsApp Click-to-Chat URL
      const whatsappUrl = buildWhatsAppUrl({
        shopName: activeGroup.shop.name,
        whatsappNumber: activeGroup.shop.whatsapp_number,
        orderReference: createdOrder.order_reference,
        items: activeGroup.items.map((it) => ({
          name: it.product.name,
          quantity: it.quantity,
          subtotalTzs: it.unitPriceTzs * it.quantity,
          variantName: it.selectedVariant
            ? `${it.selectedVariant.name}: ${it.selectedVariant.value}`
            : null,
        })),
        itemsSubtotalTzs: activeGroup.subtotalTzs,
        deliveryFeeTzs: null,
        fulfillmentMethod,
        customerName: customerName.trim(),
        customerPhone: normalizeTanzanianPhone(customerPhone),
        region,
        district,
        deliveryArea: deliveryArea.trim() || 'Store Pickup',
        deliveryInstructions: deliveryInstructions.trim() || null,
        language,
      });

      // 3. Clear checked-out seller items from cart
      clearCart(activeGroup.shopId);

      // 4. Try opening WhatsApp directly
      const win = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

      // 5. Navigate to Order Confirmation summary page
      navigate(`/order-confirmation/${createdOrder.order_reference}`, {
        state: {
          order: createdOrder,
          shop: activeGroup.shop,
          whatsappUrl,
          popupBlocked: !win || win.closed || typeof win.closed === 'undefined',
        },
      });
    } catch (err: any) {
      console.error('Failed to submit order:', err);
      showToast(err.message || 'Failed to submit order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-8">
      {/* Back button & Title */}
      <div>
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-500 hover:text-brand-600 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
          {t('checkout.title')}
        </h1>
        <p className="text-xs text-charcoal-400 mt-1">
          {t('checkout.orderingFrom')} <strong className="text-brand-700">{activeGroup.shop.name}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Checkout Form */}
        <form onSubmit={handleSubmitOrder} className="lg:col-span-7 space-y-6">
          {/* Customer Details Box */}
          <div className="bg-white rounded-3xl border border-surface-border p-6 shadow-soft-sm space-y-4">
            <h2 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">1</span>
              <span>{t('checkout.customerInfo')}</span>
            </h2>

            <Input
              label={t('checkout.fullName')}
              placeholder={t('checkout.fullNamePlaceholder')}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />

            <Input
              label={t('checkout.phone')}
              placeholder={t('checkout.phonePlaceholder')}
              value={customerPhone}
              onChange={(e) => {
                setCustomerPhone(e.target.value);
                if (phoneError) setPhoneError('');
              }}
              onBlur={handlePhoneBlur}
              hint={t('checkout.phoneHelp')}
              error={phoneError}
              required
            />
          </div>

          {/* Delivery & Fulfillment Preference */}
          <div className="bg-white rounded-3xl border border-surface-border p-6 shadow-soft-sm space-y-4">
            <h2 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-coral-50 text-coral-700 flex items-center justify-center text-xs font-bold">2</span>
              <span>{t('checkout.fulfillment')}</span>
            </h2>

            {/* Radio Selection: Delivery vs Store Collection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFulfillmentMethod('delivery')}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition ${
                  fulfillmentMethod === 'delivery'
                    ? 'border-brand-600 bg-brand-50/50 shadow-soft-sm'
                    : 'border-surface-border hover:bg-surface-subtle'
                }`}
              >
                <Truck className={`w-5 h-5 shrink-0 mt-0.5 ${fulfillmentMethod === 'delivery' ? 'text-brand-600' : 'text-charcoal-400'}`} />
                <div>
                  <h4 className="text-xs font-bold text-charcoal-900">Delivery to Address / Bus</h4>
                  <p className="text-[11px] text-charcoal-500 mt-0.5">Courier or parcel dispatch</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentMethod('collection')}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition ${
                  fulfillmentMethod === 'collection'
                    ? 'border-brand-600 bg-brand-50/50 shadow-soft-sm'
                    : 'border-surface-border hover:bg-surface-subtle'
                }`}
              >
                <Building className={`w-5 h-5 shrink-0 mt-0.5 ${fulfillmentMethod === 'collection' ? 'text-brand-600' : 'text-charcoal-400'}`} />
                <div>
                  <h4 className="text-xs font-bold text-charcoal-900">Self Store Pickup</h4>
                  <p className="text-[11px] text-charcoal-500 mt-0.5">Pick up at seller store</p>
                </div>
              </button>
            </div>

            {/* Tanzanian Address Fields (if delivery selected) */}
            {fulfillmentMethod === 'delivery' && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label={t('checkout.region')}
                    value={region}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    options={TANZANIA_REGIONS.map((r) => ({ value: r.name, label: r.name }))}
                  />

                  <Select
                    label={t('checkout.district')}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    options={districtOptions}
                  />
                </div>

                <Input
                  label={t('checkout.area')}
                  placeholder={t('checkout.areaPlaceholder')}
                  value={deliveryArea}
                  onChange={(e) => setDeliveryArea(e.target.value)}
                  required
                />

                <Input
                  label={t('checkout.instructions')}
                  placeholder={t('checkout.instructionsPlaceholder')}
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="space-y-3">
            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full justify-center shadow-coral-glow"
              isLoading={isSubmitting}
              leftIcon={<MessageCircle className="w-5 h-5" />}
            >
              {t('checkout.sendWhatsAppBtn')}
            </Button>
            <p className="text-[11px] text-charcoal-500 text-center leading-relaxed">
              {t('checkout.disclaimer')}
            </p>
          </div>
        </form>

        {/* Right Column: Order Review */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-surface-border p-6 shadow-soft-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-surface-border">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">{activeGroup.shop.name}</h3>
              <p className="text-xs text-charcoal-400">
                {activeGroup.shop.district}, {activeGroup.shop.region}
              </p>
            </div>
          </div>

          {/* Items Summary List */}
          <div className="divide-y divide-surface-border max-h-72 overflow-y-auto custom-scrollbar">
            {activeGroup.items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-charcoal-900 truncate">{item.product.name}</h4>
                  {item.selectedVariant && (
                    <span className="text-[11px] text-coral-600 font-medium">
                      {item.selectedVariant.name}: {item.selectedVariant.value}
                    </span>
                  )}
                  <span className="text-charcoal-500 block">
                    {item.quantity} × {formatTZS(item.unitPriceTzs)}
                  </span>
                </div>
                <span className="font-bold text-charcoal-900 shrink-0">
                  {formatTZS(item.unitPriceTzs * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="pt-4 border-t border-surface-border space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-charcoal-600">
              <span>{t('checkout.itemsSubtotal')}:</span>
              <span className="font-bold text-charcoal-900">
                {formatTZS(activeGroup.subtotalTzs)}
              </span>
            </div>

            <div className="flex justify-between items-center text-charcoal-600">
              <span>{t('checkout.deliveryFee')}:</span>
              <span className="text-amber-700 font-semibold italic">
                {fulfillmentMethod === 'collection'
                  ? t('checkout.freeCollection')
                  : t('checkout.pendingSellerConfirmation')}
              </span>
            </div>

            <div className="pt-3 border-t border-surface-border flex justify-between items-center text-sm">
              <span className="font-bold text-charcoal-900">{t('checkout.estimatedTotal')}:</span>
              <span className="text-lg font-extrabold text-brand-700">
                {formatTZS(activeGroup.subtotalTzs)}
              </span>
            </div>
          </div>

          {/* Trust Notice */}
          <div className="bg-surface-warm p-4 rounded-2xl border border-surface-border text-xs text-charcoal-600 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              No upfront online payment required on Sokoza. You agree on payment (e.g. M-Pesa, Airtel Money, or cash on delivery) directly with {activeGroup.shop.name} in WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
