import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { onQuotaExhausted } from '@/lib/api/anthropicErrors';

/**
 * App-wide dialog shown when a Claude call fails because usage ran out
 * (credits exhausted or a rate limit). Optimize-mode batch runs are already
 * persisted per row and reappear in the resume banner after a reload, so the
 * dialog's job is to explain that and offer a one-click reload.
 *
 * Mounted once in App.tsx. Listens for the window signal fired by
 * emitQuotaExhausted() from the Claude call utilities.
 */
export function QuotaExhaustedDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => onQuotaExhausted(() => setOpen(true)), []);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Claude usage limit reached</AlertDialogTitle>
          <AlertDialogDescription>
            Claude stopped responding because the account ran out of usage
            (credits exhausted or a rate limit). Batch runs are saved
            automatically and reappear in the resume banner after you reload, so
            you can pick up where you left off. Reload once usage is available
            again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Later</AlertDialogCancel>
          <AlertDialogAction onClick={() => window.location.reload()}>
            Reload
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
