'use client';

/**
 * ContentSection - Code/content display section with syntax highlighting
 *
 * Consolidates content rendering from unified-detail-page.tsx (lines 621-666)
 * Handles: Code content, configuration content, with syntax highlighting
 *
 * @see components/unified-detail-page.tsx - Original implementation
 */

import { Copy } from 'lucide-react';
import { lazy, memo, Suspense, useMemo } from 'react';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { UnifiedContentItem } from '@/lib/schemas';
import { componentTitleString } from '@/lib/schemas/primitives';

// Lazy load CodeHighlight to split syntax-highlighter into its own chunk
const CodeHighlight = lazy(() =>
  import('@/components/code-highlight').then((module) => ({
    default: module.CodeHighlight,
  }))
);

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
        <CardTitle className="flex items-center gap-2">
          <Copy className="h-5 w-5" />
          {title || 'Content'}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded-md" />}>
          <CodeHighlight code={content} language={language} title={title} showCopy={true} />
        </Suspense>
      </CardContent>
    </Card>
  );
});
