import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AVAILABLE_USE_CASES } from '@/components/OptimizeMode/usecases';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, useCase: string, description: string) => Promise<void>;
}

export const NewProjectDialog: React.FC<NewProjectDialogProps> = ({ open, onOpenChange, onCreate }) => {
  const [name, setName] = useState('');
  const [useCase, setUseCase] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !useCase) return;
    setCreating(true);
    try {
      await onCreate(name.trim(), useCase, description.trim());
      setName('');
      setUseCase('');
      setDescription('');
      onOpenChange(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Create a project to group your processing runs.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spring Collection 2026"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="use-case">Use Case</Label>
            <Select value={useCase} onValueChange={setUseCase}>
              <SelectTrigger id="use-case">
                <SelectValue placeholder="Select use case" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_USE_CASES.map((uc) => (
                  <SelectItem key={uc.value} value={uc.value}>
                    {uc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-desc">Description (optional)</Label>
            <Textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this project..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating || !name.trim() || !useCase}>
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
