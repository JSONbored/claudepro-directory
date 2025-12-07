'use client';

import { normalizeError } from '@heyclaude/shared-runtime';
import { logClientWarn } from '@heyclaude/web-runtime/logging/client';
import { useLoggedAsync, useButtonSuccess } from '@heyclaude/web-runtime/hooks';
import { type ButtonStyleProps } from '@heyclaude/web-runtime/types/component.types';
import { toasts, Button } from '@heyclaude/web-runtime/ui';
import { Check, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface ContentActionButtonProps extends ButtonStyleProps {
  action: (content: string) => Promise<void>;
  icon: LucideIcon;
  label: string;
  showIcon?: boolean;
  successMessage: string;
  trackAnalytics?: () => Promise<void>;
  url: string;
}

/**
 * Validate URL is safe for fetch (prevents SSRF)
 * Only allows relative URLs or absolute URLs from same origin
 */
function isSafeFetchUrl(url: string): boolean {
  try {
    // Allow relative URLs
    if (url.startsWith('/')) return true;
    // For absolute URLs, must be same origin
    if (globalThis.window !== undefined) {
      const urlObj = new URL(url, globalThis.location.origin);
      return urlObj.origin === globalThis.location.origin;
    }
    // Server-side: only allow relative URLs
    return url.startsWith('/');
  } catch {
    return false;
  }
}

export function ContentActionButton({
  url,
  action,
  label,
  successMessage,
  icon: Icon,
  showIcon = true,
  trackAnalytics,
  variant = 'default',
  size = 'default',
  className,
  disabled,
}: ContentActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { isSuccess, triggerSuccess } = useButtonSuccess();
  const runLoggedAsync = useLoggedAsync({
    scope: 'ContentActionButton',
    defaultMessage: 'Content action failed',
    defaultRethrow: false,
  });

  const handleClick = async () => {
    // Prevent race conditions
    if (isLoading || isSuccess) return;

    if (!isSafeFetchUrl(url)) {
      logClientWarn(
        '[Security] Unsafe URL blocked',
        new Error('Unsafe URL blocked'),
        'ContentActionButton.handleClick',
        {
          component: 'ContentActionButton',
          action: 'block-unsafe-url',
          category: 'security',
          url,
          label,
        }
      );
      toasts.raw.error('Invalid or unsafe URL');
      return;
    }

    setIsLoading(true);
    try {
      await runLoggedAsync(
        async () => {
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch content');

          const content = await response.text();
          await action(content);

          triggerSuccess();
          toasts.raw.success(successMessage);

          // Wrap analytics in separate try/catch to avoid masking action success
          if (trackAnalytics) {
            await runLoggedAsync(
              async () => {
                await trackAnalytics();
              },
              {
                message: 'Analytics tracking failed',
                level: 'warn',
                rethrow: false,
                context: { url, label },
              }
            );
          }
        },
        {
          message: 'Content action failed',
          context: { url, label },
        }
      );
    } catch (error) {
      // Error already logged by useLoggedAsync, just show user-friendly message
      toasts.raw.error(normalizeError(error, 'Action failed').message);
    } finally {
      setIsLoading(false);
    }
  };

  const DisplayIcon = isSuccess ? Check : Icon;

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || isSuccess || disabled}
      variant={variant}
      size={size}
      className={className}
      style={{ opacity: isLoading ? 0.7 : 1 }}
    >
      {showIcon ? (
        <motion.div
          animate={isSuccess ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <DisplayIcon className="h-4 w-4" />
        </motion.div>
      ) : null}
      {label}
    </Button>
  );
}
