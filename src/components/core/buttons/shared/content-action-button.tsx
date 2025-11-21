'use client';

import { Check, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Button } from '@/src/components/primitives/ui/button';
import { useButtonSuccess } from '@/src/hooks/use-button-success';
import type { ButtonStyleProps } from '@/src/lib/types/component.types';
import { logClientWarning, normalizeError } from '@/src/lib/utils/error.utils';
import { toasts } from '@/src/lib/utils/toast.utils';

interface ContentActionButtonProps extends ButtonStyleProps {
  url: string;
  action: (content: string) => Promise<void>;
  label: string;
  successMessage: string;
  icon: LucideIcon;
  showIcon?: boolean;
  trackAnalytics?: () => Promise<void>;
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
    if (typeof window !== 'undefined') {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.origin === window.location.origin;
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

  const handleClick = async () => {
    // Prevent race conditions
    if (isLoading || isSuccess) return;

    if (!isSafeFetchUrl(url)) {
      logClientWarning('ContentActionButton: Unsafe URL blocked', { url, label });
      toasts.raw.error('Invalid or unsafe URL');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch content');

      const content = await response.text();
      await action(content);

      triggerSuccess();
      toasts.raw.success(successMessage);

      // Wrap analytics in separate try/catch to avoid masking action success
      if (trackAnalytics) {
        try {
          await trackAnalytics();
        } catch (analyticsError) {
          logClientWarning('ContentActionButton: analytics tracking failed', analyticsError, {
            url,
            label,
          });
          // Don't show error to user - action succeeded
        }
      }
    } catch (error) {
      const normalized = normalizeError(error, 'ContentActionButton: action failed');
      logClientWarning('ContentActionButton: action failed', normalized, { url, label });
      toasts.raw.error(normalized.message);
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
      {showIcon && (
        <motion.div
          animate={isSuccess ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <DisplayIcon className="h-4 w-4" />
        </motion.div>
      )}
      {label}
    </Button>
  );
}
