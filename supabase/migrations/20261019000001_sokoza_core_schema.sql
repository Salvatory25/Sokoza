-- ====================================================================
-- SOKOZA MULTI-VENDOR MARKETPLACE CORE SCHEMA
-- Migration: 20261019000001_sokoza_core_schema.sql
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM ('customer', 'seller', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE shop_approval_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE product_status_type AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status_type AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'ready_for_collection',
    'out_for_delivery',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE fulfillment_method_type AS ENUM ('delivery', 'collection');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ====================================================================
-- 3. CORE TABLES
-- ====================================================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'sw')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- USER ROLES (Elevated role check without circular recursion)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'seller',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, role)
);

-- SHOPS (Independent multi-seller stores)
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (char_length(name) >= 2),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~* '^[a-z0-9-]+$'),
  description TEXT,
  logo_path TEXT,
  cover_image_path TEXT,
  whatsapp_number TEXT NOT NULL CHECK (whatsapp_number ~ '^\d{9,15}$'),
  region TEXT NOT NULL DEFAULT 'Dar es Salaam',
  district TEXT NOT NULL DEFAULT 'Ilala',
  delivery_information TEXT,
  approval_status shop_approval_status NOT NULL DEFAULT 'approved',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_sw TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_path TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  price_tzs BIGINT NOT NULL CHECK (price_tzs >= 0),
  compare_at_price_tzs BIGINT CHECK (compare_at_price_tzs IS NULL OR compare_at_price_tzs >= price_tzs),
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  sku TEXT,
  status product_status_type NOT NULL DEFAULT 'published',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Size"
  value TEXT NOT NULL, -- e.g. "XL"
  price_adjustment_tzs BIGINT NOT NULL DEFAULT 0 CHECK (price_adjustment_tzs >= 0),
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_reference TEXT NOT NULL UNIQUE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_region TEXT NOT NULL,
  delivery_district TEXT NOT NULL,
  delivery_area TEXT NOT NULL,
  delivery_instructions TEXT,
  fulfillment_method fulfillment_method_type NOT NULL DEFAULT 'delivery',
  items_subtotal_tzs BIGINT NOT NULL CHECK (items_subtotal_tzs >= 0),
  delivery_fee_tzs BIGINT CHECK (delivery_fee_tzs IS NULL OR delivery_fee_tzs >= 0),
  total_tzs BIGINT,
  currency TEXT NOT NULL DEFAULT 'TZS',
  status order_status_type NOT NULL DEFAULT 'pending',
  customer_language TEXT NOT NULL DEFAULT 'en' CHECK (customer_language IN ('en', 'sw')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ORDER ITEMS SNAPSHOT
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  unit_price_tzs BIGINT NOT NULL CHECK (unit_price_tzs >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  line_subtotal_tzs BIGINT NOT NULL CHECK (line_subtotal_tzs >= 0),
  selected_variant_snapshot TEXT,
  image_url_snapshot TEXT
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  safe_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- MARKETPLACE SETTINGS
CREATE TABLE IF NOT EXISTS public.marketplace_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marketplace_name TEXT NOT NULL DEFAULT 'Sokoza',
  tagline TEXT NOT NULL DEFAULT 'Your Shop. Your Market.',
  require_shop_approval BOOLEAN NOT NULL DEFAULT false,
  require_product_approval BOOLEAN NOT NULL DEFAULT false,
  featured_shop_limit INT NOT NULL DEFAULT 8,
  contact_email TEXT NOT NULL DEFAULT 'support@sokoza.co.tz',
  contact_whatsapp TEXT NOT NULL DEFAULT '255700000000'
);

-- ====================================================================
-- 4. PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_shops_owner ON public.shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_slug ON public.shops(slug);
CREATE INDEX IF NOT EXISTS idx_shops_status ON public.shops(approval_status, is_active);

CREATE INDEX IF NOT EXISTS idx_products_shop ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price_tzs);

CREATE INDEX IF NOT EXISTS idx_orders_shop ON public.orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_ref ON public.orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_settings ENABLE ROW LEVEL SECURITY;

-- Helper security definer function for Admin role check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- USER ROLES POLICIES
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- SHOPS POLICIES
CREATE POLICY "Active approved shops are viewable by public" ON public.shops
  FOR SELECT USING (
    (approval_status = 'approved' AND is_active = true) OR
    auth.uid() = owner_id OR
    public.is_admin()
  );

CREATE POLICY "Sellers can create their own shop" ON public.shops
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Sellers can update their own shop" ON public.shops
  FOR UPDATE USING (auth.uid() = owner_id)
  WITH CHECK (
    auth.uid() = owner_id AND
    -- Sellers cannot self-approve or elevate status
    approval_status = (SELECT approval_status FROM public.shops WHERE id = shops.id)
  );

CREATE POLICY "Admins have full access to shops" ON public.shops
  FOR ALL USING (public.is_admin());

-- CATEGORIES POLICIES
CREATE POLICY "Categories viewable by everyone" ON public.categories
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- PRODUCTS POLICIES
CREATE POLICY "Published products viewable by everyone" ON public.products
  FOR SELECT USING (
    status = 'published' OR
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()) OR
    public.is_admin()
  );

CREATE POLICY "Sellers can manage products in their shop" ON public.products
  FOR ALL USING (
    shop_id IN (
      SELECT id FROM public.shops
      WHERE owner_id = auth.uid() AND approval_status != 'suspended'
    )
  );

CREATE POLICY "Admins can manage all products" ON public.products
  FOR ALL USING (public.is_admin());

-- PRODUCT IMAGES & VARIANTS POLICIES
CREATE POLICY "Images viewable by public" ON public.product_images
  FOR SELECT USING (true);

CREATE POLICY "Sellers manage images for their products" ON public.product_images
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.shops s ON s.id = p.shop_id
      WHERE s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Variants viewable by public" ON public.product_variants
  FOR SELECT USING (true);

CREATE POLICY "Sellers manage variants for their products" ON public.product_variants
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.shops s ON s.id = p.shop_id
      WHERE s.owner_id = auth.uid()
    )
  );

-- ORDERS & ORDER ITEMS POLICIES
CREATE POLICY "Sellers can view and update orders for their own shops" ON public.orders
  FOR SELECT USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()) OR
    customer_user_id = auth.uid() OR
    public.is_admin()
  );

CREATE POLICY "Anyone can create an order" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Sellers can update order status for their shop" ON public.orders
  FOR UPDATE USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()) OR
    public.is_admin()
  );

CREATE POLICY "Order items viewable by associated parties" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.shops s ON s.id = o.shop_id
      WHERE s.owner_id = auth.uid() OR o.customer_user_id = auth.uid() OR public.is_admin()
    )
  );

CREATE POLICY "Anyone can insert order items snapshot" ON public.order_items
  FOR INSERT WITH CHECK (true);

-- AUDIT LOGS
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "System can record audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- SETTINGS
CREATE POLICY "Settings viewable by everyone" ON public.marketplace_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins manage settings" ON public.marketplace_settings
  FOR ALL USING (public.is_admin());
