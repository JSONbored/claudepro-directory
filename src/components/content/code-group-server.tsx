/**
 * CodeGroupServer - Server wrapper for CodeGroup with Shiki highlighting
 *
 * @server This is a SERVER-ONLY component (async, imports batch.utils → cache.server)
 *
 * PRODUCTION-GRADE: Pre-renders all code examples on the server
 * - Async server component that highlights all examples
 * - Passes highlighted HTML to client CodeGroup component
 * - Optimal performance: Highlighting happens once on server
 *
 * **Architecture:**
 * - Server Component: Uses batchMap from batch.utils
 * - NOT Storybook-compatible (requires server-side execution)
 * - Correct usage: Server components can import server-only code
 */

import { highlightCode } from '@/src/lib/content/syntax-highlighting-starry';
import type { CodeGroupProps } from '@/src/lib/schemas/component.schema';
import { batchMap } from '@/src/lib/utils/batch.utils';
import { CodeGroup } from './code-group';

export async function CodeGroupServer(props: CodeGroupProps) {
  // Pre-render all code examples with Shiki on the server
  const highlightedExamples = await batchMap(props.examples, async (example) => {
    const html = await highlightCode(example.code, example.language);
    return {
      language: example.language,
      filename: example.filename,
      code: example.code,
      highlightedHtml: html,
    };
  });

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
