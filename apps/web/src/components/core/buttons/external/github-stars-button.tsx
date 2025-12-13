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

/**
 * Renders a GitHub-styled button that opens the given repository URL, tracks click events, and optionally displays the repository's star count.
 *
 * The component fetches the repository's stargazer count from the GitHub API and shows it next to the GitHub icon when available. If the repo URL cannot be parsed or the fetch fails, the star count is omitted and a client warning is logged.
 *
 * @param repoUrl - Repository URL to open (defaults to project's configured GitHub link)
 * @param size - Button size variant: 'default' | 'sm' | 'lg' | 'icon'
 * @param variant - Button visual variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
 * @param className - Additional CSS class names applied to the button
 * @param disabled - Whether the button is disabled
 *
 * @returns The rendered button element with GitHub icon and optional star count.
 *
 * @see usePulse
 * @see getSocialLinks
 */
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
      .then(async (res) => {
        // Handle 403 (rate limit or access issue) gracefully - don't log as error
        if (res.status === 403) {
          // Silently handle 403 - it's expected (rate limiting, private repo, etc.)
          return null;
        }
        
        // Check if response is ok before parsing JSON
        if (!res.ok) {
          throw new Error(`GitHub API returned ${res.status}: ${res.statusText}`);
        }
        
        return res.json();
      })
      .then((data) => {
        // Skip if API failed (403 or other error)
        if (!data) {
          return;
        }
        
        const count =
          data && typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
        setStars(count);
      })
      .catch((error) => {
        // Only log unexpected errors (not 403)
        if (error.message.includes('403')) {
          // Silently handle 403 - already handled above
          setStars(null);
          return;
        }
        
        // Log other errors
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

  // Format star count: show "1.2k" for numbers > 999, otherwise full number with commas
  const formattedStars = typeof stars === 'number' 
    ? (stars > 999 ? `${(stars / 1000).toFixed(1)}k` : stars.toLocaleString())
    : null;

  return (
    <Button
      variant={variant}
      size={size === 'icon' ? 'icon' : size}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        // Match "More" dropdown design: icon-only with absolute badge overlay
        size === 'icon' ? 'h-8 w-8 relative' : 'gap-2',
        className
      )}
      aria-label={`Star us on GitHub${stars !== null ? ` - ${stars} stars` : ''}`}
    >
      <Github className={size === 'icon' ? 'h-4 w-4' : UI_CLASSES.ICON_SM} aria-hidden="true" />
      {formattedStars !== null && (
        <span 
          className={cn(
            // Match "More" dropdown: absolute badge overlay in top-right corner
            size === 'icon' 
              ? 'absolute -top-1 -right-1 text-[10px] font-medium text-accent'
              : 'font-medium tabular-nums'
          )}
        >
          {formattedStars}
        </span>
      )}
    </Button>
  );
}