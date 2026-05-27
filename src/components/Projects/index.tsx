import React, { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  getProjects,
  createProject,
  deleteProject,
  getProjectRuns,
  type ProjectWithStats,
} from '@/lib/projectPersistence';
import { type RunRecord } from '@/lib/runPersistence';
import { getModelById } from '@/lib/models';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { NewProjectDialog } from './NewProjectDialog';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedRuns, setExpandedRuns] = useState<RunRecord[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async (name: string, useCase: string, description: string) => {
    const id = await createProject(name, useCase, description);
    if (id) {
      toast('Project created');
      await loadProjects();
    } else {
      toast.error('Error creating project', {
      });
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteProject(id);
    if (ok) {
      toast('Project deleted');
      if (expandedId === id) {
        setExpandedId(null);
        setExpandedRuns([]);
      }
      await loadProjects();
    } else {
      toast.error('Error deleting project', {
      });
    }
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedRuns([]);
      return;
    }
    setExpandedId(id);
    setLoadingRuns(true);
    try {
      const runs = await getProjectRuns(id);
      setExpandedRuns(runs as RunRecord[]);
    } finally {
      setLoadingRuns(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-in fade-in-0 duration-300">
        <PageHeader
          index="PRJ"
          title="Projects"
          description="Manage and track your processing projects."
          status={{ label: 'Loading', tone: 'muted' }}
        />
        <p className="label-mono py-12 text-center">Loading projects…</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="animate-in fade-in-0 duration-300">
        <PageHeader
          index="PRJ"
          title="Projects"
          description="Manage and track your processing projects."
          status={{ label: 'No projects', tone: 'muted' }}
          actions={
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          }
        />
        <div className="border border-border bg-muted/30 py-20 px-6 text-center">
          <FolderOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-4" />
          <p className="label-mono mb-2">No projects yet</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Create a project to organize your processing runs into focused
            batches.
          </p>
        </div>
        <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreate={handleCreate} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-0 duration-300">
      <PageHeader
        index="PRJ"
        title="Projects"
        description="Manage and track your processing projects."
        meta={
          <span className="tabular-nums">{projects.length} active</span>
        }
        actions={
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        }
      />

      <div className="border border-border divide-y divide-border">
        {projects.map((project) => (
          <div key={project.id} className="overflow-hidden bg-card">
            <div
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => toggleExpand(project.id)}
            >
              {expandedId === project.id ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{project.name}</span>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {project.use_case}
                  </Badge>
                </div>
                {project.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.description}</p>
                )}
              </div>

              <div className="flex items-center gap-6 text-xs text-muted-foreground shrink-0">
                <span className="font-mono">{project.run_count} runs</span>
                <span className="font-mono">${project.total_cost.toFixed(2)}</span>
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete project?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete "{project.name}". Runs will be kept but unlinked from this project.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(project.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {expandedId === project.id && (
              <div className="border-t px-4 py-3">
                {loadingRuns ? (
                  <p className="text-xs text-muted-foreground py-2">Loading runs...</p>
                ) : expandedRuns.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No runs in this project yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20">
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Model</TableHead>
                        <TableHead className="text-xs">File</TableHead>
                        <TableHead className="text-xs text-right">Rows</TableHead>
                        <TableHead className="text-xs text-right">Cost</TableHead>
                        <TableHead className="text-xs text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expandedRuns.map((run) => {
                        const model = getModelById(run.model_id);
                        return (
                          <TableRow key={run.id} className="hover:bg-muted/20">
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(run.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-xs">{model?.name || run.model_id}</TableCell>
                            <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {run.file_name || '-'}
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono">{run.total_rows}</TableCell>
                            <TableCell className="text-xs text-right font-mono">
                              ${Number(run.total_cost).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={run.status === 'completed' ? 'default' : 'secondary'}
                                className="text-xs capitalize"
                              >
                                {run.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreate={handleCreate} />
    </div>
  );
};

export default Projects;
