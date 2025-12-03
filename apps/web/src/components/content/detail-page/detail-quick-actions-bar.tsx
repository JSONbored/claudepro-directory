'use client';

import { Sparkles } from '@heyclaude/web-runtime/icons';
import { cluster, marginBottom, muted, weight ,size  , gap , padding  , zLayer , shadow , backdrop , radius , spaceY, borderColor,
  flexWrap,
  flexGrow,
  tracking,
  justify,
  alignItems,
  display,
  position,
  sticky,
  bgColor,
  iconSize,
  whitespace,
  border,
  srOnly,
  flexBasis,
  transform,
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
  `${sticky.topNav} ${zLayer.sticky} ${marginBottom.relaxed} ${spaceY.default}`, className)}
      aria-label="Quick actions"
    >
      <a
        href="#detail-main-content"
        className={`focus-visible:-top-3 ${srOnly.default} focus-visible:${srOnly.visible} focus-visible:${position.absolute} focus-visible:left-3 focus-visible:${zLayer.sticky} focus-visible:${radius.md} focus-visible:${bgColor['background/90']} focus-visible:${padding.xDefault} focus-visible:${padding.yCompact} focus-visible:${size.sm} focus-visible:${shadow.lg}`}
      >
        Skip quick actions
      </a>
      <div className={`${radius['2xl']} ${border.default} ${borderColor['border/60']} ${bgColor['card/80']} ${padding.compact} ${shadow.sm} ${backdrop.default} supports-[backdrop-filter]:${bgColor['card/60']}`}>
        <div className={`${marginBottom.tight} ${display.flex} ${alignItems.center} ${justify.between} ${gap.default} ${muted.default} ${size.xs} ${transform.uppercase} ${tracking.wide}`}>
          <div className={cluster.compact}>
            <Sparkles className={iconSize.xsPlus} aria-hidden="true" />
            <span>Quick actions</span>
          </div>
          <span className={`${weight.semibold} ${muted.default}/80`}>{quickActions.length}</span>
        </div>
        <div className={`${display.flex} ${flexWrap.wrap} ${gap.compact}`}>
          {quickActions.map((action) => (
            <Button
              key={action.key}
              type="button"
              variant="secondary"
              size="sm"
              className={`${flexGrow.grow} ${flexBasis.rem10} ${justify.center} ${gap.compact} ${whitespace.nowrap}`}
              onClick={action.onClick}
            >
              <span className={`${iconSize.xs} ${radius.full} ${bgColor['primary/70']}`} aria-hidden="true" />
              <span className={`${weight.semibold} ${size.sm}`}>{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}