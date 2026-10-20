import { supabase, isSupabaseConfigured } from './supabase';
import {
  AuditLog,
  Category,
  Order,
  OrderItemSnapshot,
  OrderStatus,
  Product,
  Shop,
  ShopApprovalStatus,
} from '../types/database';
import { SEED_CATEGORIES, SEED_SHOPS, getEnrichedSeedProducts } from './seedData';
import { generateOrderReference } from './whatsapp';

// Local storage keys for persisting development demo changes when Supabase is not configured
const STORAGE_CUSTOM_SHOPS = 'sokoza_dev_custom_shops';
const STORAGE_CUSTOM_PRODUCTS = 'sokoza_dev_custom_products';
const STORAGE_CUSTOM_ORDERS = 'sokoza_dev_custom_orders';
const STORAGE_CUSTOM_CATEGORIES = 'sokoza_dev_custom_categories';
const STORAGE_AUDIT_LOGS = 'sokoza_dev_audit_logs';

function getStoredCustomShops(): Shop[] {
  try {
    const s = localStorage.getItem(STORAGE_CUSTOM_SHOPS);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function getStoredCustomProducts(): Product[] {
  try {
    const s = localStorage.getItem(STORAGE_CUSTOM_PRODUCTS);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function getStoredOrders(): Order[] {
  try {
    const s = localStorage.getItem(STORAGE_CUSTOM_ORDERS);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function saveStoredOrders(orders: Order[]) {
  try {
    localStorage.setItem(STORAGE_CUSTOM_ORDERS, JSON.stringify(orders));
  } catch {
    // Ignore
  }
}

function getStoredCustomCategories(): Category[] {
  try {
    const s = localStorage.getItem(STORAGE_CUSTOM_CATEGORIES);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function saveStoredCategories(categories: Category[]) {
  try {
    localStorage.setItem(STORAGE_CUSTOM_CATEGORIES, JSON.stringify(categories));
  } catch {
    // Ignore
  }
}

function getStoredAuditLogs(): AuditLog[] {
  try {
    const s = localStorage.getItem(STORAGE_AUDIT_LOGS);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function saveStoredAuditLogs(logs: AuditLog[]) {
  try {
    localStorage.setItem(STORAGE_AUDIT_LOGS, JSON.stringify(logs));
  } catch {
    // Ignore
  }
}

// -------------------------------------------------------------
// CATEGORIES API
// -------------------------------------------------------------
export async function fetchCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories from Supabase:', error);
      return SEED_CATEGORIES;
    }
    return data || [];
  }

  const custom = getStoredCustomCategories();
  const seedRemaining = SEED_CATEGORIES.filter((sc) => !custom.some((c) => c.id === sc.id));
  return [...custom, ...seedRemaining].sort((a, b) => a.sort_order - b.sort_order);
}

export async function saveCategory(
  categoryData: Partial<Category> & { name_en: string; name_sw: string; slug: string }
): Promise<Category> {
  const catId = categoryData.id || `cat-${Date.now()}`;
  const newCat: Category = {
    id: catId,
    name_en: categoryData.name_en,
    name_sw: categoryData.name_sw,
    slug: categoryData.slug,
    image_path: categoryData.image_path || null,
    is_active: categoryData.is_active !== undefined ? categoryData.is_active : true,
    sort_order: categoryData.sort_order || 99,
    product_count: categoryData.product_count || 0,
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('categories').upsert(newCat).select().single();
    if (error) throw error;
    await recordAuditLog('category_saved', 'category', newCat.id, { name: newCat.name_en });
    return data;
  }

  const current = getStoredCustomCategories();
  const idx = current.findIndex((c) => c.id === catId);
  if (idx >= 0) {
    current[idx] = newCat;
  } else {
    current.push(newCat);
  }
  saveStoredCategories(current);
  await recordAuditLog('category_saved', 'category', newCat.id, { name: newCat.name_en });
  return newCat;
}

export async function deleteCategory(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    await recordAuditLog('category_deleted', 'category', id);
    return true;
  }
  const current = getStoredCustomCategories();
  const filtered = current.filter((c) => c.id !== id);
  saveStoredCategories(filtered);
  await recordAuditLog('category_deleted', 'category', id);
  return true;
}


// -------------------------------------------------------------
// SHOPS API
// -------------------------------------------------------------
export async function fetchShops(status?: ShopApprovalStatus | 'all' | ''): Promise<Shop[]> {
  if (isSupabaseConfigured()) {
    let query = supabase.from('shops').select('*').eq('is_active', true);
    if (status && status !== 'all') {
      query = query.eq('approval_status', status);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching shops from Supabase:', error);
      return SEED_SHOPS;
    }
    return data || [];
  }

  const custom = getStoredCustomShops();
  const all = [...custom, ...SEED_SHOPS];
  if (status && status !== 'all') {
    return all.filter((s) => s.approval_status === status && s.is_active);
  }
  return all;
}

export async function fetchShopBySlug(slug: string): Promise<Shop | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching shop by slug:', error);
      return null;
    }
    return data;
  }

  const shops = await fetchShops('approved');
  return shops.find((s) => s.slug === slug) || null;
}

export async function fetchShopByOwnerId(ownerId: string): Promise<Shop | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching shop by owner:', error);
      return null;
    }
    return data;
  }

  const all = [...getStoredCustomShops(), ...SEED_SHOPS];
  return all.find((s) => s.owner_id === ownerId) || null;
}

