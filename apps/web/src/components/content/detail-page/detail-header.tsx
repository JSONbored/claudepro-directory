/**
 * DetailHeader - Server Component for header section
 */

import type { GetContentDetailCompleteReturns } from '@heyclaude/database-types/postgres-types';
import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';
import { type ContentItem } from '@heyclaude/web-runtime/types/component.types';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import type { SerializableAction } from './detail-header-actions';

// Dynamic import for DetailHeaderActions (917 lines) - lazy load for code splitting
const DetailHeaderActions = dynamic(
  () => import('./detail-header-actions').then((mod) => ({ default: mod.DetailHeaderActions })),
  { ssr: true }
);

export interface DetailHeaderProps {
  // ARCHITECTURAL FIX: Only pass serializable data, not entire config
  // DetailHeader only needs: typeName, primaryAction, secondaryActions
  // We don't pass the entire config (which contains React components and functions)
  config: {
    typeName: string;
    primaryAction: SerializableAction;
    secondaryActions?: SerializableAction[];
  };
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

  // Config already provides properly typed SerializableAction (no transformation needed)
  const primaryAction = config.primaryAction;
  const secondaryActions = config.secondaryActions;

  return (
    <div className={`border-border bg-code/50 border-b backdrop-blur-sm`}>
      <div className="container mx-auto px-4 py-8">
        {/* Client component for back button and actions - lazy loaded */}
        <Suspense fallback={<div className="h-16" />}>
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
        </Suspense>
      </div>
    </div>
  );
}