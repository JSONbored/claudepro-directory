/**
 * usePulse Hook - Programmatic Tracking
 *
 * Provides programmatic tracking methods for all interaction types.
 * Wraps trackInteraction(), trackUsage(), and trackNewsletterEvent() from edge/client.
 *
 * Usage:
 * ```tsx
 * const pulse = usePulse();
 *
 * // Copy action
 * pulse.copy({ category: 'agent', slug: 'my-agent' });
 *
 * // Download action
 * pulse.download({ category: 'agent', slug: 'my-agent', action_type: 'download_zip' });
 *
 * // Share action
 * pulse.share({ platform: 'twitter', category: 'agent', slug: 'my-agent', url: '...' });
 * ```
 *
 * All methods are fire-and-forget (non-blocking) and use queue-based tracking.
 *
 * @module hooks/use-pulse
 */

import { useMemo } from 'react';
import {
  type NewsletterEventType,
  trackInteraction,
  trackNewsletterEvent,
  trackUsage,
} from '@/src/lib/edge/client';
import type { SharePlatform } from '@/src/lib/utils/share.utils';
import type { Database, Json } from '@/src/types/database.types';

/**
 * Parameters for copy tracking
 */
export interface PulseCopyParams {
  category: Database['public']['Enums']['content_category'];
  slug: string;
  metadata?: Record<string, unknown> | null;
}

/**
 * Parameters for click tracking
 */
export interface PulseClickParams {
  category: Database['public']['Enums']['content_category'] | null;
  slug: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Parameters for share tracking
 */
export interface PulseShareParams {
  platform: SharePlatform;
  category?: string;
  slug?: string;
  url: string;
}

/**
 * Parameters for screenshot tracking
 */
export interface PulseScreenshotParams {
  category: Database['public']['Enums']['content_category'];
  slug: string;
  metadata?: Record<string, unknown> | null;
}

/**
 * Parameters for download tracking
 */
export interface PulseDownloadParams {
  category: Database['public']['Enums']['content_category'];
  slug: string;
  action_type?: 'download_zip' | 'download_markdown' | 'llmstxt' | 'download_mcpb';
}

/**
 * Parameters for bookmark tracking
 */
export interface PulseBookmarkParams {
  category: Database['public']['Enums']['content_category'];
  slug: string;
  action: 'add' | 'remove';
}

/**
 * Parameters for filter tracking
 */
export interface PulseFilterParams {
  category: string;
  filters: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
}

/**
 * Parameters for search tracking
 */
export interface PulseSearchParams {
  category: Database['public']['Enums']['content_category'];
  slug: string;
  query: string;
  metadata?: Record<string, unknown> | null;
}

/**
 * Parameters for newsletter tracking
 */
export interface PulseNewsletterParams {
  event: NewsletterEventType | 'subscribe';
  metadata?: Record<string, unknown>;
}

/**
 * Parameters for view tracking
 */
export interface PulseViewParams {
  category: Database['public']['Enums']['content_category'];
  slug: string;
  metadata?: Record<string, unknown> | null;
}

/**
 * Pulse hook return type
 */
export interface UsePulseReturn {
  /**
   * Track content view
   */
  view: (params: PulseViewParams) => Promise<void>;

  /**
   * Track copy action
   */
  copy: (params: PulseCopyParams) => Promise<void>;

  /**
   * Track click action
   */
  click: (params: PulseClickParams) => Promise<void>;

  /**
   * Track share action
   */
  share: (params: PulseShareParams) => Promise<void>;

  /**
   * Track screenshot action
   */
  screenshot: (params: PulseScreenshotParams) => Promise<void>;

  /**
   * Track download action
   */
  download: (params: PulseDownloadParams) => Promise<void>;

  /**
   * Track bookmark action (add/remove)
   */
  bookmark: (params: PulseBookmarkParams) => Promise<void>;