export async function saveShopProfile(
  shopData: Partial<Shop> & { name: string; slug: string; whatsapp_number: string; owner_id: string }
): Promise<Shop> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('shops')
      .upsert({
        ...shopData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Local storage fallback for dev mode
  const current = getStoredCustomShops();
  const index = current.findIndex((s) => s.owner_id === shopData.owner_id || s.slug === shopData.slug);

  const newOrUpdatedShop: Shop = {
    id: shopData.id || `shop-${Date.now()}`,
    owner_id: shopData.owner_id,
    name: shopData.name,
    slug: shopData.slug,
    description: shopData.description || null,
    logo_path: shopData.logo_path || null,
    cover_image_path: shopData.cover_image_path || null,
    whatsapp_number: shopData.whatsapp_number,
    region: shopData.region || 'Dar es Salaam',
    district: shopData.district || 'Ilala',
    delivery_information: shopData.delivery_information || null,
    approval_status: 'approved', // Auto-approve in dev mode
    is_active: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (index >= 0) {
    current[index] = { ...current[index], ...newOrUpdatedShop };
  } else {
    current.unshift(newOrUpdatedShop);
  }

  localStorage.setItem(STORAGE_CUSTOM_SHOPS, JSON.stringify(current));
  return newOrUpdatedShop;
}

// -------------------------------------------------------------
// PRODUCTS API
// -------------------------------------------------------------
export interface ProductFilterParams {
  categoryId?: string;
  shopId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'name';
  limit?: number;
}

export async function fetchProducts(params: ProductFilterParams = {}): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from('products')
      .select(`
        *,
        shop:shops(*),
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .eq('status', 'published');

    if (params.categoryId) {
      query = query.eq('category_id', params.categoryId);
    }
    if (params.shopId) {
      query = query.eq('shop_id', params.shopId);
    }
    if (params.minPrice !== undefined) {
      query = query.gte('price_tzs', params.minPrice);
    }
    if (params.maxPrice !== undefined) {
      query = query.lte('price_tzs', params.maxPrice);
    }
    if (params.inStockOnly) {
      query = query.gt('stock_quantity', 0);
    }
    if (params.search) {
      query = query.ilike('name', `%${params.search}%`);
    }

    if (params.sortBy === 'price_asc') {
      query = query.order('price_tzs', { ascending: true });
    } else if (params.sortBy === 'price_desc') {
      query = query.order('price_tzs', { ascending: false });
    } else if (params.sortBy === 'name') {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching products from Supabase:', error);
      return filterSeedProducts(params);
    }
    return data || [];
  }

  return filterSeedProducts(params);
}

function filterSeedProducts(params: ProductFilterParams): Product[] {
  const customProducts = getStoredCustomProducts();
  const enrichedSeed = getEnrichedSeedProducts();
  let list = [...customProducts, ...enrichedSeed];

  if (params.categoryId) {
    list = list.filter((p) => p.category_id === params.categoryId);
  }
  if (params.shopId) {
    list = list.filter((p) => p.shop_id === params.shopId);
  }
  if (params.minPrice !== undefined) {
    list = list.filter((p) => p.price_tzs >= params.minPrice!);
  }
  if (params.maxPrice !== undefined) {
    list = list.filter((p) => p.price_tzs <= params.maxPrice!);
  }
  if (params.inStockOnly) {
    list = list.filter((p) => p.stock_quantity > 0);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.shop?.name && p.shop.name.toLowerCase().includes(q))
    );
  }

  if (params.sortBy === 'price_asc') {
    list.sort((a, b) => a.price_tzs - b.price_tzs);
  } else if (params.sortBy === 'price_desc') {
    list.sort((a, b) => b.price_tzs - a.price_tzs);
  } else if (params.sortBy === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (params.limit) {
    return list.slice(0, params.limit);
  }
  return list;
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        shop:shops(*),
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching product by slug:', error);
      return null;
    }
    return data;
  }

  const all = [...getStoredCustomProducts(), ...getEnrichedSeedProducts()];
  return all.find((p) => p.slug === slug) || null;
}

export async function saveProduct(productData: Partial<Product> & { shop_id: string; name: string }): Promise<Product> {
  const slug =
    productData.slug ||
    productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
      '-' +
      Math.floor(100 + Math.random() * 900);

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('products')
      .upsert({
        ...productData,
        slug,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Local storage fallback
  const current = getStoredCustomProducts();
  const index = current.findIndex((p) => p.id === productData.id);

  const product: Product = {
    id: productData.id || `prod-${Date.now()}`,
    shop_id: productData.shop_id,
    category_id: productData.category_id || 'cat-electronics',
    name: productData.name,
    slug,
    description: productData.description || '',
    price_tzs: productData.price_tzs || 0,
    compare_at_price_tzs: productData.compare_at_price_tzs || null,
    stock_quantity: productData.stock_quantity || 0,
    sku: productData.sku || null,
    status: productData.status || 'published',
    is_featured: productData.is_featured || false,
    created_at: productData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: productData.images || [],
    variants: productData.variants || [],
  };

  if (index >= 0) {
    current[index] = product;
  } else {
    current.unshift(product);
  }

  localStorage.setItem(STORAGE_CUSTOM_PRODUCTS, JSON.stringify(current));
  return product;
}

export async function deleteProduct(productId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
    return true;
  }

  const current = getStoredCustomProducts();
  const filtered = current.filter((p) => p.id !== productId);
  localStorage.setItem(STORAGE_CUSTOM_PRODUCTS, JSON.stringify(filtered));
  return true;
}

// -------------------------------------------------------------
// ORDERS & SNAPSHOTS API
// -------------------------------------------------------------
export interface CreateOrderPayload {
  shopId: string;
  customerUserId?: string | null;
  customerName: string;
  customerPhone: string;
  deliveryRegion: string;
  deliveryDistrict: string;
  deliveryArea: string;
  deliveryInstructions?: string | null;
  fulfillmentMethod: 'delivery' | 'collection';
  itemsSubtotalTzs: number;
  deliveryFeeTzs: number | null;
  customerLanguage: 'en' | 'sw';
  items: Array<{
    productId: string;
    productName: string;
    unitPriceTzs: number;
    quantity: number;
    variantName?: string | null;
    imageUrl?: string | null;
  }>;
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const orderReference = generateOrderReference();

  if (isSupabaseConfigured()) {
    // 1. Insert order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_reference: orderReference,
        shop_id: payload.shopId,
        customer_user_id: payload.customerUserId || null,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        delivery_region: payload.deliveryRegion,
        delivery_district: payload.deliveryDistrict,
        delivery_area: payload.deliveryArea,
        delivery_instructions: payload.deliveryInstructions || null,
        fulfillment_method: payload.fulfillmentMethod,
        items_subtotal_tzs: payload.itemsSubtotalTzs,
        delivery_fee_tzs: payload.deliveryFeeTzs,
        total_tzs:
          payload.deliveryFeeTzs !== null ? payload.itemsSubtotalTzs + payload.deliveryFeeTzs : null,
        currency: 'TZS',
        status: 'pending',
        customer_language: payload.customerLanguage,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error inserting order in Supabase:', orderError);
      throw orderError;
    }

    // 2. Insert order items snapshot
    const itemRecords = payload.items.map((item) => ({
      order_id: orderData.id,
      product_id: item.productId,
      product_name_snapshot: item.productName,
      unit_price_tzs: item.unitPriceTzs,
      quantity: item.quantity,
      line_subtotal_tzs: item.unitPriceTzs * item.quantity,
      selected_variant_snapshot: item.variantName || null,
      image_url_snapshot: item.imageUrl || null,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(itemRecords);
    if (itemsError) {
      console.error('Error inserting order items snapshot:', itemsError);
    }

    return orderData;
  }

  // Local storage fallback for dev mode
  const orderId = `ord-${Date.now()}`;
  const snapshots: OrderItemSnapshot[] = payload.items.map((it, idx) => ({
    id: `item-${Date.now()}-${idx}`,
    order_id: orderId,
    product_id: it.productId,
    product_name_snapshot: it.productName,
    unit_price_tzs: it.unitPriceTzs,
    quantity: it.quantity,
    line_subtotal_tzs: it.unitPriceTzs * it.quantity,
    selected_variant_snapshot: it.variantName || null,
    image_url_snapshot: it.imageUrl || null,
  }));

  const allShops = [...getStoredCustomShops(), ...SEED_SHOPS];
  const targetShop = allShops.find((s) => s.id === payload.shopId);

  const newOrder: Order = {
    id: orderId,
    order_reference: orderReference,
    shop_id: payload.shopId,
    customer_user_id: payload.customerUserId || null,
    customer_name: payload.customerName,
    customer_phone: payload.customerPhone,
    delivery_region: payload.deliveryRegion,
    delivery_district: payload.deliveryDistrict,
    delivery_area: payload.deliveryArea,
    delivery_instructions: payload.deliveryInstructions || null,
    fulfillment_method: payload.fulfillmentMethod,
    items_subtotal_tzs: payload.itemsSubtotalTzs,
    delivery_fee_tzs: payload.deliveryFeeTzs,
    total_tzs:
      payload.deliveryFeeTzs !== null ? payload.itemsSubtotalTzs + payload.deliveryFeeTzs : null,
    currency: 'TZS',
    status: 'pending',
    customer_language: payload.customerLanguage,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: snapshots,
    shop: targetShop,
  };

  const stored = getStoredOrders();
  stored.unshift(newOrder);
  saveStoredOrders(stored);

  return newOrder;
}

export async function fetchOrdersByShop(shopId: string): Promise<Order[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching seller orders:', error);
      return [];
    }
    return data || [];
  }

  const stored = getStoredOrders();
  return stored.filter((o) => o.shop_id === shopId);
}

export async function fetchAllOrders(): Promise<Order[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        shop:shops(*),
        items:order_items(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin orders:', error);
      return [];
    }
    return data || [];
  }

  return getStoredOrders();
}

export async function fetchOrderByReference(orderReference: string): Promise<Order | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        shop:shops(*),
        items:order_items(*)
      `)
      .eq('order_reference', orderReference.trim())
      .maybeSingle();

    if (error) {
      console.error('Error fetching order by reference:', error);
      return null;
    }
    return data;
  }

  const stored = getStoredOrders();
  const normalizedSearch = orderReference.trim().toUpperCase();
  const found = stored.find((o) => o.order_reference.toUpperCase() === normalizedSearch);
  return found || null;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) throw error;
    await recordAuditLog('order_status_updated', 'order', orderId, { new_status: status });
    return true;
  }

  const stored = getStoredOrders();
  const idx = stored.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    stored[idx].status = status;
    stored[idx].updated_at = new Date().toISOString();
    saveStoredOrders(stored);
    await recordAuditLog('order_status_updated', 'order', orderId, { new_status: status });
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// ADMIN ACTIONS API
// -------------------------------------------------------------
export async function updateShopApproval(
  shopId: string,
  approval_status: ShopApprovalStatus
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('shops')
      .update({ approval_status, updated_at: new Date().toISOString() })
      .eq('id', shopId);

    if (error) throw error;
    await recordAuditLog('shop_moderated', 'shop', shopId, { approval_status });
    return true;
  }

  const custom = getStoredCustomShops();
  const idx = custom.findIndex((s) => s.id === shopId);
  if (idx >= 0) {
    custom[idx].approval_status = approval_status;
    localStorage.setItem(STORAGE_CUSTOM_SHOPS, JSON.stringify(custom));
    await recordAuditLog('shop_moderated', 'shop', shopId, { approval_status });
    return true;
  }
  return true;
}

