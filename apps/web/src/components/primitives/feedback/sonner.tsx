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
 * - Pino logging integration for observability
 */

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';
import { useEffect, useRef } from 'react';
import { logClientInfo } from '@heyclaude/web-runtime/logging/client';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();
  const hasLoggedMount = useRef(false);

  // Log Toaster mount
  useEffect(() => {
    if (!hasLoggedMount.current) {
      logClientInfo('Toaster mounted', 'Toaster.mount', {
        component: 'Toaster',
        module: 'apps/web/src/components/primitives/feedback/sonner',
        theme: theme as string,
      });
      hasLoggedMount.current = true;
    }
  }, [theme]);

  // Log theme changes
  const prevThemeRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevThemeRef.current !== null && prevThemeRef.current !== theme) {
      logClientInfo('Toaster theme changed', 'Toaster.themeChange', {
        component: 'Toaster',
        module: 'apps/web/src/components/primitives/feedback/sonner',
        previousTheme: prevThemeRef.current,
        newTheme: theme as string,
      });
    }
    prevThemeRef.current = theme as string;
  }, [theme]);

  return (
    <Sonner
      theme={(theme as 'dark' | 'light' | 'system') || 'system'}
      className="toaster group"
      position="bottom-right"
      richColors
      expand
      closeButton
      duration={props.duration ?? 4000}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg',
          closeButton:
            'group-[.toast]:bg-background group-[.toast]:border-border group-[.toast]:text-muted-foreground group-[.toast]:hover:text-foreground',
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

export { Toaster };

export { toast } from 'sonner';