  /**
   * Track filter application
   */
  filter: (params: PulseFilterParams) => Promise<void>;

  /**
   * Track search interaction
   */
  search: (params: PulseSearchParams) => Promise<void>;

  /**
   * Track newsletter events
   */
  newsletter: (params: PulseNewsletterParams) => Promise<void>;
}

/**
 * usePulse hook - provides programmatic tracking methods
 *
 * All methods are memoized to prevent unnecessary re-renders.
 * Methods return promises but are fire-and-forget (non-blocking).
 */
export function usePulse(): UsePulseReturn {
  return useMemo(
    () => ({
      /**
       * Track content view
       */
      view: async ({ category, slug, metadata }) => {
        await trackInteraction({
          interaction_type: 'view',
          content_type: category,
          content_slug: slug,
          metadata: metadata as Json | null,
        });
      },

      /**
       * Track copy action
       */
      copy: async ({ category, slug, metadata }) => {
        await trackInteraction({
          interaction_type: 'copy',
          content_type: category,
          content_slug: slug,
          metadata: metadata as Json | null,
        });
      },

      /**
       * Track click action
       */
      click: async ({ category, slug, metadata }) => {
        await trackInteraction({
          interaction_type: 'click',
          content_type: category,
          content_slug: slug,
          metadata: metadata as Json | null,
        });
      },

      /**
       * Track share action
       */
      share: async ({ platform, category, slug, url }) => {
        await trackInteraction({
          interaction_type: 'share',
          content_type: category || 'unknown',
          content_slug: slug || 'unknown',
          metadata: {
            platform,
            url,
          } as Json,
        });
      },

      /**
       * Track screenshot action
       */
      screenshot: async ({ category, slug, metadata }) => {
        await trackInteraction({
          interaction_type: 'screenshot',
          content_type: category,
          content_slug: slug,
          metadata: metadata as Json | null,
        });
      },

      /**
       * Track download action
       * Maps to trackUsage() for download_zip/download_markdown/llmstxt/download_mcpb
       * or trackInteraction() for generic download
       */
      download: async ({ category, slug, action_type = 'download_zip' }) => {
        if (
          action_type === 'download_zip' ||
          action_type === 'download_markdown' ||
          action_type === 'llmstxt' ||
          action_type === 'download_mcpb'
        ) {
          await trackUsage({
            content_type: category,
            content_slug: slug,
            action_type,
          });
        } else {
          // Generic download tracking
          await trackInteraction({
            interaction_type: 'download',
            content_type: category,
            content_slug: slug,
          });
        }
      },

      /**
       * Track bookmark action (add/remove)
       */
      bookmark: async ({ category, slug, action }) => {
        await trackInteraction({
          interaction_type: 'bookmark',
          content_type: category,
          content_slug: slug,
          metadata: {
            action, // 'add' or 'remove'
          } as Json,
        });
      },

      /**
       * Track filter application
       */
      filter: async ({ category, filters, metadata }) => {
        await trackInteraction({
          interaction_type: 'filter',
          content_type: category,
          content_slug: null,
          metadata: {
            filters,
            ...metadata,
          } as Json,
        });
      },

      /**
       * Track search interaction
       */
      search: async ({ category, slug, query, metadata }) => {
        await trackInteraction({
          interaction_type: 'search',
          content_type: category,
          content_slug: slug,
          metadata: {
            query,
            ...metadata,
          } as Json,
        });
      },

      /**
       * Track newsletter events
       * Handles both newsletter_subscribe (via trackInteraction) and newsletter events (via trackNewsletterEvent)
       */
      newsletter: async ({ event, metadata }) => {
        if (event === 'subscribe') {
          await trackInteraction({
            interaction_type: 'newsletter_subscribe',
            content_type: null,
            content_slug: null,
            metadata: metadata as Json | null,
          });
        } else {
          await trackNewsletterEvent(event, metadata);
        }
      },
    }),
    []
  );
}
