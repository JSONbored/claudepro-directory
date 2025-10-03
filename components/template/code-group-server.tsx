/**
 * CodeGroupServer - Server wrapper for CodeGroup with Shiki highlighting
 *
 * PRODUCTION-GRADE: Pre-renders all code examples on the server
 * - Async server component that highlights all examples
 * - Passes highlighted HTML to client CodeGroup component
 * - Optimal performance: Highlighting happens once on server
 */

import { highlightCode } from '@/lib/content/syntax-highlighting';
import type { CodeGroupProps } from '@/lib/schemas/shared.schema';
import { CodeGroup } from './code-group';

export async function CodeGroupServer(props: CodeGroupProps) {
  // Pre-render all code examples with Shiki on the server
  const highlightedExamples = await Promise.all(
    props.examples.map(async (example) => {
      const html = await highlightCode(example.code, example.language);
      return {
        language: example.language,
        filename: example.filename,
        code: example.code,
        highlightedHtml: html,
      };
    })
  );

  // Build props object with only defined values
  const codeGroupProps: {
    examples: typeof highlightedExamples;
    title?: string;
    description?: string;
  } = { examples: highlightedExamples };

  if (props.title) codeGroupProps.title = props.title;
  if (props.description) codeGroupProps.description = props.description;

  return <CodeGroup {...codeGroupProps} />;
}
