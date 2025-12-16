/**
 * DetailHeader - Server Component for header section
 */

import type { GetContentDetailCompleteReturns } from '@heyclaude/database-types/postgres-types';
import { isValidCategory } from '@heyclaude/web-runtime/core';
import {
  type ContentItem,
  type UnifiedCategoryConfig,
} from '@heyclaude/web-runtime/types/component.types';

import { DetailHeaderActions, type SerializableAction, type SerializableActionType } from './detail-header-actions';
import { paddingX, paddingY, marginX } from "@heyclaude/web-runtime/design-system";

export interface DetailHeaderProps {
  config: UnifiedCategoryConfig;
  displayTitle: string;
  item:
    | ContentItem
    | (ContentItem &
        NonNullable<GetContentDetailCompleteReturns['content']>);
  onCopyContent?: (() => Promise<void>) | undefined;
}

/**
 * Renders the header for a content detail view with client-driven action controls.
 *
 * This is a server component that renders the header structure and delegates interactive controls
 * to a client component (DetailHeaderActions). Breadcrumbs are handled globally by the sub-menu bar.
 *
 * @param displayTitle - The title to display in the header
 * @param item - The content item being viewed (includes content/detail fields used by actions)
 * @param config - Category configuration used for labels and serializable action definitions
 * @param onCopyContent - Optional callback invoked by client actions to copy content; may return a Promise
 *
 * @see DetailHeaderActions
 * @see isValidCategory
 */
export function DetailHeader({ displayTitle, item, config, onCopyContent }: DetailHeaderProps) {
  const hasContent = Boolean(
    ('content' in item && typeof item.content === 'string') ||
    ('configuration' in item && typeof item['configuration'] === 'object' && item['configuration'] !== null)
  );

  // Extract serializable action data - database stores { label, type } only
  // Cast to SerializableAction to ensure type safety
  // Type narrowing: primaryAction is already SerializableAction from config
  const primaryAction: SerializableAction = (typeof config.primaryAction === 'object' && config.primaryAction !== null && 'type' in config.primaryAction)
    ? (config.primaryAction satisfies SerializableAction)
    : {
    label: 'Deploy',
    type: 'deploy',
  };
  // Type narrowing: secondaryActions needs type narrowing from string to SerializableActionType
  const secondaryActions: SerializableAction[] | undefined = Array.isArray(config.secondaryActions)
    ? config.secondaryActions
        .filter((action): action is SerializableAction => {
          const validTypes: SerializableActionType[] = [
            'copy_command',
            'copy_script',
            'custom',
            'deploy',
            'download',
            'github_link',
            'info',
            'notification',
            'scroll',
          ];
          return typeof action === 'object' && action !== null && 'type' in action && 'label' in action && validTypes.includes(action.type as SerializableActionType);
        })
        .map((action) => ({
          label: action.label,
          type: action.type as SerializableActionType,
        }))
    : undefined;

  return (
    <div className={`border-border bg-code/50 border-b backdrop-blur-sm`}>
      <div className={`container ${marginX.auto} ${paddingX.default} ${paddingY.relaxed}`}>
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