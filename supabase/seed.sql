-- ====================================================================
-- SOKOZA SEED DATA & ADMINISTRATOR BOOTSTRAP SQL
-- ====================================================================

-- 1. Insert Default Marketplace Settings
INSERT INTO public.marketplace_settings (
  marketplace_name,
  tagline,
  require_shop_approval,
  require_product_approval,
  featured_shop_limit,
  contact_email,
  contact_whatsapp
) VALUES (
  'Sokoza',
  'Your Shop. Your Market.',
  false,
  false,
  8,
  'contact@sokoza.co.tz',
  '255712345678'
) ON CONFLICT DO NOTHING;

-- 2. Insert Standard Categories (Bilingual English & Kiswahili)
INSERT INTO public.categories (id, name_en, name_sw, slug, image_path, is_active, sort_order)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Electronics & Gadgets', 'Vifaa vya Kielektroniki', 'electronics-gadgets', 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=500&q=80', true, 1),
  ('c0000000-0000-0000-0000-000000000002', 'Fashion & Vitenge', 'Mitindo na Vitenge', 'fashion-vitenge', 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=500&q=80', true, 2),
  ('c0000000-0000-0000-0000-000000000003', 'Home & Living', 'Vifaa vya Nyumbani', 'home-living', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=500&q=80', true, 3),
  ('c0000000-0000-0000-0000-000000000004', 'Crafts & Art', 'Kazi za Mikono na Sanaa', 'crafts-art', 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&w=500&q=80', true, 4),
  ('c0000000-0000-0000-0000-000000000005', 'Food & Spices', 'Vyakula na Viungo', 'food-spices', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=500&q=80', true, 5),
  ('c0000000-0000-0000-0000-000000000006', 'Health & Beauty', 'Afya na Urembo', 'health-beauty', 'https://images.unsplash.com/photo-1608248597359-00f723924765?auto=format&fit=crop&w=500&q=80', true, 6)
ON CONFLICT (id) DO NOTHING;

-- 3. BOOTSTRAP ADMINISTRATOR INSTRUCTION:
-- To grant a registered user Super Administrator privileges:
-- Run the following query in your Supabase SQL Editor replacing with user email:
/*
  INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'admin'::user_role_type
  FROM auth.users
  WHERE email = 'admin@sokoza.co.tz'
  ON CONFLICT (user_id, role) DO NOTHING;
*/
