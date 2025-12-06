'use client';

/**
 * ShareMenu - Social sharing dropdown with multiple platform options
 *
 * Features:
 * - Twitter/X with pre-filled tweet text
 * - LinkedIn sharing
 * - Copy link with toast feedback
 * - Native share sheet fallback (mobile)
 * - UTM tracking parameters
 */

import { type SharePlatform } from '@heyclaude/web-runtime/core';
import { useCopyToClipboard } from '@heyclaude/web-runtime/hooks';
import { ChevronDown, Copy, Linkedin, Mail, Share2, Twitter } from '@heyclaude/web-runtime/icons';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toasts,
} from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';

interface ShareMenuProps {
  /** Optional description for email/social */
  description?: string;
  /** Custom trigger label */
  label?: string;
  /** Optional callback when share completes */
  onShare?: (platform: SharePlatform) => void;
  /** Show dropdown chevron */
  showChevron?: boolean;
  /** Title/headline for the share */
  title: string;
  /** URL to share */
  url: string;
  /** UTM campaign name */
  utmCampaign?: string;
  /** Button variant */
  variant?: 'default' | 'ghost' | 'outline';
}

/**
 * Build URL with UTM parameters
 */
function buildShareUrl(baseUrl: string, source: string, campaign = 'content'): string {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', source);
  url.searchParams.set('utm_medium', 'share');
  url.searchParams.set('utm_campaign', campaign);
  return url.toString();
}

export function ShareMenu({
  url,
  title,
  description,
  utmCampaign = 'content',
  onShare,
  variant = 'outline',
  showChevron = true,
  label = 'Share',
}: ShareMenuProps) {
  const { copy: copyToClipboard } = useCopyToClipboard();

  // Platform share handlers
  const shareToTwitter = () => {
    const shareUrl = buildShareUrl(url, 'twitter', utmCampaign);
    const text = description ? `${title}\n\n${description}` : title;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
    onShare?.('twitter');
  };

  const shareToLinkedIn = () => {
    const shareUrl = buildShareUrl(url, 'linkedin', utmCampaign);
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
    onShare?.('linkedin');
  };

  const shareViaEmail = () => {
    const shareUrl = buildShareUrl(url, 'email', utmCampaign);
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(
      description ? `${description}\n\n${shareUrl}` : `Check this out: ${shareUrl}`
    );
    globalThis.location.href = `mailto:?subject=${subject}&body=${body}`;
    // Email is not a tracked SharePlatform, skip analytics
  };

  const copyLink = async () => {
    const shareUrl = buildShareUrl(url, 'copy_link', utmCampaign);
    await copyToClipboard(shareUrl);
    toasts.raw.success('Link copied!', {
      description: 'Paste anywhere to share.',
    });
    onShare?.('copy_link');
  };

  const handleNativeShare = async () => {
    const shareUrl = buildShareUrl(url, 'native', utmCampaign);
    try {
      const shareData: ShareData = {
        title,
        url: shareUrl,
      };
      // Only add text if defined (exactOptionalPropertyTypes compliance)
      if (description) {
        shareData.text = description;
      }
      await navigator.share(shareData);
      toasts.raw.success('Shared!', {
        description: 'Link sent via the share sheet.',
      });
      onShare?.('native');
    } catch (error) {
      // User cancelled or share failed - copy as fallback
      if (error instanceof DOMException && error.name === 'AbortError') {
        return; // User cancelled
      }
      await copyLink();
    }
  };

  // Check if native share is available
  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button variant={variant} className="min-w-0 gap-2">
            <Share2 className="h-4 w-4" />
            <span>{label}</span>
            {showChevron ? <ChevronDown className="h-3 w-3 opacity-50" /> : null}
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Social platforms */}
        <DropdownMenuItem onClick={shareToTwitter} className="gap-2">
          <Twitter className="h-4 w-4" />
          <span>Share on X</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToLinkedIn} className="gap-2">
          <Linkedin className="h-4 w-4" />
          <span>Share on LinkedIn</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareViaEmail} className="gap-2">
          <Mail className="h-4 w-4" />
          <span>Share via Email</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Copy link */}
        <DropdownMenuItem onClick={copyLink} className="gap-2">
          <Copy className="h-4 w-4" />
          <span>Copy Link</span>
        </DropdownMenuItem>

        {/* Native share (mobile) */}
        {hasNativeShare ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleNativeShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              <span>More options...</span>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
