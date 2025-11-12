'use client';

/**
 * Link Button
 * Navigation to internal or external URLs
 */

import { Button } from '@/src/components/primitives/ui/button';
import type { LucideIcon } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import type { ButtonStyleProps } from '../shared/button-types';

export interface LinkButtonProps extends ButtonStyleProps {
  href: string;
  label: string;
  external?: boolean;
  icon?: LucideIcon;
}

export function LinkButton({
  href,
  label,
  external = false,
  icon: Icon,
  size = 'default',
  buttonVariant = 'default',
  className,
  disabled = false,
}: LinkButtonProps) {
  const handleClick = () => {
    if (external) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = href;
    }
  };

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      className={cn('gap-2', className)}
    >
      {Icon && <Icon className={UI_CLASSES.ICON_SM} />}
      {label}
    </Button>
  );
}
