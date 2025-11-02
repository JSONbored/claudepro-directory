/**
 * DetailHeader - Server Component for header section
 */

import type { UnifiedCategoryConfig } from '@/src/lib/config/category-config';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import { DetailHeaderActions } from './detail-header-actions';

export interface DetailHeaderProps {
  displayTitle: string;
  item: ContentItem;
  config: UnifiedCategoryConfig;
  onCopyContent?: (() => Promise<void>) | undefined;
}

/**
 * DetailHeader Component (Server Component)
 *
 * Renders the header section with back button, title, description, badges, and action buttons
 * Static content is server-rendered, interactive elements use client component
 * No React.memo needed - server components don't re-render
 */
export function DetailHeader({ displayTitle, item, config, onCopyContent }: DetailHeaderProps) {
  const hasContent = Boolean(
    ('content' in item && typeof (item as { content?: string }).content === 'string') ||
      ('configuration' in item && (item as { configuration?: object }).configuration)
  );

  // Extract serializable action data - database stores { label, type } only
  const primaryAction = config.primaryAction || { label: 'Deploy', type: 'deploy' };
  const secondaryActions = config.secondaryActions;

  return (
    <div className={'border-border border-b bg-code/50 backdrop-blur-sm'}>
      <div className="container mx-auto px-4 py-8">
        {/* Client component for back button and actions */}
        <DetailHeaderActions
          item={item}
          typeName={config.typeName}
          category={item.category as any}
          hasContent={hasContent}
          onCopyContent={onCopyContent}
          displayTitle={displayTitle}
          primaryAction={primaryAction}
          {...(secondaryActions && { secondaryActions })}
        />
      </div>
    </div>
  );
}
