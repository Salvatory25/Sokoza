import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchOrderByReference } from '../lib/api';
import { Order, OrderStatus } from '../types/database';
import { formatTZS } from '../lib/currency';
import { formatPhoneForDisplay } from '../lib/whatsapp';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  MessageCircle,
  Copy,
  Check,
  AlertCircle,
  XCircle,
  Store,
  ShieldCheck,
} from 'lucide-react';

export const TrackOrder: React.FC = () => {
  const { orderReference: urlReference } = useParams<{ orderReference?: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { showToast } = useToast();

  const [inputRef, setInputRef] = useState(urlReference || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(urlReference));
  const [hasSearched, setHasSearched] = useState(Boolean(urlReference));
  const [copied, setCopied] = useState(false);

  const loadOrder = React.useCallback(async (reference: string) => {
    const trimmed = reference.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const found = await fetchOrderByReference(trimmed);
      setOrder(found);
      if (!found) {
        showToast('No order found with this reference', 'error');
      }
    } catch (err) {
      console.error('Failed to look up order:', err);
      showToast('Error looking up order', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (urlReference) {
      loadOrder(urlReference);
    }
  }, [urlReference, loadOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRef.trim()) {
      navigate(`/track-order/${encodeURIComponent(inputRef.trim().toUpperCase())}`);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Reference copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const getStatusStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'pending':
        return 0;
      case 'confirmed':
        return 1;
      case 'processing':
        return 2;
      case 'out_for_delivery':
      case 'ready_for_collection':
        return 3;
      case 'completed':
        return 4;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const steps = [
    { label: 'Order Submitted', labelSw: 'Oda Imetumwa', desc: 'Received by Sokoza' },
    { label: 'Seller Confirmed', labelSw: 'Imethibitishwa', desc: 'Shop verified stock' },
    { label: 'Processing', labelSw: 'Inaandaliwa', desc: 'Items packed & prepared' },
    { label: 'In Transit / Ready', labelSw: 'Njiani / Tayari', desc: 'Dispatched for delivery or pickup' },
    { label: 'Completed', labelSw: 'Imekamilika', desc: 'Delivered & finalized' },
  ];

  const currentStep = order ? getStatusStepIndex(order.status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left space-y-10">
      {/* Title & Search Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider">
          <Truck className="w-3.5 h-3.5" />
          <span>{language === 'sw' ? 'Ufuatiliaji wa Oda' : 'Real-Time Order Tracking'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
          {language === 'sw' ? 'Fuatilia Oda Yako ya Sokoza' : 'Track Your Sokoza Order'}
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-500 max-w-lg mx-auto">
          {language === 'sw'
            ? 'Weka namba ya kumbukumbu ya oda yako (mfano SKZ-202610-1234) kuona hali na maelezo.'
            : 'Enter your unique order reference from WhatsApp or your order confirmation screen.'}
        </p>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto pt-4 flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="e.g. SKZ-202610-9482"
              value={inputRef}
              onChange={(e) => setInputRef(e.target.value.toUpperCase())}
              className="font-mono text-sm uppercase pl-9"
              required
            />
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-3 pointer-events-none" />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="shrink-0"
          >
            {language === 'sw' ? 'Tafuta' : 'Track'}
          </Button>
        </form>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-white rounded-3xl border border-surface-border p-12 text-center space-y-4 shadow-soft-sm">
          <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mx-auto" />
          <p className="text-xs text-charcoal-500">Searching marketplace order records...</p>
        </div>
      )}

      {/* Not Found State */}
      {!isLoading && hasSearched && !order && (
        <div className="bg-white rounded-3xl border border-surface-border p-10 text-center max-w-md mx-auto space-y-4 shadow-soft-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-charcoal-900">
            {language === 'sw' ? 'Oda Haijapatikana' : 'Order Not Found'}
          </h3>
          <p className="text-xs text-charcoal-500">
            {language === 'sw'
              ? 'Tafadhali hakikisha namba ya kumbukumbu uliyoweka ni sahihi. Oda zilizotumwa hivi punde zinaweza kuchukua dakika chache.'
              : 'Please check your order reference code (format: SKZ-YYYYMM-XXXX). Check your WhatsApp chat with the seller for the exact code.'}
          </p>
          <div className="pt-2">
            <Link to="/catalog">
              <Button variant="outline" size="sm">
                {language === 'sw' ? 'Rudi Sokoni' : 'Browse Marketplace'}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Order Details Found */}
      {!isLoading && order && (
        <div className="space-y-6">
          {/* Top Banner & Status Header */}
          <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-soft-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-extrabold text-charcoal-900 bg-surface-subtle px-3 py-1 rounded-xl border border-surface-border">
                    {order.order_reference}
                  </span>
                  <button
                    onClick={() => handleCopy(order.order_reference)}
                    className="p-1.5 rounded-lg text-charcoal-400 hover:text-brand-600 hover:bg-brand-50 transition"
                    title="Copy Order Reference"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-charcoal-400">
                  Placed on{' '}
                  {new Date(order.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Status Badge */}
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    order.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : order.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-brand-100 text-brand-800'
                  }`}
                >
                  {order.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {order.status === 'cancelled' && <XCircle className="w-4 h-4 text-red-600" />}
                  {order.status === 'pending' && <Clock className="w-4 h-4 text-amber-600" />}
                  {['confirmed', 'processing', 'out_for_delivery', 'ready_for_collection'].includes(
                    order.status
                  ) && <Package className="w-4 h-4 text-brand-600" />}
                  <span>{order.status.replace(/_/g, ' ')}</span>
                </span>
              </div>
            </div>

            {/* Stepper Visual Timeline (if not cancelled) */}
            {order.status !== 'cancelled' ? (
              <div className="py-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {steps.map((st, idx) => {
                    const isDone = currentStep >= idx;
                    const isCurrent = currentStep === idx;

                    return (
                      <div
                        key={st.label}
                        className={`p-3 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-brand-50 border-brand-300 shadow-soft-sm'
                            : isDone
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-surface-subtle/40 border-surface-border opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {isDone ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-charcoal-200 text-charcoal-600 flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </div>
                          )}
                          <span
                            className={`text-xs font-bold leading-tight ${
                              isCurrent
                                ? 'text-brand-900'
                                : isDone
                                ? 'text-emerald-900'
                                : 'text-charcoal-500'
                            }`}
                          >
                            {language === 'sw' ? st.labelSw : st.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-charcoal-500 line-clamp-2">{st.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>
                  This order was cancelled. If you believe this is in error, please contact the seller directly.
                </span>
              </div>
            )}

            {/* WhatsApp Contact Shop Bar */}
            {order.shop && (
              <div className="bg-surface-warm p-4 sm:p-5 rounded-2xl border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-charcoal-900">{order.shop.name}</h4>
                    <p className="text-xs text-charcoal-500">
                      Seller in {order.shop.district}, {order.shop.region}
                    </p>
                  </div>
                </div>

                <a
                  href={`https://wa.me/${order.shop.whatsapp_number}?text=${encodeURIComponent(
                    `Hello ${order.shop.name}! I am inquiring about my Sokoza order ${order.order_reference}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-soft-sm transition shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    Chat Seller ({formatPhoneForDisplay(order.shop.whatsapp_number)})
                  </span>
                </a>
              </div>
            )}
          </div>

          {/* Items & Delivery Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Items List */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-surface-border p-6 shadow-soft-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-700 pb-3 border-b border-surface-border">
                Ordered Items ({order.items?.length || 0})
              </h3>

              <div className="divide-y divide-surface-border">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-3">
                      {item.image_url_snapshot ? (
                        <img
                          src={item.image_url_snapshot}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover border shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-surface-subtle flex items-center justify-center text-charcoal-300 shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h5 className="font-bold text-charcoal-900">{item.product_name_snapshot}</h5>
                        {item.selected_variant_snapshot && (
                          <span className="text-[11px] text-coral-600 font-medium block">
                            {item.selected_variant_snapshot}
                          </span>
                        )}
                        <span className="text-charcoal-400">
                          {item.quantity} × {formatTZS(item.unit_price_tzs)}
                        </span>
                      </div>
                    </div>

                    <span className="font-bold text-charcoal-900 shrink-0">
                      {formatTZS(item.line_subtotal_tzs)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div className="pt-4 border-t border-surface-border space-y-2 text-xs">
                <div className="flex justify-between items-center text-charcoal-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-charcoal-900">
                    {formatTZS(order.items_subtotal_tzs)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-charcoal-600">
                  <span>Delivery Charges:</span>
                  <span className="italic text-amber-700 font-semibold">
                    {order.fulfillment_method === 'collection'
                      ? 'Self Pickup (Free)'
                      : order.delivery_fee_tzs !== null
                      ? formatTZS(order.delivery_fee_tzs)
                      : 'Confirmed with seller on WhatsApp'}
                  </span>
                </div>
                <div className="pt-2 border-t border-surface-border flex justify-between items-center text-sm font-extrabold text-charcoal-900">
                  <span>Items Total:</span>
                  <span className="text-base text-brand-700">
                    {formatTZS(order.items_subtotal_tzs)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Destination & Customer */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-surface-border p-6 shadow-soft-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-700 pb-3 border-b border-surface-border">
                Fulfillment Details
              </h3>

              <div className="space-y-3 text-xs text-charcoal-600">
                <div>
                  <span className="text-[11px] text-charcoal-400 block font-medium">Customer Name:</span>
                  <span className="font-bold text-charcoal-900 text-sm">{order.customer_name}</span>
                </div>

                <div>
                  <span className="text-[11px] text-charcoal-400 block font-medium">Customer Phone:</span>
                  <span className="font-bold text-charcoal-900">
                    {formatPhoneForDisplay(order.customer_phone)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-charcoal-400 block font-medium">Method:</span>
                  <span className="font-semibold text-charcoal-800">
                    {order.fulfillment_method === 'delivery'
                      ? 'Door Delivery / Bus Parcel'
                      : 'Self Pickup at Shop'}
                  </span>
                </div>

                {order.fulfillment_method === 'delivery' && (
                  <div className="pt-2 border-t border-surface-border space-y-1">
                    <span className="text-[11px] text-charcoal-400 block font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-coral-500" /> Destination:
                    </span>
                    <p className="font-bold text-charcoal-900">
                      {order.delivery_area}, {order.delivery_district}, {order.delivery_region}
                    </p>
                    {order.delivery_instructions && (
                      <p className="text-charcoal-500 italic mt-1 bg-surface-warm p-2.5 rounded-xl border border-surface-border">
                        "{order.delivery_instructions}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-surface-border flex items-center gap-2 text-[11px] text-charcoal-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified WhatsApp transaction protected by direct seller communication.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
