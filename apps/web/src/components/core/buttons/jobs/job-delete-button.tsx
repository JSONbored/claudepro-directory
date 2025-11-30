'use client';

/**
 * Job Delete Button - Database-First Architecture
 * Uses deleteJob server action (calls delete_job RPC)
 */

import { normalizeError } from '@heyclaude/shared-runtime';
import { deleteJob } from '@heyclaude/web-runtime/actions';
import { iconLeading } from '@heyclaude/web-runtime/design-system';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { Trash } from '@heyclaude/web-runtime/icons';
import type { ButtonStyleProps } from '@heyclaude/web-runtime/types/component.types';
import { cn, toasts } from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@heyclaude/web-runtime/ui';

export interface JobDeleteButtonProps extends ButtonStyleProps {
  jobId: string;
}

/**
 * Renders a "Delete" button that confirms and deletes a job listing by ID.
 *
 * Presents a confirmation dialog, calls the job deletion API, shows success or error toasts,
 * and refreshes the router on successful deletion. Disables the button while deletion is in progress.
 *
 * @param jobId - The identifier of the job to delete.
 * @param size - Button size variant (defaults to `'sm'`).
 * @param variant - Button visual variant (defaults to `'ghost'`).
 * @param className - Additional CSS class names to apply to the button.
 * @param disabled - If `true`, the button is rendered disabled regardless of deletion state.
 * @returns The rendered delete Button element.
 *
 * @see deleteJob
 * @see useLoggedAsync
 * @see toasts
 */
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
          normalizeError(error, 'Failed to delete job'),
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
      <Trash className={iconLeading.xs} />
      Delete
    </Button>
  );
}