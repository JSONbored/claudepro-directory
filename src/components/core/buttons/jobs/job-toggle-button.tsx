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
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { ButtonStyleProps } from '../shared/button-types';

export interface JobToggleButtonProps extends ButtonStyleProps {
  jobId: string;
  currentStatus: 'active' | 'paused';
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
    const newStatus = currentStatus === 'active' ? 'draft' : 'active';

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
