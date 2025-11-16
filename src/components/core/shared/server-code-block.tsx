/**
 * CodeBlockServer - Server-rendered code with Sugar High highlighting
 * Uses edge function for syntax highlighting (cached, fast)
 */

import { ProductionCodeBlock } from '@/src/components/content/interactive-code-block';
import { highlightCodeEdge } from '@/src/lib/edge/client';

export interface CodeBlockServerProps {
  code: string;
  language?: string;
  filename?: string;
  maxLines?: number;
  showLineNumbers?: boolean;
  className?: string;
}

export async function CodeBlockServer({
  code,
  language = 'text',
  filename,
  maxLines = 20,
  showLineNumbers = true,
  className = '',
}: CodeBlockServerProps) {
  const highlightedHtml = await highlightCodeEdge(code, { language, showLineNumbers });

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
