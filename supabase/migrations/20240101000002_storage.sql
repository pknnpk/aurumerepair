-- Create repairs bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('repairs', 'repairs', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public view
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'repairs' );

-- Policy: Authenticated upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'repairs' AND auth.role() = 'authenticated' );

-- Policy: Users can update their own files
CREATE POLICY "Users Update Own Files"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'repairs' AND auth.uid() = owner );
