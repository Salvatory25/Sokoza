import { describe, it, expect } from 'vitest';
import {
  formatTZS,
  calculateDiscountPercent,
  parseTZSInput,
  formatTZSNumber,
} from '../lib/currency';

describe('Currency and TZS formatting utilities', () => {
  it('formats positive integers to TZS with comma separators', () => {
    expect(formatTZS(45000)).toBe('TZS 45,000');
    expect(formatTZS(180000)).toBe('TZS 180,000');
    expect(formatTZS(1500000)).toBe('TZS 1,500,000');
  });

  it('handles 0, null, and undefined values safely', () => {
    expect(formatTZS(0)).toBe('TZS 0');
    expect(formatTZS(null)).toBe('TZS 0');
    expect(formatTZS(undefined)).toBe('TZS 0');
  });

  it('formats raw numeric strings correctly without currency label', () => {
    expect(formatTZSNumber(65000)).toBe('65,000');
    expect(formatTZSNumber(0)).toBe('0');
  });

  it('calculates discount percentage accurately', () => {
    // Current: 85,000, Original: 100,000 -> 15%
    expect(calculateDiscountPercent(85000, 100000)).toBe(15);

    // Current: 55,000, Original: 70,000 -> ~21%
    expect(calculateDiscountPercent(55000, 70000)).toBe(21);

    // If compareAtPrice is equal or lower, returns null
    expect(calculateDiscountPercent(50000, 50000)).toBeNull();
    expect(calculateDiscountPercent(60000, 50000)).toBeNull();
    expect(calculateDiscountPercent(50000, null)).toBeNull();
  });

  it('parses formatted input string into clean integer', () => {
    expect(parseTZSInput('45,000')).toBe(45000);
    expect(parseTZSInput('TZS 120,500')).toBe(120500);
    expect(parseTZSInput('abc')).toBe(0);
  });
});
