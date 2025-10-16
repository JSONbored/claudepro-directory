'use client';

/**
 * Job Actions Component
 * Client-side actions for job management (pause, resume, delete)
 *
 * Provides interactive buttons with optimistic UI updates and toast notifications
 */

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/src/components/ui/button';
import { deleteJob, toggleJobStatus } from '@/src/lib/actions/business.actions';
import { Pause, Play, Trash } from '@/src/lib/icons';
import { toasts } from '@/src/lib/utils/toast.utils';

interface JobActionsProps {
  jobId: string;
  currentStatus: string;
}

export function JobActions({ jobId, currentStatus }: JobActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleStatus = () => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';

    startTransition(async () => {
      try {
        const result = await toggleJobStatus({
          id: jobId,
          status: newStatus as 'active' | 'paused' | 'draft' | 'expired' | 'deleted',
        });

        if (result?.data?.success) {
          toasts.success.actionCompleted(
            newStatus === 'active' ? 'Job listing resumed' : 'Job listing paused'
          );
          router.refresh();
        } else {
          toasts.error.actionFailed('update job status');
        }
      } catch (_error) {
        toasts.error.serverError();
      }
    });
  };

  const handleDelete = () => {
    if (
      !confirm('Are you sure you want to delete this job listing? This action cannot be undone.')
    ) {
      return;
    }

    setIsDeleting(true);
    startTransition(async () => {
      try {
        const result = await deleteJob({ id: jobId });

        if (result?.data?.success) {
          toasts.success.itemDeleted('Job listing');
          router.refresh();
        } else {
          toasts.error.actionFailed('delete job listing');
          setIsDeleting(false);
        }
      } catch (_error) {
        toasts.error.serverError();
        setIsDeleting(false);
      }
    });
  };

  return (
    <>
      {(currentStatus === 'active' || currentStatus === 'paused') && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleStatus}
          disabled={isPending || isDeleting}
        >
          {currentStatus === 'active' ? (
            <>
              <Pause className="h-3 w-3 mr-1" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-3 w-3 mr-1" />
              Resume
            </>
          )}
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={isPending || isDeleting}
        className="text-destructive"
      >
        <Trash className="h-3 w-3 mr-1" />
        Delete
      </Button>
    </>
  );
}
