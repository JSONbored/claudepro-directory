/**
 * Content Indicators
 *
 * Beautiful, animated indicators for content freshness,
 * source verification, and "new" badges.
 *
 * @module features/indicators
 */

// Re-export from web-runtime (core indicators)
export {
  ContentIndicators,
  NewBadge,
  getFreshnessTier,
  getFreshnessLabel,
  useFreshness,
  type ContentIndicatorsProps,
  type FreshnessTier,
} from '@heyclaude/web-runtime/ui';

// Local components
export {
  useLastVisit,
  NewSinceLastVisitBanner,
  TrendingFallback,
  type LastVisitData,
} from './last-visit';

export { NewContentStat, countItemsFromLastDays } from './new-content-stat';
export { NewContentBadge } from './new-content-badge';
