'use client';

/**
 * Enhanced Sonner Toast Configuration
 *
 * Features:
 * - richColors: Vibrant success/error/warning colors for clear feedback
 * - Bottom-right positioning: Less intrusive, doesn't block content
 * - Smooth expand animation: Professional feel
 * - Action buttons with primary styling
 * - Close button for user control
 */

import { muted, radius, weight, shadow } from '@heyclaude/web-runtime/design-system';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, toast } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={(theme as 'system' | 'light' | 'dark') || 'system'}
      className="toaster group"
      position="bottom-right"
      richColors
      expand
      closeButton
      duration={props.duration ?? 4000}
      toastOptions={{
        classNames: {
          toast:
            `group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:${shadow.lg} group-[.toaster]:${radius.xl}`,
          description: `group-[.toast]:${muted.default}`,
          actionButton:
            `group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:${radius.lg} group-[.toast]:${weight.medium}`,
          cancelButton:
            `group-[.toast]:bg-muted group-[.toast]:${muted.default} group-[.toast]:${radius.lg}`,
          closeButton:
            `group-[.toast]:bg-background group-[.toast]:border-border group-[.toast]:${muted.default} group-[.toast]:hover:text-foreground`,
          success:
            'group-[.toaster]:border-green-500/20 group-[.toaster]:bg-green-50 dark:group-[.toaster]:bg-green-950/30',
          error:
            'group-[.toaster]:border-red-500/20 group-[.toaster]:bg-red-50 dark:group-[.toaster]:bg-red-950/30',
          warning:
            'group-[.toaster]:border-yellow-500/20 group-[.toaster]:bg-yellow-50 dark:group-[.toaster]:bg-yellow-950/30',
          info: 'group-[.toaster]:border-blue-500/20 group-[.toaster]:bg-blue-50 dark:group-[.toaster]:bg-blue-950/30',
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
