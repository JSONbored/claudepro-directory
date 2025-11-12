'use client';

/**
 * Job Delete Button
 * Permanently deletes a job listing
 */

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/src/components/primitives/ui/button';
import { Trash } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';
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
  const supabase = createClient();

  const handleDelete = () => {
    if (
      !confirm('Are you sure you want to delete this job listing? This action cannot be undone.')
    ) {
      return;
    }

    setIsDeleting(true);
    startTransition(async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('You must be signed in to delete jobs');
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/jobs-handler`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
              'X-Job-Action': 'delete',
            },
            body: JSON.stringify({ id: jobId }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || 'Failed to delete job');
        }

        const result = (await response.json()) as { success: boolean };

        if (result.success) {
          toasts.success.itemDeleted('Job listing');
          router.refresh();
        } else {
          toasts.error.actionFailed('delete job listing');
          setIsDeleting(false);
        }
      } catch (error) {
        logger.error(
          'Failed to delete job',
          error instanceof Error ? error : new Error(String(error)),
          { jobId }
        );
        toasts.error.serverError();
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
