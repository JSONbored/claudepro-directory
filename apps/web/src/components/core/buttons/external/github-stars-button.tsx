'use client';

/**
 * GitHub Stars Button
 * Displays and links to GitHub repository with star count
 */

import { getSocialLinks, logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import { Github } from '@heyclaude/web-runtime/icons';
import { type ButtonStyleProps } from '@heyclaude/web-runtime/types/component.types';
import { cn, UI_CLASSES, Button } from '@heyclaude/web-runtime/ui';
import { useEffect, useState } from 'react';

export interface GitHubStarsButtonProps extends ButtonStyleProps {
  repoUrl?: string;
}

const SOCIAL_LINK_SNAPSHOT = getSocialLinks();

export function GitHubStarsButton({
  repoUrl = SOCIAL_LINK_SNAPSHOT.github,
  size = 'sm',
  variant = 'ghost',
  className,
  disabled = false,
}: GitHubStarsButtonProps) {
  const pulse = usePulse();
  const [stars, setStars] = useState<null | number>(null);

  useEffect(() => {
    const apiUrl = (() => {
      try {
        const { pathname, hostname } = new URL(repoUrl);
        if (hostname === 'github.com') {
          const [, owner, repo] = pathname.split('/');
          if (owner && repo) {
            return `https://api.github.com/repos/${owner}/${repo}`;
          }
        }
      } catch {
        // Fall back to default repo
      }
      return 'https://api.github.com/repos/JSONbored/claudepro-directory';
    })();

    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        const count =
          data && typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
        setStars(count);
      })
      .catch((error) => {
        const normalized = normalizeError(error, 'Failed to fetch GitHub star count');
        logClientWarn(
          '[GitHub] Failed to fetch star count',
          normalized,
          'GitHubStarsButton.fetchStars',
          {
            component: 'GitHubStarsButton',
            action: 'fetch-star-count',
            category: 'external-api',
            apiUrl,
          }
        );
        setStars(null);
      });
  }, [repoUrl]);

  const handleClick = () => {
    pulse
      .click({
        category: null,
        slug: null,
        metadata: {
          action: 'external_link',
          link_type: 'github',
          target_url: repoUrl,
        },
      })
      .catch((error) => {
        logUnhandledPromise('GitHubStarsButton: click pulse failed', error, { repoUrl });
      });
    window.open(repoUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      className={cn('gap-2', className)}
      aria-label={`Star us on GitHub${stars ? ` - ${stars} stars` : ''}`}
    >
      <Github className={UI_CLASSES.ICON_SM} aria-hidden="true" />
      {typeof stars === 'number' && (
        <span className="font-medium tabular-nums">{stars.toLocaleString()}</span>
      )}
    </Button>
  );
}
