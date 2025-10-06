import dynamic from 'next/dynamic';
import type React from 'react';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// Generate stable keys for skeleton items (prevents unnecessary re-renders)
const generateSkeletonKeys = () => Array.from({ length: 6 }, () => crypto.randomUUID());

/**
 * Lazy-loaded InfiniteScrollContainer with grid skeleton loading state
 */
export const LazyInfiniteScrollContainer = dynamic(
  () =>
    import('./infinite-scroll-container').then((mod) => ({
      default: mod.InfiniteScrollContainer,
    })),
  {
    loading: () => (
      <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
        {generateSkeletonKeys().map((key) => (
          <div key={key} className="animate-pulse">
            <div
              className={`bg-card/50 ${UI_CLASSES.ROUNDED_LG} ${UI_CLASSES.P_6} ${UI_CLASSES.SPACE_Y_4}`}
            >
              <div className="h-6 bg-card/70 rounded w-3/4" />
              <div className={`h-4 bg-card/70 rounded ${UI_CLASSES.W_FULL}`} />
              <div className="h-4 bg-card/70 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    ),
  }
) as <T>(
  props: import('./infinite-scroll-container').InfiniteScrollContainerProps<T>
) => React.JSX.Element;
