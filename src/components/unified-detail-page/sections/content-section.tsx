/**
 * ContentSection - Server-side code/content display with syntax highlighting
 *
 * OPTIMIZED: Uses server-side Shiki rendering (no client-side blocking)
 * - Highlighting runs on the server
 * - Pre-rendered HTML sent to browser instantly
 * - Zero client JavaScript for syntax highlighting
 * - Eliminates browser main thread freezes
 *
 * Consolidates content rendering from unified-detail-page.tsx (lines 621-666)
 * Handles: Code content, configuration content, with syntax highlighting
 *
 * @see components/unified-detail-page.tsx - Original implementation
 */

import { CodeBlockServer } from '@/src/components/shared/code-block-server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { detectLanguage } from '@/src/lib/content/language-detection';
import { Copy } from '@/src/lib/icons';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { generateFilename } from '@/src/lib/utils/content.utils';

export interface ContentSectionProps {
  item: UnifiedContentItem;
  title?: string;
  description?: string;
}

/**
 * ContentSection - Async Server Component
 *
 * Renders code or configuration content with SERVER-SIDE syntax highlighting.
 * No client-side JavaScript needed for highlighting.
 */
export async function ContentSection({ item, title, description }: ContentSectionProps) {
  // Extract content from item
  let content = '';
  if ('content' in item && typeof (item as { content?: string }).content === 'string') {
    content = (item as { content: string }).content;
  } else if (
    'configuration' in item &&
    (item as unknown as { configuration?: unknown }).configuration
  ) {
    const config = (item as unknown as { configuration?: unknown }).configuration;
    if (typeof config === 'string') {
      content = config;
    } else {
      content = JSON.stringify(config, null, 2);
    }
  }

  // Don't render if no content
  if (!content) return null;

  // Production-grade language detection with caching
  const languageHint = 'language' in item ? (item as { language?: string }).language : undefined;
  const language = await detectLanguage(content, languageHint);

  // Generate intelligent filename based on content type and category
  const filename = generateFilename({ item, language });

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
        <CodeBlockServer code={content} language={language} filename={filename} />
      </CardContent>
    </Card>
  );
}
