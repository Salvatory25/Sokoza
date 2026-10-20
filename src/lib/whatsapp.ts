import { formatTZS } from './currency';

export interface WhatsAppOrderPayload {
  shopName: string;
  whatsappNumber: string;
  orderReference: string;
  items: Array<{
    name: string;
    quantity: number;
    subtotalTzs: number;
    variantName?: string | null;
  }>;
  itemsSubtotalTzs: number;
  deliveryFeeTzs: number | null;
  fulfillmentMethod: 'delivery' | 'collection';
  customerName: string;
  customerPhone: string;
  region: string;
  district: string;
  deliveryArea?: string;
  deliveryInstructions?: string | null;
  language?: 'en' | 'sw';
}

/**
 * Normalizes Tanzanian phone numbers to international digits-only format: "2557XXXXXXXX"
 */
export function normalizeTanzanianPhone(phone: string): string {
  // Remove spaces, hyphens, plus signs, brackets
  const cleaned = phone.replace(/[^\d]/g, '');

  // If starts with 0 (e.g., 0712345678 or 0652123456)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `255${cleaned.slice(1)}`;
  }

  // If 9 digits (e.g., 712345678 or 652123456)
  if (cleaned.length === 9) {
    return `255${cleaned}`;
  }

  // If already starts with 255 (e.g. 255712345678)
  if (cleaned.startsWith('255') && cleaned.length === 12) {
    return cleaned;
  }

  return cleaned;
}

/**
 * Validates whether a phone number matches standard Tanzanian mobile operators (Vodacom, Tigo, Airtel, Halotel, TTCL)
 */
export function isValidTanzanianPhone(phone: string): boolean {
  const normalized = normalizeTanzanianPhone(phone);
  // Valid TZ mobile starts with 255 followed by 6 or 7, followed by 8 digits (total 12 digits)
  const tzPhoneRegex = /^255[67]\d{8}$/;
  return tzPhoneRegex.test(normalized);
}

/**
 * Formats a normalized phone number for display, e.g. "+255 712 345 678"
 */
export function formatPhoneForDisplay(phone: string): string {
  const norm = normalizeTanzanianPhone(phone);
  if (norm.length === 12 && norm.startsWith('255')) {
    return `+${norm.slice(0, 3)} ${norm.slice(3, 6)} ${norm.slice(6, 9)} ${norm.slice(9)}`;
  }
  return phone;
}

/**
 * Generates the WhatsApp text message in English or Kiswahili
 */
export function generateWhatsAppMessage(payload: WhatsAppOrderPayload): string {
  const isSw = payload.language === 'sw';

  const itemsList = payload.items
    .map((item) => {
      const variantStr = item.variantName ? ` (${item.variantName})` : '';
      return `- ${item.name}${variantStr} × ${item.quantity} — ${formatTZS(item.subtotalTzs)}`;
    })
    .join('\n');

  const deliveryFeeStr =
    payload.fulfillmentMethod === 'collection'
      ? isSw
        ? 'Kuchukua dukani (Bila malipo)'
        : 'Store Collection (Free)'
      : payload.deliveryFeeTzs !== null
      ? formatTZS(payload.deliveryFeeTzs)
      : isSw
      ? 'Itathibitishwa na muuzaji'
      : 'To be confirmed by seller';

  const estimatedTotalStr =
    payload.deliveryFeeTzs !== null
      ? formatTZS(payload.itemsSubtotalTzs + payload.deliveryFeeTzs)
      : isSw
      ? 'Itathibitishwa na muuzaji'
      : 'To be confirmed by seller';

  if (isSw) {
    let msg = `Habari! Ningependa kuweka oda kutoka ${payload.shopName}.\n\n`;
    msg += `Nambari ya Oda: ${payload.orderReference}\n\n`;
    msg += `Bidhaa:\n${itemsList}\n\n`;
    msg += `Jumla ndogo ya bidhaa: ${formatTZS(payload.itemsSubtotalTzs)}\n`;
    msg += `Gharama ya usafirishaji: ${deliveryFeeStr}\n`;
    msg += `Jumla inayokadiriwa: ${estimatedTotalStr}\n\n`;
    msg += `Mteja: ${payload.customerName}\n`;
    msg += `Simu: ${payload.customerPhone}\n`;
    msg += `Mkoa: ${payload.region}\n`;
    msg += `Wilaya: ${payload.district}\n`;
    if (payload.deliveryArea) {
      msg += `Eneo la kufikishiwa: ${payload.deliveryArea}\n`;
    }
    if (payload.deliveryInstructions) {
      msg += `Maelekezo ya uwasilishaji: ${payload.deliveryInstructions}\n`;
    }
    msg += `\nTafadhali thibitisha upatikanaji wa bidhaa, gharama ya usafirishaji, na utaratibu wa malipo.`;
    return msg;
  }

  // English (default)
  let msg = `Hello! I would like to place an order from ${payload.shopName}.\n\n`;
  msg += `Order reference: ${payload.orderReference}\n\n`;
  msg += `Items:\n${itemsList}\n\n`;
  msg += `Items subtotal: ${formatTZS(payload.itemsSubtotalTzs)}\n`;
  msg += `Delivery fee: ${deliveryFeeStr}\n`;
  msg += `Estimated total: ${estimatedTotalStr}\n\n`;
  msg += `Customer: ${payload.customerName}\n`;
  msg += `Phone: ${payload.customerPhone}\n`;
  msg += `Region: ${payload.region}\n`;
  msg += `District: ${payload.district}\n`;
  if (payload.deliveryArea) {
    msg += `Delivery area: ${payload.deliveryArea}\n`;
  }
  if (payload.deliveryInstructions) {
    msg += `Delivery instructions: ${payload.deliveryInstructions}\n`;
  }
  msg += `\nPlease confirm product availability, delivery charges, and payment arrangements.`;
  return msg;
}

/**
 * Creates the official wa.me link with URL-encoded text
 */
export function buildWhatsAppUrl(payload: WhatsAppOrderPayload): string {
  const normalizedNumber = normalizeTanzanianPhone(payload.whatsappNumber);
  const message = generateWhatsAppMessage(payload);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${normalizedNumber}?text=${encodedMessage}`;
}

/**
 * Generates unique readable order references, e.g. "SKZ-20261019-9482"
 */
export function generateOrderReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SKZ-${year}${month}${day}-${randomSuffix}`;
}
