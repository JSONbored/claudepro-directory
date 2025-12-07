/**
 * DetailHeader - Server Component for header section
 */

import { type Database } from '@heyclaude/database-types';
import { isValidCategory } from '@heyclaude/web-runtime/core';
import {
  type ContentItem,
  type UnifiedCategoryConfig,
} from '@heyclaude/web-runtime/types/component.types';
import { Breadcrumbs } from '@heyclaude/web-runtime/ui';

import { DetailHeaderActions, type SerializableAction } from './detail-header-actions';

export interface DetailHeaderProps {
  config: UnifiedCategoryConfig;
  displayTitle: string;
  item:
    | ContentItem
    | (ContentItem &
        Database['public']['Functions']['get_content_detail_complete']['Returns']['content']);
  onCopyContent?: (() => Promise<void>) | undefined;
}

/**
 * Renders the header for a content detail view, including breadcrumbs and client-driven action controls.
 *
 * This is a server component that renders static header content (title and breadcrumbs) and delegates interactive controls
 * to a client component (DetailHeaderActions). The header derives a pluralized category label from the provided config.
 *
 * @param displayTitle - The title to display in the header and breadcrumbs
 * @param item - The content item being viewed (includes content/detail fields used by actions)
 * @param config - Category configuration used for labels and serializable action definitions
 * @param onCopyContent - Optional callback invoked by client actions to copy content; may return a Promise
 *
 * @see Breadcrumbs
 * @see DetailHeaderActions
 * @see isValidCategory
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

  // Category label for breadcrumbs (pluralized type name)
  const categoryLabel = config.typeName.endsWith('s') ? config.typeName : `${config.typeName}s`;

  return (
    <div className="border-border bg-code/50 border-b backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs - minimal navigation trail */}
        <Breadcrumbs categoryLabel={categoryLabel} currentTitle={displayTitle} className="mb-2" />

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