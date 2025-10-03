/**
 * Server-Side Code Block Component
 *
 * Renders syntax-highlighted code on the SERVER with production UX enhancements.
 * No client-side JavaScript needed for highlighting (Shiki runs server-side).
 * Client-side interactivity for copy, expand/collapse (zero bundle impact).
 *
 * Usage:
 * ```tsx
 * <CodeBlockServer code={myCode} language="typescript" filename="example.ts" />
 * ```
 */

import { highlightCode } from '@/lib/content/syntax-highlighting';
import { ProductionCodeBlock } from './production-code-block';

export interface CodeBlockServerProps {
  code: string;
  language?: string;
  filename?: string;
  maxLines?: number;
  showLineNumbers?: boolean;
  className?: string;
}

/**
 * Async Server Component that pre-renders syntax highlighting
 */
export async function CodeBlockServer({
  code,
  language = 'text',
  filename,
  maxLines = 20,
  showLineNumbers = false,
  className = '',
}: CodeBlockServerProps) {
  // Highlight code on the server
  const highlightedHtml = await highlightCode(code, language);

  return (
    <ProductionCodeBlock
      html={highlightedHtml}
      code={code}
      language={language}
      filename={filename}
      maxLines={maxLines}
      showLineNumbers={showLineNumbers}
      className={className}
    />
  );
}
