'use client';

/**
 * Snippet Component
 *
 * A compact code snippet component with copy functionality and optional tabs for multiple snippets.
 * Perfect for inline code examples, command snippets, and small code blocks.
 *
 * @example
 * ```tsx
 * <Snippet>
 *   <SnippetHeader>
 *     <SnippetTabsList>
 *       <SnippetTabsTrigger value="npm">npm</SnippetTabsTrigger>
 *       <SnippetTabsTrigger value="pnpm">pnpm</SnippetTabsTrigger>
 *     </SnippetTabsList>
 *     <SnippetCopyButton value="npm install package" />
 *   </SnippetHeader>
 *   <SnippetTabsContent value="npm">npm install package</SnippetTabsContent>
 *   <SnippetTabsContent value="pnpm">pnpm add package</SnippetTabsContent>
 * </Snippet>
 * ```
 *
 * **When to use:**
 * - Inline code snippets: Short commands or code examples
 * - Installation instructions: Package manager commands
 * - Configuration snippets: Small config examples
 * - API examples: Short code samples
 *
 * **Key features:**
 * - Copy to clipboard (appears on hover)
 * - Optional tabs for multiple snippets
 * - Compact design
 * - Truncation for long snippets
 */

import { CheckIcon, CopyIcon } from 'lucide-react';
import { type ComponentProps, cloneElement, type HTMLAttributes, type ReactElement } from 'react';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger, cn } from '@heyclaude/web-runtime/ui';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';
import { useTimeout } from '@heyclaude/web-runtime/hooks/use-timeout';

export type SnippetProps = ComponentProps<typeof Tabs>;

export const Snippet = ({ className, ...props }: SnippetProps) => (
  <Tabs
    className={cn('group w-full gap-0 overflow-hidden rounded-lg border', className)}
    {...(props as any)}
  />
);

export type SnippetHeaderProps = HTMLAttributes<HTMLDivElement>;

export const SnippetHeader = ({ className, ...props }: SnippetHeaderProps) => (
  <div
    className={cn(
      'bg-secondary flex flex-row items-center justify-between border-b p-1',
      className
    )}
    {...(props as any)}
  />
);

export type SnippetCopyButtonProps = ComponentProps<typeof Button> & {
  value: string;
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const SnippetCopyButton = ({
  asChild,
  value,
  onCopy,
  onError,
  timeout = 2000,
  children,
  ...props
}: SnippetCopyButtonProps) => {
  const { value: isCopied, setTrue: setIsCopiedTrue, setFalse: setIsCopiedFalse } = useBoolean();

  // Use useTimeout for automatic reset
  useTimeout(
    () => {
      if (isCopied) {
        setIsCopiedFalse();
      }
    },
    isCopied ? timeout : null
  );

  const copyToClipboard = () => {
    if (typeof window === 'undefined' || !navigator.clipboard.writeText || !value) {
      return;
    }

    navigator.clipboard.writeText(value).then(() => {
      setIsCopiedTrue();
      onCopy?.();
    }, onError);
  };

  if (asChild) {
    return cloneElement(
      children as ReactElement<{ onClick?: () => void }>,
      {
        onClick: copyToClipboard,
      }
    );
  }

  const icon = isCopied ? <CheckIcon size={14} /> : <CopyIcon size={14} />;

  return (
    <Button
      className={`opacity-0 transition-opacity group-hover:opacity-100`}
      onClick={copyToClipboard}
      size="icon"
      variant="ghost"
      {...(props as any)}
    >
      {children ?? icon}
    </Button>
  );
};

export type SnippetTabsListProps = ComponentProps<typeof TabsList>;

export const SnippetTabsList = TabsList;

export type SnippetTabsTriggerProps = ComponentProps<typeof TabsTrigger>;

export const SnippetTabsTrigger = ({ className, ...props }: SnippetTabsTriggerProps) => (
  <TabsTrigger className={cn('gap-1.5', className)} {...(props as any)} /> // 6px = gap-1.5
);

export type SnippetTabsContentProps = ComponentProps<typeof TabsContent>;

export const SnippetTabsContent = ({ className, children, ...props }: SnippetTabsContentProps) => (
  <TabsContent
    asChild
    className={cn('bg-background mt-0 p-4 text-sm', className)}
    {...(props as any)}
  >
    <pre className="truncate">{children}</pre>
  </TabsContent>
);
