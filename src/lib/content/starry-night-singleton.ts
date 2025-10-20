/**
 * Shared Starry Night Highlighter Singleton
 *
 * Replaces Shiki with Starry Night - a lighter, faster alternative:
 * - 100x smaller: ~34KB vs 3.6MB
 * - Uses WASM but much more efficient than Shiki
 * - Same TextMate grammars as VSCode
 * - Simpler, more portable
 *
 * CRITICAL: Centralized instance shared across:
 * - MDX processing (custom rehype plugin)
 * - Runtime code highlighting (syntax-highlighting.ts)
 * - Server components (code-block-server.tsx, etc.)
 *
 * @see https://github.com/wooorm/starry-night
 */

import { common, createStarryNight } from '@wooorm/starry-night';

/**
 * Starry Night highlighter type (inferred from createStarryNight return)
 */
export type StarryNightHighlighter = Awaited<ReturnType<typeof createStarryNight>>;

/**
 * Singleton instance - created once, reused everywhere
 */
let highlighterInstance: StarryNightHighlighter | null = null;

/**
 * Get or create the shared Starry Night highlighter
 *
 * This function is called by:
 * - mdx-config.ts (during MDX processing)
 * - syntax-highlighting.ts (during runtime highlighting)
 *
 * @returns Shared StarryNight instance
 */
export async function getSharedHighlighter(): Promise<StarryNightHighlighter> {
  if (highlighterInstance) {
    return highlighterInstance;
  }

  // Use common grammars (includes most popular languages)
  // Includes: JS, TS, JSX, TSX, JSON, Shell, Python, Markdown, CSS, HTML, YAML, etc.
  highlighterInstance = await createStarryNight(common);

  return highlighterInstance;
}

/**
 * Map common language aliases to Starry Night scope names
 * Starry Night uses TextMate scope names (e.g., 'source.ts' not 'typescript')
 */
export function normalizeLanguage(lang: string, highlighter: StarryNightHighlighter): string {
  const languageMap: Record<string, string> = {
    // TypeScript family
    ts: 'source.ts',
    typescript: 'source.ts',
    tsx: 'source.tsx',

    // JavaScript family
    js: 'source.js',
    javascript: 'source.js',
    jsx: 'source.jsx',

    // Shell/Bash
    sh: 'source.shell',
    bash: 'source.shell',
    shell: 'source.shell',
    zsh: 'source.shell',

    // Other common languages
    json: 'source.json',
    python: 'source.python',
    py: 'source.python',
    markdown: 'text.md',
    md: 'text.md',
    html: 'text.html.basic',
    css: 'source.css',
    yaml: 'source.yaml',
    yml: 'source.yaml',

    // Fallback
    text: 'text.plain',
    plaintext: 'text.plain',
  };

  const scope = languageMap[lang.toLowerCase()] || 'text.plain';

  // Check if scope is available, fallback to text.plain if not
  const availableScopes = highlighter.scopes();
  return availableScopes.includes(scope) ? scope : 'text.plain';
}

/**
 * Dispose the highlighter instance (cleanup)
 * Call this in tests or when you need to reset the singleton
 */
export function disposeHighlighter(): void {
  highlighterInstance = null;
}
