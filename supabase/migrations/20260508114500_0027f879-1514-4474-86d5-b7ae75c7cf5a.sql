
ALTER TABLE public.chemicals ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS image_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('inventory-images', 'inventory-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Inventory images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inventory-images');

CREATE POLICY "Authenticated upload inventory images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'inventory-images');

CREATE POLICY "Authenticated update inventory images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'inventory-images');

CREATE POLICY "Authenticated delete inventory images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'inventory-images');