export async function recordAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const log: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    actor_user_id: 'user-admin',
    actor_email: 'admin@sokoza.co.tz',
    action,
    entity_type: entityType,
    entity_id: entityId,
    safe_metadata: metadata || null,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('audit_logs').insert({
        action,
        entity_type: entityType,
        entity_id: entityId,
        safe_metadata: metadata || null,
      });
    } catch (e) {
      console.warn('Failed to insert audit log in Supabase:', e);
    }
    return;
  }

  const logs = getStoredAuditLogs();
  logs.unshift(log);
  if (logs.length > 100) logs.pop();
  saveStoredAuditLogs(logs);
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
    return data || [];
  }

  const logs = getStoredAuditLogs();
  if (logs.length === 0) {
    // Generate initial demo audit trail
    const demoLogs: AuditLog[] = [
      {
        id: 'audit-1',
        actor_user_id: 'user-admin',
        actor_email: 'admin@sokoza.co.tz',
        action: 'shop_approved',
        entity_type: 'shop',
        entity_id: 'shop-kariakoo-tech',
        safe_metadata: { shop_name: 'Kariakoo Tech Point', region: 'Dar es Salaam' },
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'audit-2',
        actor_user_id: 'user-admin',
        actor_email: 'admin@sokoza.co.tz',
        action: 'category_created',
        entity_type: 'category',
        entity_id: 'cat-spices',
        safe_metadata: { name: 'Spices & Organics' },
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: 'audit-3',
        actor_user_id: 'user-admin',
        actor_email: 'admin@sokoza.co.tz',
        action: 'shop_approved',
        entity_type: 'shop',
        entity_id: 'shop-swahili-vitenge',
        safe_metadata: { shop_name: 'Swahili Vitenge & Fabrics', region: 'Dar es Salaam' },
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'audit-4',
        actor_user_id: 'user-admin',
        actor_email: 'admin@sokoza.co.tz',
        action: 'marketplace_initialized',
        entity_type: 'system',
        entity_id: 'sokoza-core',
        safe_metadata: { version: '1.0.0', currency: 'TZS' },
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
    ];
    saveStoredAuditLogs(demoLogs);
    return demoLogs;
  }
  return logs;
}
