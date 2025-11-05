/**
 * Email UTM Generator
 * Generates URL-encoded UTM query strings for email links
 *
 * Usage:
 * ```ts
 * import { generateEmailUTM } from '@/src/lib/utils/email-utm';
 * import { EMAIL_UTM_TEMPLATES } from '@/src/lib/utils/utm-templates';
 *
 * const utm = generateEmailUTM(EMAIL_UTM_TEMPLATES.WEEKLY_DIGEST);
 * // Returns: "utm_source=email&utm_medium=newsletter&utm_campaign=weekly_digest"
 *
 * const url = `https://claudepro.directory/agents?${utm}`;
 * ```
 *
 * @module lib/utils/email-utm
 */

import type { EmailUTMParams } from '@/src/lib/utils/utm-templates';

/**
 * Generate UTM query string from parameters
 *
 * Encodes parameters properly and omits undefined values.
 *
 * @param params - Email UTM parameters
 * @returns URL-encoded query string (without leading ?)
 *
 * @example
 * ```ts
 * const params = {
 *   source: 'email',
 *   medium: 'newsletter',
 *   campaign: 'weekly_digest',
 *   content: 'agent_spotlight',
 * };
 *
 * const utm = generateEmailUTM(params);
 * // "utm_source=email&utm_medium=newsletter&utm_campaign=weekly_digest&utm_content=agent_spotlight"
 * ```
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
 *
 * @param url - Base URL (can include existing query params)
 * @param params - Email UTM parameters
 * @returns Full URL with UTM parameters
 *
 * @example
 * ```ts
 * const url = addUTMToURL(
 *   'https://claudepro.directory/agents?sort=popular',
 *   EMAIL_UTM_TEMPLATES.WEEKLY_DIGEST
 * );
 * // "https://claudepro.directory/agents?sort=popular&utm_source=email&..."
 * ```
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
 *
 * @param href - Base URL
 * @param params - Email UTM parameters
 * @returns Object with href and UTM properties for React Email Link component
 *
 * @example
 * ```tsx
 * import { buildEmailLink } from '@/src/lib/utils/email-utm';
 * import { Link } from '@react-email/components';
 *
 * const linkProps = buildEmailLink(
 *   'https://claudepro.directory/agents',
 *   EMAIL_UTM_TEMPLATES.WEEKLY_DIGEST
 * );
 *
 * <Link {...linkProps}>View Agents</Link>
 * ```
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
