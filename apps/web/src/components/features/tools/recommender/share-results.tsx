'use client';

/**
 * Share Results Component
 * Modal for sharing recommendation results
 */

import { logger } from '@heyclaude/web-runtime/core';
import { Facebook, Linkedin, Mail, Share2, Twitter } from '@heyclaude/web-runtime/icons';
import { cluster, iconSize } from '@heyclaude/web-runtime/design-system';
import { SimpleCopyButton } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@heyclaude/web-runtime/ui';
import { Input } from '@heyclaude/web-runtime/ui';

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
          <DialogTitle className={cluster.compact}>
            <Share2 className={iconSize.md} />
            Share Your Results
          </DialogTitle>
          <DialogDescription>
            Share your personalized recommendations with your team or on social media
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Copy link */}
          <div className={cluster.compact}>
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
              iconClassName={iconSize.sm}
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
                <Twitter className={iconSize.sm} />
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
                <Linkedin className={iconSize.sm} />
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
                <Facebook className={iconSize.sm} />
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
                <Mail className={iconSize.sm} />
                Email
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
