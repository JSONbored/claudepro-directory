'use client';

/**
 * Job Toggle Button - Database-First Architecture
 * Uses toggleJobStatus server action (calls toggle_job_status RPC)
 */

import { normalizeError } from '@heyclaude/shared-runtime';
import { type JobStatus } from '@heyclaude/web-runtime';
import { toggleJobStatus } from '@heyclaude/web-runtime/actions';
import { useAuthenticatedUser, useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { Pause, Play } from '@heyclaude/web-runtime/icons';
import { type ButtonStyleProps } from '@heyclaude/web-runtime/types/component.types';
import { toasts, UI_CLASSES, Button } from '@heyclaude/web-runtime/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useTransition } from 'react';

import { useAuthModal } from '@/src/hooks/use-auth-modal';

export interface JobToggleButtonProps extends ButtonStyleProps {
  currentStatus: JobStatus;
  jobId: string;
}

/**
 * Renders a button that toggles a job's status between `active` and `draft`.
 *
 * The button shows "Pause" when `currentStatus` is `active` and "Resume" otherwise;
 * clicking it triggers a server action to update the job status, displays a success or error toast,
 * and refreshes the page data.
 *
 * @param jobId - The identifier of the job to toggle
 * @param currentStatus - Current job status used to determine button label and next state
 * @param size - Button size variant (defaults to `'sm'`)
 * @param variant - Button visual variant (defaults to `'ghost'`)
 * @param className - Optional CSS class names applied to the button
 * @param disabled - If true, the button is non-interactive (defaults to `false`)
 *
 * @returns A React element for a status-toggle button
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
  const pathname = usePathname();
  const { user, status } = useAuthenticatedUser({ context: 'JobToggleButton' });
  const { openAuthModal } = useAuthModal();
  const [isPending, startTransition] = useTransition();
  const runLoggedAsync = useLoggedAsync({
    scope: 'JobToggleButton',
    defaultMessage: 'Job status toggle failed',
    defaultRethrow: false,
  });

  const handleToggle = useCallback(() => {
    // Proactive auth check - show modal before attempting action
    if (status === 'loading') {
      // Wait for auth check to complete
      return;
    }

    if (!user) {
      // User is not authenticated - show auth modal
      openAuthModal({
        valueProposition: 'Sign in to manage jobs',
        redirectTo: pathname ?? undefined,
      });
      return;
    }

    // Toggle between 'active' and 'draft' status
    const newStatus: JobStatus = currentStatus === 'active' ? 'draft' : 'active';

    // User is authenticated - proceed with toggle action
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
        const normalized = normalizeError(error, 'Failed to toggle job status');
        const errorMessage = normalized.message;
        
        // Check if error is auth-related and show modal if so
        if (errorMessage.includes('signed in') || errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
          openAuthModal({
            valueProposition: 'Sign in to manage jobs',
            redirectTo: pathname ?? undefined,
          });
        } else {
          // Non-auth errors - show toast with retry option
          toasts.raw.error('Failed to toggle job status', {
            action: {
              label: 'Retry',
              onClick: () => {
                handleToggle();
              },
            },
          });
        }
      }
    });
  }, [user, status, openAuthModal, pathname, currentStatus, jobId, router, runLoggedAsync]);

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