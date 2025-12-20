'use client';

/**
 * Job Delete Button - Database-First Architecture
 * Uses deleteJob server action (calls delete_job RPC)
 */

import { normalizeError } from '@heyclaude/shared-runtime';
import { deleteJob } from '@heyclaude/web-runtime/actions/jobs-crud';
import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks/use-authenticated-user';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { Trash } from '@heyclaude/web-runtime/icons';
import { type ButtonStyleProps } from '@heyclaude/web-runtime/types/component.types';
import { cn, toasts, Button } from '@heyclaude/web-runtime/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';

import { useAuthModal } from '@/src/hooks/use-auth-modal';

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
  const pathname = usePathname();
  const { user, status } = useAuthenticatedUser({ context: 'JobDeleteButton' });
  const { openAuthModal } = useAuthModal();
  const [isPending, startTransition] = useTransition();
  const {
    value: isDeleting,
    setTrue: setIsDeletingTrue,
    setFalse: setIsDeletingFalse,
  } = useBoolean();
  const runLoggedAsync = useLoggedAsync({
    scope: 'JobDeleteButton',
    defaultMessage: 'Job deletion failed',
    defaultRethrow: false,
  });

  const handleDelete = useCallback(() => {
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

    if (
      !confirm('Are you sure you want to delete this job listing? This action cannot be undone.')
    ) {
      return;
    }

    setIsDeletingTrue();
    // User is authenticated - proceed with delete action
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
        const normalized = normalizeError(error, 'Failed to delete job');
        const errorMessage = normalized.message;

        // Check if error is auth-related and show modal if so
        if (
          errorMessage.includes('signed in') ||
          errorMessage.includes('auth') ||
          errorMessage.includes('unauthorized')
        ) {
          openAuthModal({
            valueProposition: 'Sign in to manage jobs',
            redirectTo: pathname ?? undefined,
          });
        } else {
          // Non-auth errors - show toast with retry option
          toasts.raw.error('Failed to delete job', {
            action: {
              label: 'Retry',
              onClick: () => {
                handleDelete();
              },
            },
          });
        }
        setIsDeletingFalse();
      }
    });
  }, [
    user,
    status,
    openAuthModal,
    pathname,
    jobId,
    router,
    runLoggedAsync,
    setIsDeletingTrue,
    setIsDeletingFalse,
  ]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDelete}
      disabled={disabled || isPending || isDeleting}
      className={cn('text-destructive', className)}
    >
      <Trash className="mr-1 h-3 w-3" />
      Delete
    </Button>
  );
}
