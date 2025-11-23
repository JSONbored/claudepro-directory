'use client';

/**
 * Job Delete Button - Database-First Architecture
 * Uses deleteJob server action (calls delete_job RPC)
 */

import { deleteJob } from '@heyclaude/web-runtime';
import { logClientWarning } from '@heyclaude/web-runtime/core';
import { Trash } from '@heyclaude/web-runtime/icons';
import type { ButtonStyleProps } from '@heyclaude/web-runtime/types/component.types';
import { cn, toasts, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/src/components/primitives/ui/button';

export interface JobDeleteButtonProps extends ButtonStyleProps {
  jobId: string;
}

export function JobDeleteButton({
  jobId,
  size = 'sm',
  variant = 'ghost',
  className,
  disabled = false,
}: JobDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    if (
      !confirm('Are you sure you want to delete this job listing? This action cannot be undone.')
    ) {
      return;
    }

    setIsDeleting(true);
    startTransition(async () => {
      try {
        const result = await deleteJob({ job_id: jobId });

        if (result?.data?.success) {
          toasts.success.itemDeleted('Job listing');
          router.refresh();
        } else {
          toasts.error.actionFailed('delete job listing');
          setIsDeleting(false);
        }
      } catch (error) {
        logClientWarning('JobDeleteButton: failed to delete job', error, { jobId });
        toasts.error.fromError(error, 'Failed to delete job');
        setIsDeleting(false);
      }
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDelete}
      disabled={disabled || isPending || isDeleting}
      className={cn('text-destructive', className)}
    >
      <Trash className={UI_CLASSES.ICON_XS_LEADING} />
      Delete
    </Button>
  );
}
