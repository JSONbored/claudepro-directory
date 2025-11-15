'use client';

/**
 * GitHub Stars Button
 * Displays and links to GitHub repository with star count
 */

import { useEffect, useState } from 'react';
import { Button } from '@/src/components/primitives/ui/button';
import { SOCIAL_LINKS } from '@/src/lib/data/config/constants';
import { Github } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { logClientWarning } from '@/src/lib/utils/error.utils';
import type { ButtonStyleProps } from '../shared/button-types';

export interface GitHubStarsButtonProps extends ButtonStyleProps {
  repoUrl?: string;
}

export function GitHubStarsButton({
  repoUrl = SOCIAL_LINKS.github,
  size = 'sm',
  variant = 'ghost',
  className,
  disabled = false,
}: GitHubStarsButtonProps) {
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
