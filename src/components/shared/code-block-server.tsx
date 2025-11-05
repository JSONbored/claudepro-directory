/**
 * CodeBlockServer - Server-rendered code with Sugar High highlighting
 */

import { ProductionCodeBlock } from '@/src/components/content/production-code-block';
import { highlightCode } from '@/src/lib/content/syntax-highlighting';

export interface CodeBlockServerProps {
  code: string;
  language?: string;
  filename?: string;
  maxLines?: number;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeBlockServer({
  code,
  language = 'text',
  filename,
  maxLines = 20,
  showLineNumbers = true,
  className = '',
}: CodeBlockServerProps) {
  const highlightedHtml = highlightCode(code, language, showLineNumbers);

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
