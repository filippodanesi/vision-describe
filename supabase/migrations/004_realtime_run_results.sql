-- Migration: Enable Realtime on run_results for per-row activity log
ALTER PUBLICATION supabase_realtime ADD TABLE run_results;
