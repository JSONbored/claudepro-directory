'use client';

/**
 * Job Toggle Button - Database-First Architecture
 * Uses toggleJobStatus server action (calls toggle_job_status RPC)
 */

import { normalizeError } from '@heyclaude/shared-runtime';
import type { JobStatus } from '@heyclaude/web-runtime';
import { toggleJobStatus } from '@heyclaude/web-runtime/actions';
import { iconLeading } from '@heyclaude/web-runtime/design-system';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { Pause, Play } from '@heyclaude/web-runtime/icons';
import type { ButtonStyleProps } from '@heyclaude/web-runtime/types/component.types';
import { toasts } from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@heyclaude/web-runtime/ui';

export interface JobToggleButtonProps extends ButtonStyleProps {
  jobId: string;
  currentStatus: JobStatus;
}

/**
 * Button that toggles a job's status between `active` and `draft`, shows success/error toasts, and refreshes the page.
 *
 * @param jobId - Identifier of the job to toggle
 * @param currentStatus - Current status of the job (`'active'` or `'draft'`)
 * @param size - Button size variant (defaults to `'sm'`)
 * @param variant - Button visual variant (defaults to `'ghost'`)
 * @param className - Additional CSS class names applied to the button
 * @param disabled - When `true`, disables the button (defaults to `false`)
 *
 * @returns The button element that triggers the job status toggle and displays UI feedback
 *
 * @see toggleJobStatus
 * @see useLoggedAsync
 * @see toasts
 */
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
  const runLoggedAsync = useLoggedAsync({
    scope: 'JobToggleButton',
    defaultMessage: 'Job status toggle failed',
    defaultRethrow: false,
  });

  const handleToggle = () => {
    // Toggle between 'active' and 'draft' status
    const newStatus: JobStatus = currentStatus === 'active' ? 'draft' : 'active';

    startTransition(async () => {
      try {
        await runLoggedAsync(
          async () => {
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
              throw new Error('Job status toggle returned success: false');
            }
          },
          {
            message: 'Job status toggle failed',
            context: { jobId, newStatus, currentStatus },
          }
        );
      } catch (error) {
        // Error already logged by useLoggedAsync
        toasts.error.fromError(
          normalizeError(error, 'Failed to toggle job status'),
          'Failed to toggle job status'
        );
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
          <Pause className={iconLeading.xs} />
          Pause
        </>
      ) : (
        <>
          <Play className={iconLeading.xs} />
          Resume
        </>
      )}
    </Button>
  );
}