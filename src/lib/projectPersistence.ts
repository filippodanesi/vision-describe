import { supabase } from './supabase';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  use_case: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithStats extends Project {
  run_count: number;
  total_cost: number;
}

export async function createProject(
  name: string,
  useCase: string,
  description?: string
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name,
      use_case: useCase,
      description: description || '',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[projectPersistence] createProject error:', error);
    return null;
  }
  return data.id;
}

export async function getProjects(): Promise<ProjectWithStats[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !projects) return [];

  // Fetch run stats per project
  const projectIds = projects.map((p) => p.id);
  if (projectIds.length === 0) return projects.map((p) => ({ ...p, run_count: 0, total_cost: 0 }));

  const { data: runs } = await supabase
    .from('runs')
    .select('project_id, total_cost')
    .in('project_id', projectIds);

  const statsMap = new Map<string, { count: number; cost: number }>();
  for (const run of runs || []) {
    if (!run.project_id) continue;
    const existing = statsMap.get(run.project_id) || { count: 0, cost: 0 };
    existing.count++;
    existing.cost += Number(run.total_cost) || 0;
    statsMap.set(run.project_id, existing);
  }

  return projects.map((p) => {
    const stats = statsMap.get(p.id) || { count: 0, cost: 0 };
    return { ...p, run_count: stats.count, total_cost: stats.cost };
  });
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Project;
}

export async function updateProject(
  id: string,
  updates: { name?: string; description?: string }
): Promise<boolean> {
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('[projectPersistence] updateProject error:', error);
    return false;
  }
  return true;
}

export async function deleteProject(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[projectPersistence] deleteProject error:', error);
    return false;
  }
  return true;
}

export async function getProjectRuns(projectId: string) {
  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data;
}
