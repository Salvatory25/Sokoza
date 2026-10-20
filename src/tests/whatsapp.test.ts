import { describe, it, expect } from 'vitest';
import {
  normalizeTanzanianPhone,
  isValidTanzanianPhone,
  formatPhoneForDisplay,
  generateWhatsAppMessage,
  buildWhatsAppUrl,
  generateOrderReference,
} from '../lib/whatsapp';

describe('WhatsApp and Phone Number Integration', () => {
  it('normalizes local Tanzanian 10-digit formats to international 255 format', () => {
    expect(normalizeTanzanianPhone('0712345678')).toBe('255712345678');
    expect(normalizeTanzanianPhone('0652123456')).toBe('255652123456');
  });

  it('normalizes numbers with spaces, plus signs, or hyphens', () => {
    expect(normalizeTanzanianPhone('+255 712 345 678')).toBe('255712345678');
    expect(normalizeTanzanianPhone('+255-712-345-678')).toBe('255712345678');
    expect(normalizeTanzanianPhone('712345678')).toBe('255712345678');
  });

  it('validates authentic Tanzanian mobile operator prefixes (6 and 7)', () => {
    expect(isValidTanzanianPhone('0712345678')).toBe(true);
    expect(isValidTanzanianPhone('0652123456')).toBe(true);
    expect(isValidTanzanianPhone('255784112233')).toBe(true);

    // Invalid numbers
    expect(isValidTanzanianPhone('123456')).toBe(false);
    expect(isValidTanzanianPhone('0222123456')).toBe(false); // Landline prefix 022
    expect(isValidTanzanianPhone('0912345678')).toBe(false); // Invalid operator
  });

  it('formats normalized numbers cleanly for human display', () => {
    expect(formatPhoneForDisplay('255712345678')).toBe('+255 712 345 678');
  });

  it('generates unique readable order references matching SKZ-YYYYMMDD-XXXX pattern', () => {
    const ref1 = generateOrderReference();
    const ref2 = generateOrderReference();

    expect(ref1).toMatch(/^SKZ-\d{8}-\d{4}$/);
    expect(ref2).toMatch(/^SKZ-\d{8}-\d{4}$/);
    expect(ref1).not.toBe(ref2);
  });

  it('generates structured English WhatsApp message with all order information', () => {
    const msg = generateWhatsAppMessage({
      shopName: 'Kariakoo Tech Point',
      whatsappNumber: '255712345678',
      orderReference: 'SKZ-20261019-1234',
      items: [
        {
          name: 'Anker PowerCore 20,000mAh',
          quantity: 2,
          subtotalTzs: 170000,
          variantName: 'Matte Black',
        },
      ],
      itemsSubtotalTzs: 170000,
      deliveryFeeTzs: null,
      fulfillmentMethod: 'delivery',
      customerName: 'Juma Ally',
      customerPhone: '255754111222',
      region: 'Dar es Salaam',
      district: 'Kinondoni',
      deliveryArea: 'Mwenge',
      deliveryInstructions: 'Near Travertina',
      language: 'en',
    });

    expect(msg).toContain('Hello! I would like to place an order from Kariakoo Tech Point.');
    expect(msg).toContain('Order reference: SKZ-20261019-1234');
    expect(msg).toContain('- Anker PowerCore 20,000mAh (Matte Black) × 2 — TZS 170,000');
    expect(msg).toContain('Items subtotal: TZS 170,000');
    expect(msg).toContain('Delivery fee: To be confirmed by seller');
    expect(msg).toContain('Customer: Juma Ally');
    expect(msg).toContain('Region: Dar es Salaam');
    expect(msg).toContain('District: Kinondoni');
    expect(msg).toContain('Delivery area: Mwenge');
    expect(msg).toContain('Delivery instructions: Near Travertina');
  });

  it('generates structured natural Kiswahili WhatsApp message', () => {
    const msg = generateWhatsAppMessage({
      shopName: 'Swahili Vitenge',
      whatsappNumber: '255754123456',
      orderReference: 'SKZ-20261019-5678',
      items: [
        {
          name: 'Super-Wax Kitenge',
          quantity: 1,
          subtotalTzs: 55000,
          variantName: 'Teal Gold (6 Yards)',
        },
      ],
      itemsSubtotalTzs: 55000,
      deliveryFeeTzs: null,
      fulfillmentMethod: 'delivery',
      customerName: 'Fatma Salum',
      customerPhone: '255712999000',
      region: 'Arusha',
      district: 'Arusha City',
      deliveryArea: 'Sakina',
      language: 'sw',
    });

    expect(msg).toContain('Habari! Ningependa kuweka oda kutoka Swahili Vitenge.');
    expect(msg).toContain('Nambari ya Oda: SKZ-20261019-5678');
    expect(msg).toContain('- Super-Wax Kitenge (Teal Gold (6 Yards)) × 1 — TZS 55,000');
    expect(msg).toContain('Jumla ndogo ya bidhaa: TZS 55,000');
    expect(msg).toContain('Gharama ya usafirishaji: Itathibitishwa na muuzaji');
    expect(msg).toContain('Mteja: Fatma Salum');
    expect(msg).toContain('Mkoa: Arusha');
    expect(msg).toContain('Wilaya: Arusha City');
    expect(msg).toContain('Eneo la kufikishiwa: Sakina');
  });

  it('constructs valid official wa.me click-to-chat URL with properly encoded message', () => {
    const url = buildWhatsAppUrl({
      shopName: 'Test Shop',
      whatsappNumber: '0712345678',
      orderReference: 'SKZ-TEST-001',
      items: [{ name: 'Test Product', quantity: 1, subtotalTzs: 10000 }],
      itemsSubtotalTzs: 10000,
      deliveryFeeTzs: null,
      fulfillmentMethod: 'collection',
      customerName: 'Test Buyer',
      customerPhone: '255712345678',
      region: 'Dar es Salaam',
      district: 'Ilala',
      language: 'en',
    });

    expect(url.startsWith('https://wa.me/255712345678?text=')).toBe(true);
    expect(url).toContain(encodeURIComponent('SKZ-TEST-001'));
  });
});
