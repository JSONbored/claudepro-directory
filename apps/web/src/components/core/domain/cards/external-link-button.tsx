'use client';

/**
 * ExternalLinkButton - Reusable external link button component
 * Extracted from UserProfileCard to eliminate duplication
 */

import { logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import { ExternalLink } from '@heyclaude/web-runtime/icons';
import { UI_CLASSES, Button } from '@heyclaude/web-runtime/ui';

import { getSafeExternalUrl } from './user-profile-card';

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
      className={`${UI_CLASSES.ICON_BUTTON_SM} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
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
      <ExternalLink className={UI_CLASSES.ICON_XS} aria-hidden="true" />
    </Button>
  );
}
