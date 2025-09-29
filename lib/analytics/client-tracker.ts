/**
 * Client-side analytics tracker
 * This file should ONLY be imported in client components ('use client')
 * NEVER import this in Edge Runtime or server components
 */

'use client';

/**
 * Track custom events with Umami
 * This is a client-only function that safely accesses window.umami
 */
export function trackEvent(
  eventName: string,
  data?: Record<string, string | number | boolean | null>
): void {
  // Only track if we're in the browser and Umami is loaded
  // biome-ignore lint/complexity/useOptionalChain: window may not exist in SSR
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(eventName, data);
  }
}

/**
 * Track page views
 */
export function trackPageView(url: string): void {
  // biome-ignore lint/complexity/useOptionalChain: window may not exist in SSR
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track('pageview', { url });
  }
}

/**
 * Common event tracking functions
 */
export const track = {
  // Content events
  copyCode: (category: string, slug: string) => {
    trackEvent('copy_code', { category, slug });
  },

  shareContent: (method: string, slug: string) => {
    trackEvent('share_content', { method, slug });
  },

  // Navigation events
  tabSwitch: (from: string, to: string) => {
    trackEvent('tab_switch', { from, to });
  },

  filterToggle: (name: string, enabled: boolean) => {
    trackEvent('filter_toggle', { name, enabled });
  },

  // User feedback
  feedback: (type: 'helpful' | 'not_helpful', page: string) => {
    trackEvent('feedback', { type, page });
  },
};
