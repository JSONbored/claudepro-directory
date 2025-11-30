'use client';

/**
 * GitHub Stars Button
 * Displays and links to GitHub repository with star count
 */

import { getSocialLinks, logClientWarning, logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { iconSize } from '@heyclaude/web-runtime/design-system';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import { Github } from '@heyclaude/web-runtime/icons';
import type { ButtonStyleProps } from '@heyclaude/web-runtime/types/component.types';
import { cn } from '@heyclaude/web-runtime/ui';
import { useEffect, useState } from 'react';
import { Button } from '@heyclaude/web-runtime/ui';

export interface GitHubStarsButtonProps extends ButtonStyleProps {
  repoUrl?: string;
}

const SOCIAL_LINK_SNAPSHOT = getSocialLinks();

/**
 * Render a button that links to a GitHub repository and displays its star count.
 *
 * The component fetches the repository's stargazers count for display, falls back to a default
 * repo if `repoUrl` cannot be parsed, and emits a pulse analytics event when clicked before
 * opening the repository in a new tab.
 *
 * @param repoUrl - URL of the GitHub repository to link to; defaults to the module snapshot value
 * @param size - Button size variant (e.g., `'sm'`); passed to the underlying Button component
 * @param variant - Visual variant for the Button component (e.g., `'ghost'`)
 * @param className - Additional class names to apply to the Button container
 * @param disabled - When true, disables the Button and prevents interaction
 *
 * @see getSocialLinks
 * @see usePulse
 * @see Button
 * @see Github
 */
export function GitHubStarsButton({
  repoUrl = SOCIAL_LINK_SNAPSHOT.github,
  size = 'sm',
  variant = 'ghost',
  className,
  disabled = false,
}: GitHubStarsButtonProps) {
  const pulse = usePulse();
  const [stars, setStars] = useState<number | null>(null);

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
        logClientWarning('GitHubStarsButton: failed to fetch star count', error, { apiUrl });
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
      <Github className={iconSize.sm} aria-hidden="true" />
      {typeof stars === 'number' && (
        <span className="font-medium tabular-nums">{stars.toLocaleString()}</span>
      )}
    </Button>
  );
}