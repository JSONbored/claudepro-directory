/**
 * Copy LLMs.txt Button Component
 * Provides one-click copying of llms.txt content for AI assistant usage
 *
 * Refactored to use centralized useCopyToClipboard hook for consistent behavior.
 *
 * @module components/shared/copy-llms-button
 */

'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { toast } from '@/src/components/ui/sonner';
import { useCopyToClipboard } from '@/src/hooks/use-copy-to-clipboard';
import { Check, Sparkles } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { cn } from '@/src/lib/utils';

/**
 * Props for CopyLLMsButton component
 */
export interface CopyLLMsButtonProps {
  /**
   * URL to the llms.txt endpoint
   * @example "/mcp/github-mcp-server/llms.txt"
   */
  llmsTxtUrl: string;

  /**
   * Optional label for the button
   * @default "Copy for AI"
   */
  label?: string;

  /**
   * Button size variant
   * @default "sm"
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';

  /**
   * Button style variant
   * @default "outline"
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to show the Sparkles icon
   * @default true
   */
  showIcon?: boolean;
}

/**
 * Button component for copying llms.txt content to clipboard
 *
 * @param props - Component props
 * @returns Button that fetches and copies llms.txt content
 *
 * @remarks
 * This component fetches the llms.txt content from the provided URL
 * and copies it to the clipboard. It provides visual feedback via:
 * - Icon change (Sparkles → Check → Sparkles)
 * - Toast notification
 * - Button state changes
 *
 * @example
 * ```tsx
 * <CopyLLMsButton llmsTxtUrl="/mcp/github-mcp-server/llms.txt" />
 * ```
 */
export function CopyLLMsButton({
  llmsTxtUrl,
  label = 'Copy for AI',
  size = 'sm',
  variant = 'outline',
  className,
  showIcon = true,
}: CopyLLMsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Use centralized clipboard hook
  const { copied, copy } = useCopyToClipboard({
    onSuccess: () => {
      toast.success('Copied to clipboard!', {
        description: 'AI-optimized content ready to paste',
        duration: 3000,
      });
    },
    onError: () => {
      toast.error('Failed to copy', {
        description: 'Please try again or copy the URL manually',
        duration: 4000,
      });
    },
    context: {
      component: 'CopyLLMsButton',
      action: 'copy_llmstxt',
    },
  });

  /**
   * Handle copy button click
   * Fetches llms.txt content and copies to clipboard
   */
  const handleCopy = async () => {
    if (isLoading || copied) return;

    setIsLoading(true);

    try {
      // Fetch llms.txt content
      const response = await fetch(llmsTxtUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch llms.txt: ${response.status} ${response.statusText}`);
      }

      const content = await response.text();

      // Copy to clipboard using hook
      await copy(content);
    } catch (error) {
      logger.error(
        'Failed to fetch llms.txt content',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'CopyLLMsButton',
          llmsTxtUrl,
        }
      );

      // Show error toast
      toast.error('Failed to copy', {
        description: 'Please try again or copy the URL manually',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      disabled={isLoading || copied}
      className={cn(
        'gap-2 transition-all',
        copied && 'border-green-500/50 bg-green-500/10 text-green-400',
        className
      )}
      aria-label={copied ? 'Content copied' : 'Copy AI-optimized content'}
    >
      {showIcon &&
        (copied ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : isLoading ? (
          <Sparkles className="h-4 w-4 animate-pulse" aria-hidden="true" />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        ))}
      <span className="text-sm">{copied ? 'Copied!' : isLoading ? 'Loading...' : label}</span>
    </Button>
  );
}

/**
 * Compact icon-only variant of CopyLLMsButton
 *
 * @param props - Component props (excluding size)
 * @returns Icon button for copying llms.txt content
 *
 * @example
 * ```tsx
 * <CopyLLMsButtonIcon llmsTxtUrl="/agents/code-reviewer/llms.txt" />
 * ```
 */
export function CopyLLMsButtonIcon({
  llmsTxtUrl,
  className,
  variant = 'ghost',
}: Omit<CopyLLMsButtonProps, 'label' | 'size' | 'showIcon'>) {
  const [isLoading, setIsLoading] = useState(false);

  // Use centralized clipboard hook
  const { copied, copy } = useCopyToClipboard({
    onSuccess: () => {
      toast.success('Copied for AI!');
    },
    onError: () => {
      toast.error('Failed to copy');
    },
    context: {
      component: 'CopyLLMsButtonIcon',
      action: 'copy_llmstxt',
    },
  });

  const handleCopy = async () => {
    if (isLoading || copied) return;

    setIsLoading(true);

    try {
      const response = await fetch(llmsTxtUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch llms.txt: ${response.status}`);
      }

      const content = await response.text();

      // Copy using hook
      await copy(content);
    } catch (error) {
      logger.error(
        'Failed to fetch llms.txt',
        error instanceof Error ? error : new Error(String(error)),
        { component: 'CopyLLMsButtonIcon', llmsTxtUrl }
      );

      toast.error('Failed to copy');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleCopy}
      disabled={isLoading || copied}
      className={cn(
        'transition-all',
        copied && 'border-green-500/50 bg-green-500/10 text-green-400',
        className
      )}
      aria-label="Copy AI-optimized content"
      title="Copy for AI"
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : isLoading ? (
        <Sparkles className="h-4 w-4 animate-pulse" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
    </Button>
  );
}
