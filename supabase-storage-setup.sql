-- PixLab Image Storage Setup
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pixlab-images', 'pixlab-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;

-- Step 3: Allow anyone to upload images
CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'pixlab-images');

-- Step 4: Allow anyone to view images
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pixlab-images');

-- Step 5: Allow anyone to delete images (optional)
CREATE POLICY "Anyone can delete images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'pixlab-images');

-- Verify setup
SELECT * FROM storage.buckets WHERE id = 'pixlab-images';
