import { app, isFirebaseConfigured } from './firebase';
import { Order } from '../types/database';
import { formatTZS } from './currency';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

/**
 * Checks if browser notifications are supported
 */
export function areNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Gets current notification permission
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!areNotificationsSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/**
 * Synthesizes an alert chime using Web Audio API (zero audio file dependencies)
 */
export function playOrderChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // First tone (E5 ~ 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Second tone (G#5 ~ 830.61Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(830.61, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.55);
  } catch (err) {
    console.warn('Could not play audio chime:', err);
  }
}

/**
 * Requests browser push notification permission from the seller
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!areNotificationsSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();

    // If permission granted and Firebase is configured, register service worker
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch (swErr) {
        console.warn('Service worker registration note:', swErr);
      }
    }

    return permission as NotificationPermissionState;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Shows an immediate on-screen browser notification
 */
export function showOrderNotification(order: Order): void {
  // Always play the order alert chime
  playOrderChime();

  if (!areNotificationsSupported() || Notification.permission !== 'granted') {
    return;
  }

  try {
    const itemsCount = order.items?.length || 1;
    const amountStr = order.items_subtotal_tzs ? formatTZS(order.items_subtotal_tzs) : '';
    const title = `🔔 New Order: ${order.order_reference}`;
    const body = `${order.customer_name} ordered ${itemsCount} item(s) (${amountStr}) for ${order.delivery_district}, ${order.delivery_region}.`;

    const notification = new Notification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: order.order_reference,
    });

    notification.onclick = () => {
      window.focus();
      if (!window.location.pathname.includes('/seller/orders')) {
        window.location.href = '/seller/orders';
      }
      notification.close();
    };
  } catch (err) {
    console.warn('Failed to display native notification:', err);
  }
}

const ORDER_EVENT_KEY = 'sokoza_last_order_event';

/**
 * Broadcasts a newly placed order to any active seller tabs/windows
 */
export function broadcastOrderNotification(order: Order): void {
  // 1. Broadcast via BroadcastChannel
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel('sokoza_orders_channel');
      channel.postMessage({ type: 'NEW_ORDER', order });
      channel.close();
    } catch (err) {
      console.warn('BroadcastChannel error:', err);
    }
  }

  // 2. Storage event fallback for cross-tab communication
  try {
    localStorage.setItem(
      ORDER_EVENT_KEY,
      JSON.stringify({ order, timestamp: Date.now() })
    );
  } catch (e) {
    // Ignore storage quota errors
  }
}

/**
 * Subscribes a seller to real-time order alerts while in the dashboard
 */
export function subscribeToSellerOrderAlerts(
  shopId: string,
  onOrderReceived: (order: Order) => void
): () => void {
  let channel: BroadcastChannel | null = null;

  // Handler for incoming order events
  const handleIncomingOrder = (order: Order) => {
    if (order.shop_id === shopId) {
      showOrderNotification(order);
      onOrderReceived(order);
    }
  };

  // 1. Listen via BroadcastChannel
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel('sokoza_orders_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'NEW_ORDER' && event.data?.order) {
          handleIncomingOrder(event.data.order);
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel not supported or error:', err);
    }
  }

  // 2. Listen via storage event
  const handleStorage = (e: StorageEvent) => {
    if (e.key === ORDER_EVENT_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        if (data?.order) {
          handleIncomingOrder(data.order);
        }
      } catch (err) {
        // parse error
      }
    }
  };

  window.addEventListener('storage', handleStorage);

  // Return unsubscribe cleanup function
  return () => {
    if (channel) {
      channel.close();
    }
    window.removeEventListener('storage', handleStorage);
  };
}
