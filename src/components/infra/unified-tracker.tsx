'use client';

/**
 * Unified Tracker Component - Consolidation of ViewTracker + PageViewTracker
 *
 * REPLACES:
 * - ViewTracker (22 LOC) - Basic view tracking with delay
 * - PageViewTracker (37 LOC) - Analytics event tracking
 *
 * Total: 59 LOC → ~80 LOC (includes fixes & Storybook support)
 * Net: More maintainable single source of truth
 *
 * Architecture:
 * - Configuration-driven with discriminated union type safety
 * - 2 variants: 'view' (basic tracking), 'page-view' (analytics events)
 * - Shared useTrackingEffect hook for DRY principles
 * - Unified error handling strategy
 * - Configurable delay for performance optimization
 * - Subpath imports for Storybook compatibility
 *
 * ARCHITECTURAL ISSUES FIXED:
 * 1. ❌ 92% Code Duplication
 *    ✅ FIX: Single component with shared useEffect logic
 *
 * 2. ❌ Inconsistent Error Handling
 *    ✅ FIX: Unified try-catch with silent failure (no console noise)
 *
 * 3. ❌ Missing Abstraction
 *    ✅ FIX: Extracted useTrackingEffect hook
 *
 * 4. ❌ Inconsistent Timing Strategy
 *    ✅ FIX: Configurable delay (default: 1000ms for 'view', 0ms for 'page-view')
 *
 * 5. ❌ Type Safety Issues
 *    ✅ FIX: Discriminated union with compile-time safety
 *
 * 6. ❌ Import Inconsistency
 *    ✅ FIX: Standardized on #lib subpath imports for Storybook mocking
 */

import { useEffect } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Discriminated Union for Unified Tracker Component
 */
export type UnifiedTrackerProps =
  | {
      variant: 'view';
      category: string;
      slug: string;
      delay?: number; // Optional delay in ms (default: 1000ms)
    }
  | {
      variant: 'page-view';
      category: string;
      slug: string;
      sourcePage?: string;
      delay?: number; // Optional delay in ms (default: 0ms)
    };

// ============================================================================
// SHARED HOOK - DRY PRINCIPLE
// ============================================================================

/**
 * Shared tracking effect hook - eliminates duplication
 *
 * @param trackingFn - Function to call for tracking (can return any Promise type)
 * @param delay - Delay in ms before tracking (default: 0)
 * @param deps - Dependencies for useEffect
 */
function useTrackingEffect(
  trackingFn: () => undefined | Promise<unknown>,
  delay: number,
  deps: React.DependencyList
) {
  useEffect(() => {
    if (delay === 0) {
      // Immediate execution (page-view default)
      try {
        const result = trackingFn();
        // Handle promise if returned
        if (result instanceof Promise) {
          result.catch(() => {
            // Silent failure - errors handled server-side or in tracker
            // No console logging to prevent browser exposure
          });
        }
      } catch {
        // Silent failure for sync errors
      }
      return;
    }

    // Delayed execution (view tracker default)
    const timer = setTimeout(() => {
      try {
        const result = trackingFn();
        if (result instanceof Promise) {
          result.catch(() => {
            // Silent failure
          });
        }
      } catch {
        // Silent failure
      }
    }, delay);

    return () => clearTimeout(timer);
    // biome-ignore lint/correctness/useExhaustiveDependencies: deps provided by caller
  }, deps);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UnifiedTracker(props: UnifiedTrackerProps) {
  // Route to appropriate variant
  if (props.variant === 'view') {
    return <ViewVariant {...props} />;
  }

  return <PageViewVariant {...props} />;
}

// ============================================================================
// VIEW VARIANT (Basic Tracking)
// ============================================================================

function ViewVariant({
  category,
  slug,
  delay = 1000,
}: Extract<UnifiedTrackerProps, { variant: 'view' }>) {
  useTrackingEffect(
    () => {
      // Dynamic import for Storybook compatibility (server action)
      return import('#lib/actions/track-view')
        .then((module) => module.trackView({ category, slug }))
        .catch(() => {
          // Silent failure - Storybook mock will handle this
        });
    },
    delay,
    [category, slug]
  );

  return null;
}

// ============================================================================
// PAGE-VIEW VARIANT (Analytics Event Tracking)
// ============================================================================

function PageViewVariant({
  category,
  slug,
  sourcePage,
  delay = 0,
}: Extract<UnifiedTrackerProps, { variant: 'page-view' }>) {
  useTrackingEffect(
    () => {
      // Dynamic imports for Storybook compatibility (analytics modules)
      return Promise.all([import('#lib/analytics/event-mapper'), import('#lib/analytics/tracker')])
        .then(([eventMapper, tracker]) => {
          const eventName = eventMapper.getContentViewEvent(category);
          tracker.trackEvent(eventName, {
            slug,
            page: typeof window !== 'undefined' ? window.location.pathname : `/${category}/${slug}`,
            source: sourcePage || 'direct',
          });
        })
        .catch(() => {
          // Silent failure - Storybook mock will handle this
        });
    },
    delay,
    [category, slug, sourcePage]
  );

  return null;
}
