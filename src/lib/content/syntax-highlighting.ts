/**
 * Server-Side Syntax Highlighting with Starry Night
 *
 * Replaced Shiki with Starry Night (100x smaller: ~34KB vs 3.6MB)
 *
 * Benefits:
 * - Zero client-side JavaScript for highlighting
 * - No browser main thread blocking
 * - Instant page loads with pre-rendered HTML
 * - Beautiful syntax highlighting (same TextMate grammars as VSCode)
 * - Shared singleton (no duplicate instances)
 * - 100x smaller bundle size
 */

// Direct export to avoid barrel file pattern
import { highlightCode as starryHighlightCode } from './syntax-highlighting-starry';

export const highlightCode = starryHighlightCode;
