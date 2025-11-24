'use client';

import { Sparkles } from '@heyclaude/web-runtime/icons';
import type { ContentItem } from '@heyclaude/web-runtime/types/component.types';
import { cn } from '@heyclaude/web-runtime/ui';
import { Button } from '@/src/components/primitives/ui/button';
import { useDetailQuickActions } from './use-detail-quick-actions';

interface DetailQuickActionsBarProps {
  item: ContentItem;
  metadata: Record<string, unknown>;
  packageName?: string | null;
  configurationObject?: Record<string, unknown> | null;
  mcpServers?: Record<string, unknown> | null;
  className?: string;
}

export function DetailQuickActionsBar({
  item,
  metadata,
  packageName,
  configurationObject,
  mcpServers,
  className,
}: DetailQuickActionsBarProps) {
  const quickActions = useDetailQuickActions({
    item,
    metadata,
    packageName: packageName ?? null,
    configurationObject: configurationObject ?? null,
    mcpServers: mcpServers ?? null,
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
        className="focus-visible:-top-3 sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-3 focus-visible:z-30 focus-visible:rounded-md focus-visible:bg-background/90 focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:shadow-lg"
      >
        Skip quick actions
      </a>
      <div className="rounded-2xl border border-border/60 bg-card/80 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mb-2 flex items-center justify-between gap-3 text-muted-foreground text-xs uppercase tracking-wide">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Quick actions</span>
          </div>
          <span className="font-semibold text-muted-foreground/80">{quickActions.length}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.key}
              type="button"
              variant="secondary"
              size="sm"
              className="grow basis-[10rem] justify-center gap-2 whitespace-nowrap"
              onClick={action.onClick}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70" aria-hidden="true" />
              <span className="font-semibold text-sm">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
