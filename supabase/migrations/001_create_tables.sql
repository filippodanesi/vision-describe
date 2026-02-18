-- Run Persistence Schema
-- Execute this SQL in the Supabase Dashboard (SQL Editor)

CREATE TABLE runs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  use_case    TEXT NOT NULL,
  model_id    TEXT NOT NULL,
  file_name   TEXT,
  total_rows  INTEGER NOT NULL,
  config      JSONB NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'running'
              CHECK (status IN ('running', 'completed', 'interrupted', 'cancelled')),
  total_cost       NUMERIC(10,6) DEFAULT 0,
  total_tokens_in  INTEGER DEFAULT 0,
  total_tokens_out INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE run_results (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id      UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  row_index   INTEGER NOT NULL,
  result_data JSONB NOT NULL,
  cost        NUMERIC(10,6) DEFAULT 0,
  tokens_in   INTEGER DEFAULT 0,
  tokens_out  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(run_id, row_index)
);

-- Indexes
CREATE INDEX idx_runs_user_status ON runs(user_id, status);
CREATE INDEX idx_runs_user_created ON runs(user_id, created_at DESC);
CREATE INDEX idx_run_results_run ON run_results(run_id, row_index);

-- RLS
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_runs" ON runs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_run_results" ON run_results FOR ALL
  USING (EXISTS (SELECT 1 FROM runs WHERE runs.id = run_results.run_id AND runs.user_id = auth.uid()));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER runs_updated_at BEFORE UPDATE ON runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
