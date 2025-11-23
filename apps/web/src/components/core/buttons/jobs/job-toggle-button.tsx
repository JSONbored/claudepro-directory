'use client';

/**
 * Job Toggle Button - Database-First Architecture
 * Uses toggleJobStatus server action (calls toggle_job_status RPC)
 */

import type { JobStatus } from '@heyclaude/web-runtime';
import { toggleJobStatus } from '@heyclaude/web-runtime';
import { logClientWarning } from '@heyclaude/web-runtime/core';
import { Pause, Play } from '@heyclaude/web-runtime/icons';
import type { ButtonStyleProps } from '@heyclaude/web-runtime/types/component.types';
import { toasts, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/src/components/primitives/ui/button';

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
