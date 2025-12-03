/**
 * Category Feature Components
 *
 * Components for enhancing category list pages with
 * animated stats, tag strips, and visual enhancements.
 *
 * @module features/category
 */

export {
  AnimatedStatsRow,
  aggregateContentStats, // Re-exported from @heyclaude/web-runtime/utils/content-stats
  formatCompactNumber,
  type StatItem,
} from './animated-stats-row';

export { CategoryTagStrip } from './category-tag-strip';
