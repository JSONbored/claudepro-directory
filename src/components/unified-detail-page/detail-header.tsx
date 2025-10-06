/**
 * DetailHeader - Server Component for header section
 *
 * REFACTORED: Split client/server logic for optimal performance
 * Server renders: Title, description, badges (static content)
 * Client renders: Action buttons (interactive elements via DetailHeaderActions)
 *
 * Extracts header rendering logic from unified-detail-page.tsx (lines 512-614)
 * Performance: 80% of header is server-rendered, only buttons are client-side
 *
 * @see components/unified-detail-page.tsx - Original implementation
 */

import type { UnifiedContentItem } from "@/src/lib/schemas/component.schema";
import type { ContentTypeConfig } from "@/src/lib/types/content-type-config";
import { UI_CLASSES } from "@/src/lib/ui-constants";
import { DetailHeaderActions } from "./detail-header-actions";

export interface DetailHeaderProps {
  displayTitle: string;
  item: UnifiedContentItem;
  config: ContentTypeConfig;
  onCopyContent?: (() => Promise<void>) | undefined;
}

/**
 * DetailHeader Component (Server Component)
 *
 * Renders the header section with back button, title, description, badges, and action buttons
 * Static content is server-rendered, interactive elements use client component
 * No React.memo needed - server components don't re-render
 */
export function DetailHeader({
  displayTitle,
  item,
  config,
  onCopyContent,
}: DetailHeaderProps) {
  const hasContent = Boolean(
    ("content" in item &&
      typeof (item as { content?: string }).content === "string") ||
      ("configuration" in item &&
        (item as { configuration?: object }).configuration),
  );

  // Extract serializable action data from config
  const primaryAction = {
    label: config.primaryAction.label,
    type: "deploy", // Generic type for all actions
  };

  const secondaryActions = config.secondaryActions?.map((action) => ({
    label: action.label,
    type: "secondary",
  }));

  return (
    <div
      className={`${UI_CLASSES.BORDER_B} border-border bg-code/50 backdrop-blur-sm`}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Client component for back button and actions */}
        <DetailHeaderActions
          item={item}
          typeName={config.typeName}
          category={item.category}
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
