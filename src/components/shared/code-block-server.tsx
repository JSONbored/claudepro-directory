/**
 * Server-Side Code Block Component
 *
 * Renders syntax-highlighted code on the SERVER with Sugar High.
 * No client-side JavaScript needed for highlighting.
 * Client-side interactivity for copy, screenshot, share (ProductionCodeBlock).
 *
 * Usage:
 * ```tsx
 * <CodeBlockServer code={myCode} language="typescript" filename="example.ts" />
 * ```
 */

import { ProductionCodeBlock } from '@/src/components/content/production-code-block';
import { highlightCode } from '@/src/lib/content/syntax-highlighting';

export interface CodeBlockServerProps {
  code: string;
  language?: string;
  filename?: string;
  maxLines?: number;
  showLineNumbers?: boolean; // Default: true
  className?: string;
}

/**
 * Async Server Component that pre-renders syntax highlighting with Sugar High
 */
export async function CodeBlockServer({
  code,
  language = 'text',
  filename,
  maxLines = 20,
  showLineNumbers = true,
  className = '',
}: CodeBlockServerProps) {
  // Highlight code on the server with line numbers
  const highlightedHtml = await highlightCode(code, language, showLineNumbers);

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
