export type UserRole = 'customer' | 'seller' | 'admin';

export type ShopApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type ProductStatus = 'draft' | 'published' | 'archived';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_for_collection'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled';

export type FulfillmentMethod = 'delivery' | 'collection';

export interface Profile {
  id: string;
  display_name: string;
  phone: string;
  preferred_language: 'en' | 'sw';
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_path: string | null;
  cover_image_path: string | null;
  whatsapp_number: string; // international digits-only format e.g. 255712345678
  region: string;
  district: string;
  delivery_information: string | null;
  approval_status: ShopApprovalStatus;
  is_active: boolean;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name_en: string;
  name_sw: string;
  slug: string;
  image_path: string | null;
  is_active: boolean;
  sort_order: number;
  product_count?: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string; // e.g. "Size" or "Color"
  value: string; // e.g. "XL" or "Blue"
  price_adjustment_tzs: number; // positive or zero
  stock_quantity: number;
  created_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  created_at?: string;
}

export interface Product {
  id: string;
  shop_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price_tzs: number; // integer TZS
  compare_at_price_tzs: number | null; // previous/discounted price
  stock_quantity: number;
  sku: string | null;
  status: ProductStatus;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  shop?: Shop;
  category?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface OrderItemSnapshot {
  id: string;
  order_id: string;
  product_id: string;
  product_name_snapshot: string;
  unit_price_tzs: number;
  quantity: number;
  line_subtotal_tzs: number;
  selected_variant_snapshot: string | null;
  image_url_snapshot?: string | null;
}

export interface Order {
  id: string;
  order_reference: string; // e.g. "SKZ-20261019-9482"
  shop_id: string;
  customer_user_id: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_region: string;
  delivery_district: string;
  delivery_area: string;
  delivery_instructions: string | null;
  fulfillment_method: FulfillmentMethod;
  items_subtotal_tzs: number;
  delivery_fee_tzs: number | null; // null = pending seller confirmation
  total_tzs: number | null; // null if delivery fee pending
  currency: 'TZS';
  status: OrderStatus;
  customer_language: 'en' | 'sw';
  created_at: string;
  updated_at: string;
  // Joins
  shop?: Shop;
  items?: OrderItemSnapshot[];
}

export interface Report {
  id: string;
  reporter_user_id: string | null;
  shop_id: string | null;
  product_id: string | null;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}

export interface AuditLog {
  id: string;
  actor_user_id: string | null;
  actor_email?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  safe_metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface MarketplaceSettings {
  id: string;
  marketplace_name: string;
  tagline: string;
  require_shop_approval: boolean;
  require_product_approval: boolean;
  featured_shop_limit: number;
  contact_email: string;
  contact_whatsapp: string;
}
