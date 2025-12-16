'use client';

/**
 * Share Results Component
 * Modal for sharing recommendation results
 */

import { Facebook, Linkedin, Mail, Share2, Twitter } from '@heyclaude/web-runtime/icons';
import { logClientInfo } from '@heyclaude/web-runtime/logging/client';
import {
  SimpleCopyButton,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
} from '@heyclaude/web-runtime/ui';
import { cluster, iconSize, spaceY, gap } from "@heyclaude/web-runtime/design-system";

interface ShareResultsProps {
  onClose: () => void;
  resultCount: number;
  shareUrl: string;
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
    <Dialog open onOpenChange={onClose}>
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

        <div className={`${spaceY.comfortable}`}>
          {/* Copy link */}
          <div className={cluster.compact}>
            <Input
              readOnly
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
                logClientInfo(
                  'Share link copied',
                  'ShareResults.copyLink',
                  {
                    component: 'ShareResults',
                    action: 'copy-link',
                    from: 'share-results-dialog',
                  }
                );
              }}
            />
          </div>

          {/* Social share buttons */}
          <div className={`grid grid-cols-2 ${gap.compact}`}>
            <Button variant="outline" size="sm" asChild className={`${gap.tight}`}>
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  logClientInfo(
                    'Recommendation results shared',
                    'ShareResults.share',
                    {
                      component: 'ShareResults',
                      action: 'share',
                      platform: 'twitter',
                    }
                  );
                }}
              >
                <Twitter className={iconSize.sm} />
                Twitter
              </a>
            </Button>

            <Button variant="outline" size="sm" asChild className={`${gap.tight}`}>
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  logClientInfo(
                    'Recommendation results shared',
                    'ShareResults.share',
                    {
                      component: 'ShareResults',
                      action: 'share',
                      platform: 'linkedin',
                    }
                  );
                }}
              >
                <Linkedin className={iconSize.sm} />
                LinkedIn
              </a>
            </Button>

            <Button variant="outline" size="sm" asChild className={`${gap.tight}`}>
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  logClientInfo(
                    'Recommendation results shared',
                    'ShareResults.share',
                    {
                      component: 'ShareResults',
                      action: 'share',
                      platform: 'facebook',
                    }
                  );
                }}
              >
                <Facebook className={iconSize.sm} />
                Facebook
              </a>
            </Button>

            <Button variant="outline" size="sm" asChild className={`${gap.tight}`}>
              <a
                href={shareLinks.email}
                onClick={() => {
                  logClientInfo(
                    'Recommendation results shared',
                    'ShareResults.share',
                    {
                      component: 'ShareResults',
                      action: 'share',
                      platform: 'email',
                    }
                  );
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
