-- Migration: Add 'batch' to processing_mode check constraint
-- Required for Anthropic Message Batches API support

ALTER TABLE runs
  DROP CONSTRAINT IF EXISTS runs_processing_mode_check;

ALTER TABLE runs
  ADD CONSTRAINT runs_processing_mode_check
  CHECK (processing_mode IN ('client', 'server', 'batch'));
