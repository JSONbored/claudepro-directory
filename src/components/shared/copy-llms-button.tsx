/**
 * Copy LLMs.txt Button Component
 *
 * Provides one-click copying of llms.txt content for AI assistant usage.
 * Refactored to use BaseActionButton for consistency and reduced code duplication.
 *
 * October 2025 Production Standards:
 * - Leverages BaseActionButton for unified state management
 * - Client-side fetch with proper error handling
 * - Consistent UI patterns with other action buttons
 * - Toast notifications and loading states
 * - Accessibility compliant
 *
 * @module components/shared/copy-llms-button
 */

'use client';

import { BaseActionButton, BaseActionButtonIcon } from '@/src/components/shared/base-action-button';
import { useCopyToClipboard } from '@/src/hooks/use-copy-to-clipboard';
import { Sparkles } from '@/src/lib/icons';

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
 * Uses BaseActionButton for unified state management and UX.
 * Fetches llms.txt content client-side and copies to clipboard.
 *
 * @param props - Component props
 * @returns Button that fetches and copies llms.txt content
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
  // Use centralized clipboard hook
  const { copy } = useCopyToClipboard({
    context: {
      component: 'CopyLLMsButton',
      action: 'copy_llmstxt',
    },
  });

  return (
    <BaseActionButton
      label={label}
      loadingLabel="Loading..."
      successLabel="Copied!"
      icon={Sparkles}
      size={size}
      variant={variant}
      showIcon={showIcon}
      ariaLabel="Copy AI-optimized content"
      ariaLabelSuccess="Content copied"
      componentName="CopyLLMsButton"
      {...(className && { className })}
      onClick={async ({ setLoading, setSuccess, showSuccess, showError, logError }) => {
        setLoading(true);

        try {
          // Fetch llms.txt content
          const response = await fetch(llmsTxtUrl);

          if (!response.ok) {
            throw new Error(`Failed to fetch llms.txt: ${response.status} ${response.statusText}`);
          }

          const content = await response.text();

          // Copy to clipboard using hook
          await copy(content);

          setSuccess(true);
          showSuccess('Copied to clipboard!', 'AI-optimized content ready to paste');
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logError('Failed to fetch llms.txt content', err, { llmsTxtUrl });
          showError('Failed to copy', 'Please try again or copy the URL manually');
        } finally {
          setLoading(false);
        }
      }}
    />
  );
}

/**
 * Compact icon-only variant of CopyLLMsButton
 */
export function CopyLLMsButtonIcon({
  llmsTxtUrl,
  className,
  variant = 'ghost',
}: Omit<CopyLLMsButtonProps, 'label' | 'size' | 'showIcon'>) {
  // Use centralized clipboard hook
  const { copy } = useCopyToClipboard({
    context: {
      component: 'CopyLLMsButtonIcon',
      action: 'copy_llmstxt',
    },
  });

  return (
    <BaseActionButtonIcon
      icon={Sparkles}
      variant={variant}
      ariaLabel="Copy AI-optimized content"
      ariaLabelSuccess="Content copied"
      title="Copy for AI"
      componentName="CopyLLMsButtonIcon"
      {...(className && { className })}
      onClick={async ({ setLoading, setSuccess, showSuccess, showError, logError }) => {
        setLoading(true);

        try {
          const response = await fetch(llmsTxtUrl);

          if (!response.ok) {
            throw new Error(`Failed to fetch llms.txt: ${response.status}`);
          }

          const content = await response.text();

          // Copy using hook
          await copy(content);

          setSuccess(true);
          showSuccess('Copied for AI!');
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logError('Failed to fetch llms.txt', err, { llmsTxtUrl });
          showError('Failed to copy');
        } finally {
          setLoading(false);
        }
      }}
    />
  );
}
