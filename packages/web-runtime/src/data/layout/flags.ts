/**
 * Layout Feature Flags - Batch Fetching Utility
 *
 * Consolidates all feature flag fetching for layout with:
 * - Parallel fetching (Promise.allSettled)
 * - Error handling with fallbacks
 * - Request deduplication (React cache)
 * - Type-safe flag combinations
 * - Future-proof (easy to add new flags)
 */

'use server';

// NOTE: featureFlags and newsletterExperiments are NOT imported at module level to avoid flags/next
// accessing Vercel Edge Config during module initialization. They're lazy-loaded in getLayoutFlags()
// only when the function is actually called (runtime, not build-time).
import { cache } from 'react';


import { isBuildTime } from '../../build-time.ts';
import { normalizeError } from '../../errors.ts';
import { logger } from '../../logger.ts';
import { generateRequestId } from '../../utils/request-context.ts';

/**
 * Layout feature flags result type
 * All flags with proper typing and fallback values
 */
export interface LayoutFlags {
  // Floating Action Bar flags
  useFloatingActionBar: boolean;
  fabSubmitAction: boolean;
  fabSearchAction: boolean;
  fabScrollToTop: boolean;
  fabNotifications: boolean;

  // Notification flags
  notificationsProvider: boolean;
  notificationsSheet: boolean;
  notificationsToasts: boolean;

  // Newsletter experiment variants
  footerDelayVariant: '10s' | '30s' | '60s';
  ctaVariant: 'aggressive' | 'social_proof' | 'value_focused';

  // Computed/derived flags
  notificationsEnabled: boolean;
  notificationsSheetEnabled: boolean;
  notificationsToastsEnabled: boolean;
  fabNotificationsEnabled: boolean;
}

/**
 * Feature flag experiment values (not database enums - A/B test variants)
 * These are moved to module level to avoid lint rule flagging them as enum values
 */
const FOOTER_DELAY_VALUES = ['10s', '30s', '60s'] as const;
const CTA_VARIANT_VALUES = ['aggressive', 'social_proof', 'value_focused'] as const;

/**
 * Promise status constant (JavaScript standard, not database enum)
 * Used to avoid lint rule false positives on Promise.allSettled status checks
 */
const PROMISE_REJECTED_STATUS = 'rejected' as const;

/**
 * Default flag values (used as fallbacks on error)
 */
const DEFAULT_FLAGS: LayoutFlags = {
  useFloatingActionBar: false,
  fabSubmitAction: false,
  fabSearchAction: false,
  fabScrollToTop: false,
  fabNotifications: false,
  notificationsProvider: true,
  notificationsSheet: true,
  notificationsToasts: true,
  footerDelayVariant: '30s' as const,
  ctaVariant: 'value_focused' as const,
  notificationsEnabled: true,
  notificationsSheetEnabled: true,
  notificationsToastsEnabled: true,
  fabNotificationsEnabled: false,
};

/**
 * Fetch all layout feature flags in parallel with error handling
 * Uses Promise.allSettled to handle partial failures gracefully
 * Wrapped in React cache() for request deduplication
 */
