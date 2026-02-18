-- Phase 4: Projects & User Settings
-- Execute this SQL in the Supabase Dashboard (SQL Editor)

-- Tabella progetti
CREATE TABLE projects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  use_case    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_projects_user ON projects(user_id, created_at DESC);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_projects" ON projects FOR ALL USING (auth.uid() = user_id);

-- Aggiungere project_id alla tabella runs (nullable per backward compatibility)
ALTER TABLE runs ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX idx_runs_project ON runs(project_id);

-- Tabella impostazioni utente (API keys)
CREATE TABLE user_settings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  openai_key  TEXT,
  anthropic_key TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- Trigger updated_at per nuove tabelle
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
