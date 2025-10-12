/**
 * Shared Shiki Highlighter Singleton
 *
 * CRITICAL: Centralized Shiki instance shared across:
 * - MDX processing (rehype-pretty-code)
 * - Runtime code highlighting (syntax-highlighting.ts)
 * - Server components (code-block-server.tsx, etc.)
 *
 * Why This Exists:
 * Without a singleton, Shiki creates 10+ instances during build, causing:
 * - Memory bloat (~50MB per instance = 500MB+ wasted)
 * - Build warnings: "Shiki is supposed to be used as a singleton"
 * - Slower builds (repeated theme/language loading)
 *
 * With singleton:
 * - 1 instance reused across all code highlighting
 * - ~500MB memory savings
 * - Faster builds
 * - Zero warnings
 *
 * @see https://shiki.style/guide/install#fine-grained-bundle
 */

import type { HighlighterCore } from 'shiki/core';
import { batchFetch } from '@/src/lib/utils/batch.utils';

/**
 * Singleton instance - created once, reused everywhere
 */
let highlighterInstance: HighlighterCore | null = null;

/**
 * Get or create the shared Shiki highlighter
 *
 * This function is called by:
 * - mdx-config.ts (during MDX processing)
 * - syntax-highlighting.ts (during runtime highlighting)
 *
 * @returns Shared HighlighterCore instance
 */
export async function getSharedHighlighter(): Promise<HighlighterCore> {
  if (highlighterInstance) {
    return highlighterInstance;
  }

  // Dynamic imports to avoid bundling Shiki in client code
  const { createHighlighterCore } = await import('shiki/core');
  const { createJavaScriptRegexEngine } = await import('shiki/engine/javascript');

  // Load themes and commonly used languages in parallel
  const [
    githubDarkDimmed,
    githubLight,
    typescript,
    javascript,
    json,
    bash,
    python,
    markdown,
    jsx,
    tsx,
  ] = await batchFetch([
    import('shiki/themes/github-dark-dimmed.mjs'),
    import('shiki/themes/github-light.mjs'),
    import('shiki/langs/typescript.mjs'),
    import('shiki/langs/javascript.mjs'),
    import('shiki/langs/json.mjs'),
    import('shiki/langs/bash.mjs'),
    import('shiki/langs/python.mjs'),
    import('shiki/langs/markdown.mjs'),
    import('shiki/langs/jsx.mjs'),
    import('shiki/langs/tsx.mjs'),
  ]);

  highlighterInstance = await createHighlighterCore({
    themes: [githubDarkDimmed.default, githubLight.default],
    langs: [
      typescript.default,
      javascript.default,
      json.default,
      bash.default,
      python.default,
      markdown.default,
      jsx.default,
      tsx.default,
    ],
    engine: createJavaScriptRegexEngine(),
  });

  return highlighterInstance;
}

/**
 * Dispose the highlighter instance (cleanup)
 * Call this in tests or when you need to reset the singleton
 */
export function disposeHighlighter(): void {
  if (highlighterInstance) {
    highlighterInstance.dispose();
    highlighterInstance = null;
  }
}
