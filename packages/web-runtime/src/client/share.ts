'use client';

/**
 * Social Share Utility - Viral Loop Attribution
 * Generates shareable URLs with UTM tracking
 * Integrates with react-share for social platforms
 */

import { logger } from '../logger.ts';
import { normalizeError } from '../errors.ts';

export type SharePlatform = 'twitter' | 'linkedin' | 'reddit' | 'facebook' | 'copy_link' | 'native';

export interface ShareOptions {
  /** Content URL to share */
  url: string;
  /** Share title */
  title: string;
  /** Share description */
  description?: string;
  /** Platform to share on */
  platform: SharePlatform;
  /** UTM source (default: 'code_screenshot') */
  utmSource?: string;
  /** UTM medium (default: 'social') */
  utmMedium?: string;
  /** UTM campaign (default: 'organic_sharing') */
  utmCampaign?: string;
  /** Category for tracking */
  category?: string;
  /** Slug for tracking */
  slug?: string;
}

/**
 * Generate shareable URL with UTM parameters
 * Creates viral attribution tracking for analytics
 */
export function generateShareUrl(options: ShareOptions): string {
  const {
    url,
    utmSource = 'code_screenshot',
    utmMedium = 'social',
    utmCampaign = 'organic_sharing',
    platform,
    category,
    slug,
  } = options;

  const shareUrl = new URL(url);

  // Add UTM parameters
  shareUrl.searchParams.set('utm_source', utmSource);
  shareUrl.searchParams.set('utm_medium', utmMedium);
  shareUrl.searchParams.set('utm_campaign', utmCampaign);
  shareUrl.searchParams.set('utm_content', platform);

  // Add content tracking
  if (category) {
    shareUrl.searchParams.set('category', category);
  }
  if (slug) {
    shareUrl.searchParams.set('slug', slug);
  }

  return shareUrl.toString();
}

/**
 * Generate pre-filled share text for social platforms
 */
export function generateShareText(options: ShareOptions): string {
  const { title, description, platform } = options;

  switch (platform) {
    case 'twitter':
      // Twitter optimized (280 char limit)
      return `${title} via @claudeprodirectory`;

    case 'linkedin':
      // LinkedIn optimized (more professional)
      return description
        ? `${title}\n\n${description}\n\nShared from claudepro.directory`
        : `${title}\n\nShared from claudepro.directory`;

    case 'reddit':
      // Reddit optimized (casual tone)
      return title;

    case 'facebook':
      // Facebook optimized
      return description ? `${title}\n\n${description}` : title;

    default:
      return title;
  }
}

/**
 * Share via Web Share API (native OS sharing)
 * Falls back to clipboard copy if not supported
 */
export async function shareNative(options: ShareOptions): Promise<boolean> {
  if (!navigator.share) {
    // Fallback to copy link
    return await copyShareLink(options);
  }

  try {
    await navigator.share({
      title: options.title,
      ...(options.description && { text: options.description }),
      url: generateShareUrl(options),
    });
    return true;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // User cancelled sharing
      return false;
    }
    const normalized = normalizeError(error, 'navigator.share failed');
    logger.warn('shareNative: navigator.share failed', {
      platform: options.platform,
      url: options.url,
      error: normalized.message,
    });
    // Fallback to copy link
    return await copyShareLink(options);
  }
}

/**
 * Copy share link to clipboard
 */
export async function copyShareLink(options: ShareOptions): Promise<boolean> {
  if (!navigator.clipboard) {
    return false;
  }

  try {
    const shareUrl = generateShareUrl(options);
    await navigator.clipboard.writeText(shareUrl);
    return true;
  } catch (error) {
    const normalized = normalizeError(error, 'copyShareLink failed');
    logger.warn('copyShareLink failed', {
      platform: options.platform,
      url: options.url,
      error: normalized.message,
    });
    return false;
  }
}

/**
 * Get share count from platform (placeholder - would need backend APIs)
 * Future enhancement: Track shares in database
 */
export async function getShareCount(
  _url: string,
  _platform: SharePlatform
): Promise<number | null> {
  // Placeholder for future share count tracking
  // Would integrate with platform APIs or database RPC
  return null;
}

