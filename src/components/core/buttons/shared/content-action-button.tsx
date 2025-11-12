'use client';

import { useState } from 'react';
import { Check, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/primitives/ui/button';
import { motion } from 'motion/react';
import { useButtonSuccess } from '@/hooks/use-button-success';
import type { ButtonStyleProps } from './button-types';
import { toasts } from '@/lib/toasts';

interface ContentActionButtonProps extends ButtonStyleProps {
  url: string;
  action: (content: string) => Promise<void>;
  label: string;
  successMessage: string;
  icon: LucideIcon;
  showIcon?: boolean;
  trackAnalytics?: () => Promise<void>;
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
    setIsLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch content');

      const content = await response.text();
      await action(content);

      triggerSuccess();
      toasts.raw.success(successMessage);

      if (trackAnalytics) await trackAnalytics();
    } catch (error) {
      toasts.raw.error(error instanceof Error ? error.message : 'Action failed');
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
