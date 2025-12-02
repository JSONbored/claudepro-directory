'use client';

import { Sparkles } from '@heyclaude/web-runtime/icons';
import { cluster, marginBottom, muted, weight ,size  , gap , padding  , zLayer , shadow , backdrop , radius , spaceY, borderColor,
  flexWrap,
  tracking,
  justify,
  alignItems,
} from '@heyclaude/web-runtime/design-system';
import type { ContentItem } from '@heyclaude/web-runtime/types/component.types';
import { cn } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import { useDetailQuickActions } from './use-detail-quick-actions';

interface DetailQuickActionsBarProps {
  item: ContentItem;
  metadata: Record<string, unknown>;
  packageName?: string | null;
  configurationObject?: Record<string, unknown> | null;
  mcpServers?: Record<string, unknown> | null;
  className?: string;
}

/**
 * Renders a sticky "Quick actions" bar for a content item showing actionable buttons derived from item metadata.
 *
 * The bar is omitted when there are no quick actions for the provided item.
 *
 * @param item - The content item for which quick actions are computed.
 * @param metadata - Additional metadata used to derive quick actions.
 * @param packageName - Optional package name that can influence available actions.
 * @param configurationObject - Optional configuration object that can influence available actions.
 * @param mcpServers - Optional MCP servers configuration that can influence available actions.
 * @param className - Optional additional class names applied to the outer section element.
 *
 * @see useDetailQuickActions - Hook that determines the list of quick actions shown by this component.
 */
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
      className={cn(
  `sticky top-16 ${zLayer.sticky} ${marginBottom.relaxed} ${spaceY.default}`, className)}
      aria-label="Quick actions"
    >
      <a
        href="#detail-main-content"
        className={`focus-visible:-top-3 sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-3 focus-visible:z-30 focus-visible:${radius.md} focus-visible:bg-background/90 focus-visible:px-3 focus-visible:py-2 focus-visible:${size.sm} focus-visible:${shadow.lg}`}
      >
        Skip quick actions
      </a>
      <div className={`${radius['2xl']} border ${borderColor['border/60']} bg-card/80 ${padding.compact} ${shadow.sm} ${backdrop.default} supports-[backdrop-filter]:bg-card/60`}>
        <div className={`${marginBottom.tight} flex ${alignItems.center} ${justify.between} ${gap.default} ${muted.default} ${size.xs} uppercase ${tracking.wide}`}>
          <div className={cluster.compact}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Quick actions</span>
          </div>
          <span className={`${weight.semibold} ${muted.default}/80`}>{quickActions.length}</span>
        </div>
        <div className={`flex ${flexWrap.wrap} ${gap.compact}`}>
          {quickActions.map((action) => (
            <Button
              key={action.key}
              type="button"
              variant="secondary"
              size="sm"
              className={`grow basis-[10rem] ${justify.center} ${gap.compact} whitespace-nowrap`}
              onClick={action.onClick}
            >
              <span className={`h-1.5 w-1.5 ${radius.full} bg-primary/70`} aria-hidden="true" />
              <span className={`${weight.semibold} ${size.sm}`}>{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}