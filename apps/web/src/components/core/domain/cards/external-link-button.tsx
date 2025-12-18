'use client';

/**
 * ExternalLinkButton - Reusable external link button component
 * Extracted from UserProfileCard to eliminate duplication
 */

import { logUnhandledPromise, getSafeExternalUrl } from '@heyclaude/web-runtime/core';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import { ExternalLink } from '@heyclaude/web-runtime/icons';
import { Button } from '@heyclaude/web-runtime/ui';

interface ExternalLinkButtonProps {
  url: string | null | undefined;
  linkType: 'website' | 'social';
  ariaLabel: string;
  userSlug: string;
}

export function ExternalLinkButton({
  url,
  linkType,
  ariaLabel,
  userSlug,
}: ExternalLinkButtonProps) {
  const pulse = usePulse();
  const safeUrl = getSafeExternalUrl(url);

  if (!safeUrl) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex items-center justify-center h-4 w-4 rounded-md hover:bg-accent/10"
      onClick={(e) => {
        e.stopPropagation();
        pulse
          .click({
            category: null,
            slug: null,
            metadata: {
              action: 'external_link',
              link_type: linkType,
              target_url: safeUrl,
              user_slug: userSlug,
            },
          })
          .catch((error) => {
            logUnhandledPromise(
              `UserProfileCard: ${linkType} link click pulse failed`,
              error,
              {
                user_slug: userSlug,
              }
            );
          });
        window.open(safeUrl, '_blank');
      }}
      aria-label={ariaLabel}
    >
      <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </Button>
  );
}
