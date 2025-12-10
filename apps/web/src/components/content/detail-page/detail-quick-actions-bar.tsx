'use client';

import { Sparkles } from '@heyclaude/web-runtime/icons';
import { type ContentItem } from '@heyclaude/web-runtime/types/component.types';
import { cn, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@heyclaude/web-runtime/ui';

import { useDetailQuickActions } from './use-detail-quick-actions';

interface DetailQuickActionsBarProps {
  className?: string;
  configurationObject?: Record<string, unknown> | null;
  item: ContentItem;
  mcpServers?: null | Record<string, unknown>;
  metadata: Record<string, unknown>;
  packageName?: null | string;
}

/**
 * Renders a sticky "Quick actions" bar for a content detail page when quick actions are available.
 *
 * @param item - The content item used to derive quick actions.
 * @param metadata - Metadata associated with the content item.
 * @param packageName - Optional package name to scope action resolution; pass `null` to disable.
 * @param configurationObject - Optional configuration object used by action resolution; pass `null` to disable.
 * @param mcpServers - Optional MCP server configuration used by action resolution; pass `null` to disable.
 * @param className - Optional additional class names applied to the top-level section.
 * @returns The quick actions bar element, or `null` if there are no quick actions.
 *
 * @see useDetailQuickActions
 */
export function DetailQuickActionsBar({
  item,
  metadata,
  packageName,
  configurationObject,
  mcpServers,
  className,
}: DetailQuickActionsBarProps) {
  // Handle exactOptionalPropertyTypes: all optional props must be explicitly null or their type, not undefined
  const configObject: Record<string, unknown> | null = configurationObject ?? null;
  const mcpServersValue: Record<string, unknown> | null = mcpServers ?? null;
  const packageNameValue: string | null = packageName ?? null;
  
  const quickActions = useDetailQuickActions({
    item,
    metadata,
    packageName: packageNameValue,
    configurationObject: configObject,
    mcpServers: mcpServersValue,
  });

  if (quickActions.length === 0) {
    return null;
  }

  return (
    <section
      className={cn('sticky top-16 z-20 mb-8 space-y-3', className)}
      aria-label="Quick actions"
    >
      <a
        href="#detail-main-content"
        className="focus-visible:bg-background/90 sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:-top-3 focus-visible:left-3 focus-visible:z-30 focus-visible:rounded-md focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:shadow-lg"
      >
        Skip quick actions
      </a>
      <div className="border-border/60 bg-card/80 supports-[backdrop-filter]:bg-card/60 rounded-2xl border p-3 shadow-sm backdrop-blur">
        <div className="text-muted-foreground mb-2 flex items-center justify-between gap-3 text-xs tracking-wide uppercase">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Quick actions</span>
          </div>
          <span className="text-muted-foreground/80 font-semibold">{quickActions.length}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <TooltipProvider key={action.key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="grow basis-[10rem] justify-center gap-2 whitespace-nowrap"
                    onClick={action.onClick}
                  >
                    <span className="bg-primary/70 h-1.5 w-1.5 rounded-full" aria-hidden="true" />
                    <span className="text-sm font-semibold">{action.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{action.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {action.description || 'Quick action for this item'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    </section>
  );
}