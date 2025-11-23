/**
 * DetailHeader - Server Component for header section
 */

import type { Database } from '@heyclaude/database-types';
import { isValidCategory } from '@heyclaude/web-runtime/core';
import type {
  ContentItem,
  UnifiedCategoryConfig,
} from '@heyclaude/web-runtime/types/component.types';
import { DetailHeaderActions, type SerializableAction } from './detail-header-actions';

export interface DetailHeaderProps {
  displayTitle: string;
  item:
    | ContentItem
    | (Database['public']['Functions']['get_content_detail_complete']['Returns']['content'] &
        ContentItem);
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
  // Cast to SerializableAction to ensure type safety
  const primaryAction: SerializableAction = (config.primaryAction as SerializableAction) || {
    label: 'Deploy',
    type: 'deploy',
  };
  const secondaryActions: SerializableAction[] | undefined = config.secondaryActions as
    | SerializableAction[]
    | undefined;

  return (
    <div className={'border-border border-b bg-code/50 backdrop-blur-sm'}>
      <div className="container mx-auto px-4 py-8">
        {/* Client component for back button and actions */}
        <DetailHeaderActions
          item={item}
          typeName={config.typeName}
          category={isValidCategory(item.category) ? item.category : 'agents'}
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
