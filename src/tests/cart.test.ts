import { describe, it, expect } from 'vitest';
import { CartItem, SellerCartGroup } from '../types/cart';
import { SEED_PRODUCTS, SEED_SHOPS } from '../lib/seedData';

describe('Multi-Seller Shopping Cart Logic', () => {
  const shopA = SEED_SHOPS[0]; // Kariakoo Tech Point
  const shopB = SEED_SHOPS[1]; // Swahili Vitenge

  const productA1 = SEED_PRODUCTS[0]; // Power bank (85,000) from shopA
  const productA2 = SEED_PRODUCTS[1]; // Earbuds (65,000) from shopA
  const productB1 = SEED_PRODUCTS[2]; // Kitenge (55,000) from shopB

  it('groups cart items strictly by seller shop without crossover', () => {
    const items: CartItem[] = [
      {
        id: productA1.id,
        productId: productA1.id,
        product: productA1,
        shop: shopA,
        quantity: 2,
        unitPriceTzs: productA1.price_tzs,
        addedAt: Date.now(),
      },
      {
        id: productA2.id,
        productId: productA2.id,
        product: productA2,
        shop: shopA,
        quantity: 1,
        unitPriceTzs: productA2.price_tzs,
        addedAt: Date.now(),
      },
      {
        id: productB1.id,
        productId: productB1.id,
        product: productB1,
        shop: shopB,
        quantity: 3,
        unitPriceTzs: productB1.price_tzs,
        addedAt: Date.now(),
      },
    ];

    // Grouping algorithm
    const groupMap = new Map<string, SellerCartGroup>();
    items.forEach((item) => {
      const sId = item.shop.id;
      if (!groupMap.has(sId)) {
        groupMap.set(sId, {
          shopId: sId,
          shop: item.shop,
          items: [],
          subtotalTzs: 0,
          itemCount: 0,
        });
      }
      const group = groupMap.get(sId)!;
      group.items.push(item);
      group.subtotalTzs += item.unitPriceTzs * item.quantity;
      group.itemCount += item.quantity;
    });

    const groups = Array.from(groupMap.values());

    // Expect 2 distinct groups
    expect(groups).toHaveLength(2);

    const groupA = groups.find((g) => g.shopId === shopA.id);
    expect(groupA).toBeDefined();
    expect(groupA?.items).toHaveLength(2);
    // (85000 * 2) + (65000 * 1) = 170000 + 65000 = 235000
    expect(groupA?.subtotalTzs).toBe(235000);
    expect(groupA?.itemCount).toBe(3);

    const groupB = groups.find((g) => g.shopId === shopB.id);
    expect(groupB).toBeDefined();
    expect(groupB?.items).toHaveLength(1);
    // 55000 * 3 = 165000
    expect(groupB?.subtotalTzs).toBe(165000);
    expect(groupB?.itemCount).toBe(3);
  });
});
