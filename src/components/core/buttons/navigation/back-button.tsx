'use client';

/**
 * Back Navigation Button
 * Navigates to previous page in browser history
 */

import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/primitives/ui/button';
import { ArrowLeft } from '@/src/lib/icons';
import { STATE_PATTERNS, UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import type { ButtonStyleProps } from '../shared/button-types';

export interface BackButtonProps extends ButtonStyleProps {
  label?: string;
}

export function BackButton({
  label = 'Back',
  size = 'default',
  buttonVariant = 'ghost',
  className,
  disabled = false,
}: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={() => router.back()}
      disabled={disabled}
      className={cn('text-muted-foreground', STATE_PATTERNS.HOVER_TEXT_FOREGROUND, className)}
    >
      <ArrowLeft className={UI_CLASSES.ICON_SM_LEADING} />
      {label}
    </Button>
  );
}
