'use client';

/**
 * Share Results Component
 * Modal for sharing recommendation results
 */

import { logger } from '@heyclaude/web-runtime/core';
import { Facebook, Linkedin, Mail, Share2, Twitter } from '@heyclaude/web-runtime/icons';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { SimpleCopyButton } from '@/src/components/core/buttons/shared/simple-copy-button';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/primitives/ui/dialog';
import { Input } from '@/src/components/primitives/ui/input';

interface ShareResultsProps {
  shareUrl: string;
  resultCount: number;
  onClose: () => void;
}

export function ShareResults({ shareUrl, resultCount, onClose }: ShareResultsProps) {
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Share2 className={UI_CLASSES.ICON_MD} />
            Share Your Results
          </DialogTitle>
          <DialogDescription>
            Share your personalized recommendations with your team or on social media
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Copy link */}
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Input
              readOnly={true}
              value={shareUrl}
              className="flex-1"
              onClick={(e) => e.currentTarget.select()}
            />
            <SimpleCopyButton
              content={shareUrl}
              successMessage="Link copied to clipboard!"
              errorMessage="Failed to copy link"
              variant="outline"
              size="icon"
              className="shrink-0"
              iconClassName={UI_CLASSES.ICON_SM}
              ariaLabel="Copy share link"
              onCopySuccess={() => {
                logger.info('Share link copied', { from: 'share-results-dialog' });
              }}
            />
          </div>

          {/* Social share buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" asChild={true} className="gap-2">
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  logger.info('Recommendation results shared', { platform: 'twitter' });
                }}
              >
                <Twitter className={UI_CLASSES.ICON_SM} />
                Twitter
              </a>
            </Button>

            <Button variant="outline" size="sm" asChild={true} className="gap-2">
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  logger.info('Recommendation results shared', { platform: 'linkedin' });
                }}
              >
                <Linkedin className={UI_CLASSES.ICON_SM} />
                LinkedIn
              </a>
            </Button>

            <Button variant="outline" size="sm" asChild={true} className="gap-2">
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  logger.info('Recommendation results shared', { platform: 'facebook' });
                }}
              >
                <Facebook className={UI_CLASSES.ICON_SM} />
                Facebook
              </a>
            </Button>

            <Button variant="outline" size="sm" asChild={true} className="gap-2">
              <a
                href={shareLinks.email}
                onClick={() => {
                  logger.info('Recommendation results shared', { platform: 'email' });
                }}
              >
                <Mail className={UI_CLASSES.ICON_SM} />
                Email
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