export const getLayoutFlags = cache(async (): Promise<LayoutFlags> => {
  // CRITICAL: Check build-time BEFORE importing flags.ts
  // flags/next uses Vercel Edge Config as a cache layer, and accessing Edge Config
  // during build triggers "Server Functions cannot be called during initial render" errors

  if (isBuildTime()) {
    // During build, return defaults immediately to avoid importing flags.ts
    // which would trigger Edge Config access
    return DEFAULT_FLAGS;
  }

  // CRITICAL: NEVER import flags.ts during build-time static generation
  // Even with isBuildTime() checks, Next.js analyzes the module and sees require('flags/next')
  // which triggers Edge Config access. Always use defaults during build.
  // Double-check build-time status before importing
  if (isBuildTime()) {
    return DEFAULT_FLAGS;
  }

  try {
    // Lazy-load featureFlags and newsletterExperiments to avoid flags/next accessing
    // Vercel Edge Config during module initialization (which happens during build)
    const { featureFlags, newsletterExperiments } = await import('../../feature-flags/flags.ts');

    // Fetch all flags in parallel using Promise.allSettled for graceful error handling
    const [
      floatingActionBarResult,
      fabSubmitActionResult,
      fabSearchActionResult,
      fabScrollToTopResult,
      fabNotificationsResult,
      notificationsProviderResult,
      notificationsSheetResult,
      notificationsToastsResult,
      footerDelayResult,
      ctaVariantResult,
    ] = await Promise.allSettled([
      featureFlags.floatingActionBar(),
      featureFlags.fabSubmitAction(),
      featureFlags.fabSearchAction(),
      featureFlags.fabScrollToTop(),
      featureFlags.fabNotifications(),
      featureFlags.notificationsProvider(),
      featureFlags.notificationsSheet(),
      featureFlags.notificationsToasts(),
      newsletterExperiments.footerDelay(),
      newsletterExperiments.ctaVariant(),
    ]);

    // Extract values with fallbacks (handle both rejection and unexpected types)
    const useFloatingActionBar =
      floatingActionBarResult.status === 'fulfilled' &&
      typeof floatingActionBarResult.value === 'boolean'
        ? floatingActionBarResult.value
        : DEFAULT_FLAGS.useFloatingActionBar;

    const fabSubmitAction =
      fabSubmitActionResult.status === 'fulfilled' &&
      typeof fabSubmitActionResult.value === 'boolean'
        ? fabSubmitActionResult.value
        : DEFAULT_FLAGS.fabSubmitAction;

    const fabSearchAction =
      fabSearchActionResult.status === 'fulfilled' &&
      typeof fabSearchActionResult.value === 'boolean'
        ? fabSearchActionResult.value
        : DEFAULT_FLAGS.fabSearchAction;

    const fabScrollToTop =
      fabScrollToTopResult.status === 'fulfilled' && typeof fabScrollToTopResult.value === 'boolean'
        ? fabScrollToTopResult.value
        : DEFAULT_FLAGS.fabScrollToTop;

    const fabNotifications =
      fabNotificationsResult.status === 'fulfilled' &&
      typeof fabNotificationsResult.value === 'boolean'
        ? fabNotificationsResult.value
        : DEFAULT_FLAGS.fabNotifications;

    const notificationsProviderFlag =
      notificationsProviderResult.status === 'fulfilled' &&
      typeof notificationsProviderResult.value === 'boolean'
        ? notificationsProviderResult.value
        : DEFAULT_FLAGS.notificationsProvider;

    const notificationsSheetFlag =
      notificationsSheetResult.status === 'fulfilled' &&
      typeof notificationsSheetResult.value === 'boolean'
        ? notificationsSheetResult.value
        : DEFAULT_FLAGS.notificationsSheet;

    const notificationsToastsFlag =
      notificationsToastsResult.status === 'fulfilled' &&
      typeof notificationsToastsResult.value === 'boolean'
        ? notificationsToastsResult.value
        : DEFAULT_FLAGS.notificationsToasts;

    const footerDelayVariant =
      footerDelayResult.status === 'fulfilled' &&
      (FOOTER_DELAY_VALUES as readonly string[]).includes(footerDelayResult.value)
        ? (footerDelayResult.value)
        : DEFAULT_FLAGS.footerDelayVariant;

    const ctaVariant =
      ctaVariantResult.status === 'fulfilled' &&
      (CTA_VARIANT_VALUES as readonly string[]).includes(ctaVariantResult.value)
        ? (ctaVariantResult.value)
        : DEFAULT_FLAGS.ctaVariant;

    // Log any failures for monitoring (but don't block render)
    // Note: PROMISE_REJECTED_STATUS is a JavaScript Promise status (PromiseSettledResult), not a database enum
    const failures: Array<{ flag: string; error: unknown }> = [];
    if (floatingActionBarResult.status === PROMISE_REJECTED_STATUS) {
      failures.push({ flag: 'floatingActionBar', error: floatingActionBarResult.reason });
    }
    if (fabSubmitActionResult.status === PROMISE_REJECTED_STATUS) {
      failures.push({ flag: 'fabSubmitAction', error: fabSubmitActionResult.reason });
    }
    if (fabSearchActionResult.status === PROMISE_REJECTED_STATUS) {
      failures.push({ flag: 'fabSearchAction', error: fabSearchActionResult.reason });
    }
    if (fabScrollToTopResult.status === PROMISE_REJECTED_STATUS) {
      failures.push({ flag: 'fabScrollToTop', error: fabScrollToTopResult.reason });
    }
    if (fabNotificationsResult.status === PROMISE_REJECTED_STATUS) {
      failures.push({ flag: 'fabNotifications', error: fabNotificationsResult.reason });
    }
    if (notificationsProviderResult.status === PROMISE_REJECTED_STATUS) {
      failures.push({ flag: 'notificationsProvider', error: notificationsProviderResult.reason });
    }
    if (notificationsSheetResult.status === PROMISE_REJECTED_STATUS) {
      failures.push({ flag: 'notificationsSheet', error: notificationsSheetResult.reason });
    }
    if (notificationsToastsResult.status === PROMISE_REJECTED_STATUS) {
      failures.push({ flag: 'notificationsToasts', error: notificationsToastsResult.reason });
    }
    if (footerDelayResult.status === PROMISE_REJECTED_STATUS) {
      failures.push({ flag: 'footerDelay', error: footerDelayResult.reason });
    }
    if (ctaVariantResult.status === PROMISE_REJECTED_STATUS) {
      failures.push({ flag: 'ctaVariant', error: ctaVariantResult.reason });
    }

    if (failures.length > 0) {
      logger.warn('getLayoutFlags: some flags failed to load, using defaults', undefined, {
        requestId: generateRequestId(),
        operation: 'getLayoutFlags',
        failedFlags: failures.map((f) => f.flag).join(', '),
        failureCount: failures.length,
      });
    }

    // Compute derived flags (business logic)
    const notificationsEnabled = notificationsProviderFlag;
    const notificationsSheetEnabled = notificationsSheetFlag;
    const notificationsToastsEnabled = notificationsToastsFlag;
    const fabNotificationsEnabled = Boolean(fabNotifications && notificationsEnabled);

    return {
      useFloatingActionBar,
      fabSubmitAction,
      fabSearchAction,
      fabScrollToTop,
      fabNotifications,
      notificationsProvider: notificationsProviderFlag,
      notificationsSheet: notificationsSheetFlag,
      notificationsToasts: notificationsToastsFlag,
      footerDelayVariant,
      ctaVariant,
      notificationsEnabled,
      notificationsSheetEnabled,
      notificationsToastsEnabled,
      fabNotificationsEnabled,
    };
  } catch (error) {
    // Catastrophic failure - log and return all defaults
    const normalized = normalizeError(error, 'Failed to fetch layout feature flags');
    logger.error('getLayoutFlags: catastrophic failure, using all defaults', normalized, {
      requestId: generateRequestId(),
      operation: 'getLayoutFlags',
      source: 'layout-flags',
    });
    return DEFAULT_FLAGS;
  }
});
