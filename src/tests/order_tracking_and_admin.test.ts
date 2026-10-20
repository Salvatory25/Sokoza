import { describe, it, expect, beforeEach } from 'vitest';
import {
  createOrder,
  fetchOrderByReference,
  updateOrderStatus,
  fetchAuditLogs,
  recordAuditLog,
  saveCategory,
  deleteCategory,
  fetchCategories,
} from '../lib/api';

describe('Order Tracking, Categories & Admin Audit Operations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates an order, persists it, and retrieves it by order reference', async () => {
    const orderPayload = {
      shopId: 'shop-kariakoo-tech',
      customerName: 'Amani Mushi',
      customerPhone: '0754123456',
      deliveryRegion: 'Arusha',
      deliveryDistrict: 'Arusha City',
      deliveryArea: 'Njiro',
      deliveryInstructions: 'Deliver before 5 PM',
      fulfillmentMethod: 'delivery' as const,
      itemsSubtotalTzs: 150000,
      deliveryFeeTzs: 10000,
      customerLanguage: 'en' as const,
      items: [
        {
          productId: 'prod-anker-20k',
          productName: 'Anker PowerCore 20000mAh',
          unitPriceTzs: 150000,
          quantity: 1,
          variantName: 'Black',
        },
      ],
    };

    const created = await createOrder(orderPayload);
    expect(created).toBeDefined();
    expect(created.order_reference).toMatch(/^SKZ-/);
    expect(created.status).toBe('pending');

    // Retrieve via fetchOrderByReference (case-insensitive check)
    const fetched = await fetchOrderByReference(created.order_reference.toLowerCase());
    expect(fetched).toBeDefined();
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.customer_name).toBe('Amani Mushi');
    expect(fetched?.items).toHaveLength(1);
    expect(fetched?.items?.[0].product_name_snapshot).toBe('Anker PowerCore 20000mAh');
  });

  it('updates order status and verifies audit trail logging', async () => {
    const order = await createOrder({
      shopId: 'shop-kariakoo-tech',
      customerName: 'Neema Joseph',
      customerPhone: '0712345678',
      deliveryRegion: 'Dar es Salaam',
      deliveryDistrict: 'Kinondoni',
      deliveryArea: 'Mwenge',
      fulfillmentMethod: 'collection',
      itemsSubtotalTzs: 85000,
      deliveryFeeTzs: null,
      customerLanguage: 'sw',
      items: [
        {
          productId: 'prod-1',
          productName: 'Sample Product',
          unitPriceTzs: 85000,
          quantity: 1,
        },
      ],
    });

    const updateSuccess = await updateOrderStatus(order.id, 'out_for_delivery');
    expect(updateSuccess).toBe(true);

    const updatedOrder = await fetchOrderByReference(order.order_reference);
    expect(updatedOrder?.status).toBe('out_for_delivery');

    // Verify audit logs
    const logs = await fetchAuditLogs();
    const orderLog = logs.find((l) => l.action === 'order_status_updated' && l.entity_id === order.id);
    expect(orderLog).toBeDefined();
    expect(orderLog?.safe_metadata).toEqual({ new_status: 'out_for_delivery' });
  });

  it('manages categories (creation, retrieval, and deletion)', async () => {
    const initialCategories = await fetchCategories();
    const initialCount = initialCategories.length;

    const newCategory = await saveCategory({
      name_en: 'Solar & Renewable Energy',
      name_sw: 'Nishati ya Jua na Mbadala',
      slug: 'solar-renewable-energy',
      image_path: 'https://images.unsplash.com/solar.jpg',
      sort_order: 10,
      is_active: true,
    });

    expect(newCategory.id).toBeDefined();
    expect(newCategory.name_en).toBe('Solar & Renewable Energy');

    const updatedCategories = await fetchCategories();
    expect(updatedCategories.length).toBe(initialCount + 1);

    const foundCat = updatedCategories.find((c) => c.slug === 'solar-renewable-energy');
    expect(foundCat).toBeDefined();
    expect(foundCat?.name_sw).toBe('Nishati ya Jua na Mbadala');

    // Delete category
    const deleteSuccess = await deleteCategory(newCategory.id);
    expect(deleteSuccess).toBe(true);

    const finalCategories = await fetchCategories();
    expect(finalCategories.some((c) => c.id === newCategory.id)).toBe(false);
  });

  it('records custom administrative audit actions', async () => {
    await recordAuditLog('security_policy_updated', 'system', 'sys-001', {
      mfa_required: true,
    });

    const logs = await fetchAuditLogs();
    const secLog = logs.find((l) => l.action === 'security_policy_updated');
    expect(secLog).toBeDefined();
    expect(secLog?.entity_id).toBe('sys-001');
    expect(secLog?.safe_metadata).toEqual({ mfa_required: true });
  });
});
