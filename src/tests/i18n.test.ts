import { describe, it, expect } from 'vitest';
import { en } from '../locales/en';
import { sw } from '../locales/sw';

describe('Localization & Translation System (EN & SW)', () => {
  it('has matching top-level sections in both English and Kiswahili', () => {
    const enKeys = Object.keys(en).sort();
    const swKeys = Object.keys(sw).sort();
    expect(enKeys).toEqual(swKeys);
  });

  it('has matching navigation keys', () => {
    const enNav = Object.keys(en.nav).sort();
    const swNav = Object.keys(sw.nav).sort();
    expect(enNav).toEqual(swNav);
  });

  it('has matching checkout keys', () => {
    const enCheckout = Object.keys(en.checkout).sort();
    const swCheckout = Object.keys(sw.checkout).sort();
    expect(enCheckout).toEqual(swCheckout);
  });

  it('correctly substitutes dynamic template parameters', () => {
    const template = en.orderConfirmation.subtitle;
    // 'Your order reference is {reference}. Now continue to WhatsApp to finalize with {shopName}.'
    const rendered = template
      .replace('{reference}', 'SKZ-20261019-9999')
      .replace('{shopName}', 'Kariakoo Tech');

    expect(rendered).toContain('SKZ-20261019-9999');
    expect(rendered).toContain('Kariakoo Tech');
  });
});
