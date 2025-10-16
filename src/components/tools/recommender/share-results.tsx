'use client';

/**
 * Share Results Component
 * Modal for sharing recommendation results
 */

import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Check, Copy, Facebook, Linkedin, Mail, Share2, Twitter } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { toasts } from '@/src/lib/utils/toast.utils';

interface ShareResultsProps {
  shareUrl: string;
  resultCount: number;
  onClose: () => void;
}

export function ShareResults({ shareUrl, resultCount, onClose }: ShareResultsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toasts.success.linkCopied();
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      toasts.error.copyFailed('link');
    }
  };

  const shareText = `I just found ${resultCount} perfect Claude configurations for my needs! 🚀`;
  const encodedShareText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedShareText}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    email: `mailto:?subject=${encodeURIComponent('Check out my Claude config recommendations')}&body=${encodedShareText}%0A%0A${encodedUrl}`,
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Share2 className="h-5 w-5" />
            Share Your Results
          </DialogTitle>
          <DialogDescription>
            Share your personalized recommendations with your team or on social media
          </DialogDescription>
        </DialogHeader>

        <div className={UI_CLASSES.SPACE_Y_4}>
          {/* Copy link */}
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Input
              readOnly
              value={shareUrl}
              className="flex-1"
              onClick={(e) => e.currentTarget.select()}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {/* Social share buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  logger.info('Recommendation results shared', { platform: 'twitter' });
                }}
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </a>
            </Button>

            <Button variant="outline" size="sm" asChild className="gap-2">
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  logger.info('Recommendation results shared', { platform: 'linkedin' });
                }}
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </a>
            </Button>

            <Button variant="outline" size="sm" asChild className="gap-2">
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  logger.info('Recommendation results shared', { platform: 'facebook' });
                }}
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </a>
            </Button>

            <Button variant="outline" size="sm" asChild className="gap-2">
              <a
                href={shareLinks.email}
                onClick={() => {
                  logger.info('Recommendation results shared', { platform: 'email' });
                }}
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
