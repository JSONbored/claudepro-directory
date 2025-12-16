'use client';

import { Sparkles } from '@heyclaude/web-runtime/icons';
import { type ContentItem } from '@heyclaude/web-runtime/types/component.types';
import { cn, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@heyclaude/web-runtime/ui';

import { useDetailQuickActions } from './use-detail-quick-actions';
import { paddingX, paddingY, padding, marginBottom, gap, iconSizeRect, muted, between, size, spaceY, weight } from "@heyclaude/web-runtime/design-system";

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
      className={cn('sticky top-16 z-20 mb-8', spaceY.default, className)}
      aria-label="Quick actions"
    >
      <a
        href="#detail-main-content"
        className={`focus-visible:bg-background/90 sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:-top-3 focus-visible:left-3 focus-visible:z-30 focus-visible:rounded-md focus-visible:${paddingX.compact} focus-visible:${paddingY.tight} focus-visible:text-sm focus-visible:shadow-lg`}
      >
        Skip quick actions
      </a>
      <div className={`border-border/60 bg-card/80 supports-[backdrop-filter]:bg-card/60 rounded-2xl border ${padding.compact} shadow-sm backdrop-blur`}>
        <div className={cn(muted.default, marginBottom.compact, between.center, gap.compact, size.xs, 'tracking-wide uppercase')}>
          <div className={`flex items-center ${gap.tight}`}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Quick actions</span>
          </div>
          <span className={cn('text-muted-foreground/80', weight.semibold)}>{quickActions.length}</span>
        </div>
        <div className={`flex flex-wrap ${gap.tight}`}>
          {quickActions.map((action) => (
            <TooltipProvider key={action.key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className={`grow basis-[10rem] justify-center ${gap.tight} whitespace-nowrap`}
                    onClick={action.onClick}
                  >
                    <span className={cn('bg-primary/70', iconSizeRect['1.5x1.5'], 'rounded-full')} aria-hidden="true" />
                    <span className="text-sm font-semibold">{action.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{action.label}</p>
                  <p className={cn(size.xs, muted.default)}>
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