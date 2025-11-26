'use client';

/**
 * Job Delete Button - Database-First Architecture
 * Uses deleteJob server action (calls delete_job RPC)
 */

import { deleteJob } from '@heyclaude/web-runtime/actions';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
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
  const runLoggedAsync = useLoggedAsync({
    scope: 'JobDeleteButton',
    defaultMessage: 'Job deletion failed',
    defaultRethrow: false,
  });

  const handleDelete = () => {
    if (
      !confirm('Are you sure you want to delete this job listing? This action cannot be undone.')
    ) {
      return;
    }

    setIsDeleting(true);
    startTransition(async () => {
      try {
        await runLoggedAsync(
          async () => {
            const result = await deleteJob({ job_id: jobId });

            if (result?.data?.success) {
              toasts.success.itemDeleted('Job listing');
              router.refresh();
            } else {
              throw new Error('Job deletion returned success: false');
            }
          },
          {
            message: 'Job deletion failed',
            context: { jobId },
          }
        );
      } catch (error) {
        // Error already logged by useLoggedAsync
        toasts.error.fromError(
          error instanceof Error ? error : new Error('Failed to delete job'),
          'Failed to delete job'
        );
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
