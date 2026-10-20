/**
 * Tanzanian Shilling (TZS) formatting and calculation utilities
 */

export function formatTZS(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'TZS 0';
  }

  // Format with integer thousands separator: "TZS 45,000"
  const formatted = Math.round(amount).toLocaleString('en-US');
  return `TZS ${formatted}`;
}

export function formatTZSNumber(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  return Math.round(amount).toLocaleString('en-US');
}

export function calculateDiscountPercent(
  currentPrice: number,
  compareAtPrice: number | null | undefined
): number | null {
  if (!compareAtPrice || compareAtPrice <= currentPrice) {
    return null;
  }
  const discount = ((compareAtPrice - currentPrice) / compareAtPrice) * 100;
  return Math.round(discount);
}

export function parseTZSInput(input: string): number {
  const cleaned = input.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}
