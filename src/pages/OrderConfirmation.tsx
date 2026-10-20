import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { formatTZS } from '../lib/currency';
import { Order, Shop } from '../types/database';
import { Button } from '../components/ui/Button';
import {
  MessageCircle,
  Copy,
  Check,
  Store,
  Clock,
  Sparkles,
} from 'lucide-react';
import { buildWhatsAppUrl, generateWhatsAppMessage } from '../lib/whatsapp';
import { fetchOrderByReference } from '../lib/api';

interface LocationState {
  order?: Order;
  shop?: Shop;
  whatsappUrl?: string;
  popupBlocked?: boolean;
}

export const OrderConfirmation: React.FC = () => {
  const { orderReference } = useParams<{ orderReference: string }>();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const state = (location.state as LocationState) || {};
  const [order, setOrder] = useState<Order | null>(state.order || null);
  const [shop, setShop] = useState<Shop | null>(state.shop || null);
  const [isLoading, setIsLoading] = useState(!state.order);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!order && orderReference) {
      fetchOrderByReference(orderReference)
        .then((ord) => {
          if (ord) {
            setOrder(ord);
            setShop(ord.shop || null);
          }
        })
        .catch((err) => {
          console.error('Failed to load order by reference:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [order, orderReference]);

  // Generate fallback WhatsApp URL if not passed in state
  const rawMessage =
    order && shop
      ? generateWhatsAppMessage({
          shopName: shop.name,
          whatsappNumber: shop.whatsapp_number,
          orderReference: order.order_reference,
          items:
            order.items?.map((it) => ({
              name: it.product_name_snapshot,
              quantity: it.quantity,
              subtotalTzs: it.line_subtotal_tzs,
              variantName: it.selected_variant_snapshot,
            })) || [],
          itemsSubtotalTzs: order.items_subtotal_tzs,
          deliveryFeeTzs: order.delivery_fee_tzs,
          fulfillmentMethod: order.fulfillment_method,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          region: order.delivery_region,
          district: order.delivery_district,
          deliveryArea: order.delivery_area,
          deliveryInstructions: order.delivery_instructions,
          language,
        })
      : '';

  const whatsappUrl =
    state.whatsappUrl ||
    (order && shop
      ? buildWhatsAppUrl({
          shopName: shop.name,
          whatsappNumber: shop.whatsapp_number,
          orderReference: order.order_reference,
          items:
            order.items?.map((it) => ({
              name: it.product_name_snapshot,
              quantity: it.quantity,
              subtotalTzs: it.line_subtotal_tzs,
              variantName: it.selected_variant_snapshot,
            })) || [],
          itemsSubtotalTzs: order.items_subtotal_tzs,
          deliveryFeeTzs: order.delivery_fee_tzs,
          fulfillmentMethod: order.fulfillment_method,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          region: order.delivery_region,
          district: order.delivery_district,
          deliveryArea: order.delivery_area,
          deliveryInstructions: order.delivery_instructions,
          language,
        })
      : '#');

  const handleCopyMessage = () => {
    if (rawMessage) {
      navigator.clipboard.writeText(rawMessage);
      setCopied(true);
      showToast(t('orderConfirmation.messageCopied'), 'success');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenWhatsApp = () => {
    if (whatsappUrl && whatsappUrl !== '#') {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mx-auto" />
        <p className="text-xs text-charcoal-500 font-medium">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left space-y-8">
      {/* Success Badge & Headline */}
      <div className="bg-white rounded-3xl border border-surface-border p-8 shadow-soft-md text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-soft-sm">
          <Sparkles className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
          {t('orderConfirmation.title')}
        </h1>

        <p className="text-sm text-charcoal-600 max-w-xl mx-auto">
          {t('orderConfirmation.subtitle', {
            reference: orderReference || 'SKZ-ORDER',
            shopName: shop?.name || 'Seller',
          })}
        </p>

        {/* Order Reference Pill */}
        <div className="inline-block bg-brand-50 border border-brand-200 text-brand-800 px-4 py-2 rounded-2xl font-mono font-bold text-sm">
          Order Ref: {orderReference}
        </div>

        {/* WhatsApp Launch & Fallback Copy Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <Button
            variant="accent"
            size="lg"
            className="w-full sm:w-auto flex-1 justify-center bg-emerald-500 hover:bg-emerald-600 shadow-sm"
            onClick={handleOpenWhatsApp}
            leftIcon={<MessageCircle className="w-5 h-5" />}
          >
            {t('orderConfirmation.openWhatsApp')}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto justify-center"
            onClick={handleCopyMessage}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied!' : t('orderConfirmation.copyMessage')}
          </Button>
        </div>

        {/* Notice if popup was blocked */}
        {state.popupBlocked && (
          <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2">
            {t('orderConfirmation.popupBlockedNotice')}
          </p>
        )}
      </div>

      {/* Order Summary Card */}
      {order && (
        <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-soft-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <h2 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-brand-600" />
              <span>{shop?.name} — {t('orderConfirmation.summaryTitle')}</span>
            </h2>

            {/* Awaiting Confirmation Badge */}
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Awaiting Seller Confirmation</span>
            </span>
          </div>

          {/* Items breakdown */}
          <div className="divide-y divide-surface-border">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-charcoal-900">{item.product_name_snapshot}</h4>
                  {item.selected_variant_snapshot && (
                    <span className="text-coral-600 font-medium block">
                      {item.selected_variant_snapshot}
                    </span>
                  )}
                  <span className="text-charcoal-400">
                    {item.quantity} × {formatTZS(item.unit_price_tzs)}
                  </span>
                </div>
                <span className="font-bold text-charcoal-900">
                  {formatTZS(item.line_subtotal_tzs)}
                </span>
              </div>
            ))}
          </div>

          {/* Subtotal & Delivery Notes */}
          <div className="pt-4 border-t border-surface-border space-y-2 text-xs">
            <div className="flex justify-between items-center text-charcoal-600">
              <span>Items Subtotal:</span>
              <span className="font-bold text-charcoal-900">
                {formatTZS(order.items_subtotal_tzs)}
              </span>
            </div>

            <div className="flex justify-between items-center text-charcoal-600">
              <span>Delivery Charges:</span>
              <span className="italic text-amber-700 font-semibold">
                {order.fulfillment_method === 'collection'
                  ? 'Self Pickup (Free)'
                  : 'Pending seller confirmation on WhatsApp'}
              </span>
            </div>

            <div className="pt-2 border-t border-surface-border flex justify-between items-center text-sm">
              <span className="font-bold text-charcoal-900">Items Total:</span>
              <span className="text-lg font-extrabold text-brand-700">
                {formatTZS(order.items_subtotal_tzs)}
              </span>
            </div>
          </div>

          {/* Customer delivery snapshot */}
          <div className="bg-surface-warm p-4 rounded-2xl border border-surface-border text-xs space-y-1.5 text-charcoal-600">
            <h4 className="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">
              Customer & Delivery Record
            </h4>
            <p><strong>Name:</strong> {order.customer_name}</p>
            <p><strong>Phone:</strong> {order.customer_phone}</p>
            <p><strong>Fulfillment:</strong> {order.fulfillment_method === 'delivery' ? 'Delivery to Address' : 'Self Collection'}</p>
            {order.fulfillment_method === 'delivery' && (
              <>
                <p><strong>Destination:</strong> {order.delivery_area}, {order.delivery_district}, {order.delivery_region}</p>
                {order.delivery_instructions && (
                  <p><strong>Notes:</strong> {order.delivery_instructions}</p>
                )}
              </>
            )}
          </div>

          {/* Notice on status */}
          <p className="text-[11px] text-charcoal-400 text-center">
            {t('orderConfirmation.awaitingConfirmationNotice')}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link to="/">
          <Button variant="outline" size="md">
            {t('orderConfirmation.backHome')}
          </Button>
        </Link>
        {orderReference && (
          <Link to={`/track-order/${orderReference}`}>
            <Button variant="secondary" size="md">
              Track Order Status
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
