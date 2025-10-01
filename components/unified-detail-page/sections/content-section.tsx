'use client';

/**
 * ContentSection - Code/content display section with syntax highlighting
 *
 * REFACTORED: Removed lazy loading of CodeHighlight for better performance
 * - Direct import instead of lazy() reduces bundle complexity
 * - Removed Suspense boundary (no longer needed without lazy loading)
 * - Client component remains for CodeHighlight interactivity
 *
 * Consolidates content rendering from unified-detail-page.tsx (lines 621-666)
 * Handles: Code content, configuration content, with syntax highlighting
 *
 * @see components/unified-detail-page.tsx - Original implementation
 */

import { memo, useMemo } from 'react';
import { z } from 'zod';
import { CodeHighlight } from '@/components/shared/code-highlight';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy } from '@/lib/icons';
import type { UnifiedContentItem } from '@/lib/schemas/component.schema';
import { componentTitleString } from '@/lib/schemas/primitives';
import { UI_CLASSES } from '@/lib/ui-constants';

/**
 * Schema for ContentSection props
 */
const contentSectionPropsSchema = z.object({
  item: z.custom<UnifiedContentItem>(),
  title: componentTitleString.optional(),
  description: z.string().optional(),
});

export type ContentSectionProps = z.infer<typeof contentSectionPropsSchema>;

/**
 * ContentSection Component
 *
 * Renders code or configuration content with syntax highlighting.
 * Automatically detects content type and language.
 */
export const ContentSection = memo(function ContentSection({
  item,
  title,
  description,
}: ContentSectionProps) {
  // Extract content from item (either 'content' field or 'configuration' field)
  // MEMOIZED to prevent infinite re-renders in CodeHighlight component
  const content = useMemo(() => {
    if ('content' in item && typeof (item as { content?: string }).content === 'string') {
      return (item as { content: string }).content;
    }

    if ('configuration' in item && (item as unknown as { configuration?: unknown }).configuration) {
      const config = (item as unknown as { configuration?: unknown }).configuration;
      if (typeof config === 'string') {
        return config;
      }
      return JSON.stringify(config, null, 2);
    }

    return '';
  }, [item]);

  // Detect language from item or default to 'text'
  // MEMOIZED to prevent unnecessary re-renders
  const language = useMemo(() => {
    return ('language' in item ? (item as { language?: string }).language : undefined) ?? 'text';
  }, [item]);

  // Don't render if no content
  if (!content) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          <Copy className="h-5 w-5" />
          {title || 'Content'}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <CodeHighlight code={content} language={language} title={title} showCopy={true} />
      </CardContent>
    </Card>
  );
});
