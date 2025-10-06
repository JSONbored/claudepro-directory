/**
 * Server-Side Syntax Highlighting with Shiki
 *
 * Runs syntax highlighting on the SERVER, eliminating client-side blocking.
 * Pre-renders highlighted HTML that's sent to the browser instantly.
 *
 * Benefits:
 * - Zero client-side JavaScript for highlighting
 * - No browser main thread blocking
 * - Instant page loads with pre-rendered HTML
 * - Beautiful Shiki syntax highlighting
 */

import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

// Singleton highlighter instance (cached in memory)
let highlighterInstance: Awaited<
  ReturnType<typeof createHighlighterCore>
> | null = null;

/**
 * Get or create the Shiki highlighter instance
 * Singleton pattern - created once, reused for all highlighting
 */
async function getHighlighter() {
  if (highlighterInstance) {
    return highlighterInstance;
  }

  // Import themes and commonly used languages
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
  ] = await Promise.all([
    import("shiki/themes/github-dark-dimmed.mjs"),
    import("shiki/themes/github-light.mjs"),
    import("shiki/langs/typescript.mjs"),
    import("shiki/langs/javascript.mjs"),
    import("shiki/langs/json.mjs"),
    import("shiki/langs/bash.mjs"),
    import("shiki/langs/python.mjs"),
    import("shiki/langs/markdown.mjs"),
    import("shiki/langs/jsx.mjs"),
    import("shiki/langs/tsx.mjs"),
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
 * Highlight code on the server with optional line numbers
 * Returns pre-rendered HTML string ready for dangerouslySetInnerHTML
 */
export async function highlightCode(
  code: string,
  language: string = "text",
  showLineNumbers: boolean = true,
): Promise<string> {
  try {
    const highlighter = await getHighlighter();

    const html = highlighter.codeToHtml(code, {
      lang: language,
      themes: {
        dark: "github-dark-dimmed",
        light: "github-light",
      },
      defaultColor: "dark",
      transformers: [
        {
          name: "line-numbers",
          pre(node) {
            node.properties.style = undefined;
            node.properties.class =
              "overflow-x-auto text-sm leading-relaxed p-4 rounded-lg border border-border bg-code/50 backdrop-blur-sm";
          },
          code(node) {
            if (showLineNumbers) {
              node.properties.style = "display: grid; background: transparent;";
            } else {
              node.properties.style =
                "display: block; background: transparent;";
            }
          },
          line(node, line) {
            if (showLineNumbers) {
              node.properties["data-line"] = line;
              node.properties.class = "line-number";
            }
          },
        },
      ],
    });

    return html;
  } catch (_error) {
    // Fallback to plain text if highlighting fails
    const escapedCode = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    return `<pre class="overflow-x-auto text-sm leading-relaxed p-4 rounded-lg border border-border bg-code/50 backdrop-blur-sm"><code style="color: var(--color-text-secondary);">${escapedCode}</code></pre>`;
  }
}
