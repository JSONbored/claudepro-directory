/**
 * Email UTM Generator
 * Generates URL-encoded UTM query strings for email links
 *
 * @module supabase/functions/_shared/utils/email-utm
 */

import type { EmailUTMParams } from './utm-templates.ts';

/**
 * Generate UTM query string from parameters
 *
 * Encodes parameters properly and omits undefined values.
 */
export function generateEmailUTM(params: EmailUTMParams): string {
  const utmParams: Array<[string, string]> = [
    ['utm_source', params.source],
    ['utm_medium', params.medium],
    ['utm_campaign', params.campaign],
  ];

  // Add optional parameters if present
  if (params.content) {
    utmParams.push(['utm_content', params.content]);
  }

  if (params.term) {
    utmParams.push(['utm_term', params.term]);
  }

  // Build query string
  return utmParams.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
}

/**
 * Add UTM parameters to a URL
 *
 * Preserves existing query parameters and appends UTM params.
 */
export function addUTMToURL(url: string, params: EmailUTMParams): string {
  const utm = generateEmailUTM(params);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${utm}`;
}

/**
 * Build email link with UTM tracking
 *
 * Convenience function for React Email templates.
 */
export function buildEmailLink(
  href: string,
  params: EmailUTMParams
): {
  href: string;
  'data-utm-source': string;
  'data-utm-medium': string;
  'data-utm-campaign': string;
} {
  return {
    href: addUTMToURL(href, params),
    'data-utm-source': params.source,
    'data-utm-medium': params.medium,
    'data-utm-campaign': params.campaign,
  };
}
