-- Migration: Set REPLICA IDENTITY FULL on run_results for Realtime compatibility
-- (Not strictly required since we use polling, but enables Realtime if needed later)
ALTER TABLE run_results REPLICA IDENTITY FULL;
