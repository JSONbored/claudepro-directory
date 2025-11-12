'use client';

/**
 * Job Toggle Button
 * Toggles job listing between active and paused states
 */

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/src/components/primitives/ui/button';
import { Pause, Play } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';
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
  const supabase = createClient();

  const handleToggle = () => {
    const newStatus = currentStatus === 'active' ? 'draft' : 'active';

    startTransition(async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('You must be signed in to manage jobs');
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/jobs-handler`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
              'X-Job-Action': 'toggle',
            },
            body: JSON.stringify({
              id: jobId,
              status: newStatus,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || 'Failed to toggle job status');
        }

        const result = (await response.json()) as { success: boolean };

        if (result.success) {
          toasts.success.actionCompleted(
            newStatus === 'active' ? 'Job listing resumed' : 'Job listing paused'
          );
          router.refresh();
        } else {
          toasts.error.actionFailed('update job status');
        }
      } catch (error) {
        logger.error(
          'Failed to toggle job status',
          error instanceof Error ? error : new Error(String(error)),
          { jobId, newStatus }
        );
        toasts.error.serverError();
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
