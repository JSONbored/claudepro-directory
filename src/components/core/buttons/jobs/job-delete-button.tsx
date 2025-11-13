'use client';

/**
 * Job Delete Button - Database-First Architecture
 * Uses deleteJob server action (calls delete_job RPC)
 */

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/src/components/primitives/ui/button';
import { deleteJob } from '@/src/lib/actions/jobs.actions';
import { Trash } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { ButtonStyleProps } from '../shared/button-types';

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
