-- Migration: Server-side processing support
-- Adds columns to runs table for server processing, creates storage bucket, enables realtime

-- 1) Add new columns to runs table
ALTER TABLE runs
  ADD COLUMN IF NOT EXISTS processed_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS file_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS processing_mode TEXT DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS chain_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 2) Create storage bucket for run files (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('run-files', 'run-files', false)
ON CONFLICT (id) DO NOTHING;

-- 3) RLS policy for run-files bucket: users can only access their own files
CREATE POLICY "Users can upload run files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'run-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own run files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'run-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own run files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'run-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Service role bypass: allow service role to read/write any file in run-files
-- (The service role key already bypasses RLS, so no extra policy needed)

-- 4) Enable Realtime on runs table
ALTER PUBLICATION supabase_realtime ADD TABLE runs;

-- 5) Add check constraint for processing_mode
ALTER TABLE runs
  ADD CONSTRAINT runs_processing_mode_check
  CHECK (processing_mode IN ('client', 'server'));
