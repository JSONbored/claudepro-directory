/**
 * DetailHeader - Server Component for header section
 */

import type { Database } from '@heyclaude/database-types';
import { isValidCategory } from '@heyclaude/web-runtime/core';
import { borderBottom, marginBottom, padding, backdrop,
} from '@heyclaude/web-runtime/design-system';
import type {
  ContentItem,
  UnifiedCategoryConfig,
} from '@heyclaude/web-runtime/types/component.types';
import { Breadcrumbs } from '@heyclaude/web-runtime/ui';
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
 * Renders the detail page header including breadcrumbs, title and client-driven action controls.
 *
 * This is a server component that outputs static header markup; interactive controls are mounted by the client-side
 * DetailHeaderActions component.
 *
 * @param displayTitle - Title shown as the current item's heading in the header and breadcrumbs
 * @param item - Content item (or DB detail result) used to derive category, description, and whether the item has content
 * @param config - Category-specific configuration that supplies labels and serializable action definitions
 * @param onCopyContent - Optional callback invoked when the "copy content" action is triggered
 * @returns The header JSX element for a content detail page
 *
 * @see Breadcrumbs
 * @see DetailHeaderActions
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
    <div className={`${borderBottom.default} bg-code/50 ${backdrop.sm}`}>
      <div className={`container mx-auto ${padding.xDefault} ${padding.yRelaxed}`}>
        {/* Breadcrumbs - minimal navigation trail */}
        <Breadcrumbs
          categoryLabel={categoryLabel}
          currentTitle={displayTitle}
          className={marginBottom.tight}
        />

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