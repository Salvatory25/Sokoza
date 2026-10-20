-- ====================================================================
-- SOKOZA SUPABASE STORAGE BUCKETS & POLICIES
-- Migration: 20261019000002_sokoza_storage_buckets.sql
-- ====================================================================

-- 1. Create Public Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('shop-assets', 'shop-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('product-images', 'product-images', true, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for shop-assets
CREATE POLICY "Public can view shop assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-assets');

CREATE POLICY "Authenticated users can upload shop assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Sellers can update their own shop assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shop-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Sellers can delete their own shop assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shop-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Storage Policies for product-images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated sellers can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Sellers can update their own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Sellers can delete their own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
