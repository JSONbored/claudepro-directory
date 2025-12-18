/**
 * Gradient CSS Class Utilities
 * 
 * NOTE: Most gradient wrappers have been removed. Components now use Tailwind classes directly:
 * - `hero-gradient` → Use `hero-gradient` class directly (defined as @utility in globals.css)
 * - `card-gradient` → Use `card-gradient` class directly (defined as @utility in globals.css)
 * 
 * Remaining export:
 * - heroTexture: Complex Tailwind arbitrary value for hero background texture
 *   This is kept because it's a complex multi-gradient pattern that benefits from semantic naming.
 * 
 * @example
 * ```tsx
 * import { gradient } from '@heyclaude/web-runtime/design-system';
 * 
 * <div className={gradient.heroTexture}>Hero background texture</div>
 * ```
 */

export const gradient = {
  /**
   * Hero background texture (radial gradients)
   * Subtle decorative background with radial gradients at specific positions
   * Uses Tailwind arbitrary values for complex multi-gradient background
   * 
   * This is kept because it's a complex pattern that benefits from semantic naming.
   * Components can use this instead of the long Tailwind arbitrary value string.
   */
  heroTexture: 'bg-[radial-gradient(circle_at_20%_50%,var(--claude-orange)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,var(--claude-orange)_0%,transparent_50%)] bg-[length:100%_100%] bg-center',
} as const;
