'use client';

/**
 * Job Toggle Button - Database-First Architecture
 * Uses toggleJobStatus server action (calls toggle_job_status RPC)
 */

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/src/components/primitives/ui/button';
import { toggleJobStatus } from '@/src/lib/actions/jobs.actions';
import { Pause, Play } from '@/src/lib/icons';
import type { ButtonStyleProps } from '@/src/lib/types/component.types';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { logClientWarning } from '@/src/lib/utils/error.utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { JobStatus } from '@/src/types/database-overrides';

export interface JobToggleButtonProps extends ButtonStyleProps {
  jobId: string;
  currentStatus: JobStatus;
}

export function JobToggleButton({
  jobId,
  currentStatus,
  size = 'sm',
  variant = 'ghost',
  className,
  disabled = false,
}: JobToggleButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    // Toggle between 'active' and 'draft' status
    const newStatus: JobStatus = currentStatus === 'active' ? 'draft' : 'active';

    startTransition(async () => {
      try {
        const result = await toggleJobStatus({
          job_id: jobId,
          new_status: newStatus,
        });

        if (result?.data?.success) {
          toasts.success.actionCompleted(
            newStatus === 'active' ? 'Job listing resumed' : 'Job listing paused'
          );
          router.refresh();
        } else {
          toasts.error.actionFailed('update job status');
        }
      } catch (error) {
        logClientWarning('JobToggleButton: toggle failed', error, {
          jobId,
          newStatus,
        });
        toasts.error.fromError(error, 'Failed to toggle job status');
      }
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={disabled || isPending}
      className={className}
    >
      {currentStatus === 'active' ? (
        <>
          <Pause className={UI_CLASSES.ICON_XS_LEADING} />
          Pause
        </>
      ) : (
        <>
          <Play className={UI_CLASSES.ICON_XS_LEADING} />
          Resume
        </>
      )}
    </Button>
  );
}
