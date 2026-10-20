import React, { useState, useEffect } from 'react';
import { Bell, BellRing, BellOff, Volume2, Check } from 'lucide-react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  showOrderNotification,
  subscribeToSellerOrderAlerts,
  NotificationPermissionState,
} from '../../lib/notifications';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../types/database';

interface OrderNotificationPromptProps {
  onNewOrderReceived?: (order: Order) => void;
}

export const OrderNotificationPrompt: React.FC<OrderNotificationPromptProps> = ({
  onNewOrderReceived,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const shop = user?.shop;

  const [permission, setPermission] = useState<NotificationPermissionState>(
    getNotificationPermission()
  );
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  // Listen for real-time order alerts when the seller is logged in
  useEffect(() => {
    if (!shop?.id) return;

    const unsubscribe = subscribeToSellerOrderAlerts(shop.id, (order) => {
      showToast(`🔔 New Order! ${order.order_reference} from ${order.customer_name}`, 'success');
      if (onNewOrderReceived) {
        onNewOrderReceived(order);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [shop?.id, onNewOrderReceived, showToast]);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result === 'granted') {
        showToast('Push notifications enabled successfully!', 'success');
        // Play quick test chime
        handleTestNotification();
      } else if (result === 'denied') {
        showToast('Notification permission was blocked in your browser', 'error');
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleTestNotification = () => {
    if (!shop) return;
    const testOrder: Order = {
      id: 'test-preview',
      order_reference: 'SKZ-TEST-ALERT',
      shop_id: shop.id,
      customer_user_id: null,
      customer_name: 'Test Customer',
      customer_phone: '255712000000',
      delivery_region: shop.region || 'Dar es Salaam',
      delivery_district: shop.district || 'Kinondoni',
      delivery_area: 'Test Delivery Street',
      delivery_instructions: null,
      fulfillment_method: 'delivery',
      items_subtotal_tzs: 45000,
      delivery_fee_tzs: 3000,
      total_tzs: 48000,
      currency: 'TZS',
      status: 'pending',
      customer_language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [
        {
          id: 'item-test',
          order_id: 'test-preview',
          product_id: 'test-prod',
          product_name_snapshot: 'Sample Product',
          unit_price_tzs: 45000,
          quantity: 1,
          line_subtotal_tzs: 45000,
          selected_variant_snapshot: null,
          image_url_snapshot: null,
        },
      ],
    };

    showOrderNotification(testOrder);
    showToast('Sound & notification test sent!', 'success');
  };

  if (!shop) return null;

  return (
    <div className="bg-gradient-to-r from-brand-900 to-charcoal-900 text-white rounded-3xl p-5 border border-brand-800/60 shadow-soft-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              permission === 'granted'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
            }`}
          >
            {permission === 'granted' ? (
              <BellRing className="w-5 h-5 animate-bounce" />
            ) : permission === 'denied' ? (
              <BellOff className="w-5 h-5 text-red-400" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">
                {permission === 'granted'
                  ? 'Real-Time Order Push Alerts Active'
                  : 'Get Notified Instantly When Orders Arrive'}
              </h4>
              {permission === 'granted' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Check className="w-3 h-3" /> Enabled
                </span>
              )}
            </div>
            <p className="text-xs text-charcoal-300 mt-0.5">
              {permission === 'granted'
                ? 'Your device will chime and display desktop popups when shoppers place orders.'
                : 'Enable browser notifications so you never miss a buyer while working on other tasks.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {permission === 'granted' ? (
            <button
              type="button"
              onClick={handleTestNotification}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
              title="Test notification chime"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Test Chime</span>
            </button>
          ) : permission === 'denied' ? (
            <span className="text-[11px] text-amber-300 bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-800/40">
              Blocked in browser settings
            </span>
          ) : (
            <button
              type="button"
              disabled={isRequesting}
              onClick={handleEnableNotifications}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-soft-sm transition active:scale-95 disabled:opacity-50"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Enable Push Alerts</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
