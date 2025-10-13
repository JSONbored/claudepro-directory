'use client';

/**
 * GitHub Stars Button Component
 * Displays live star count with shimmer effect
 *
 * Features:
 * - Fetches live GitHub stars count
 * - Cached response (SWR pattern)
 * - Shimmer button animation
 * - Accessible with proper ARIA labels
 *
 * @module components/layout/github-stars-button
 */

import { useEffect, useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { SOCIAL_LINKS } from '@/src/lib/constants';
import { Github } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';

interface GitHubStarsButtonProps {
  className?: string;
}

export function GitHubStarsButton({ className }: GitHubStarsButtonProps) {
  const [stars, setStars] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // Extract owner/repo from GitHub URL
    const match = SOCIAL_LINKS.github.match(/github\.com\/([^/]+\/[^/]+)/);
    if (!match?.[1]) {
      setLoading(false);
      return;
    }

    const repo: string = match[1];

    // Fetch GitHub stars with caching
    const fetchStars = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${repo}`, {
          next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
          throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Validate response data
        if (typeof data.stargazers_count !== 'number') {
          throw new Error('Invalid response: missing stargazers_count');
        }

        setStars(data.stargazers_count);
        setError(false);
      } catch (err) {
        // Log error for debugging
        logger.error(
          'Failed to fetch GitHub stars',
          err instanceof Error ? err : new Error(String(err)),
          {
            repo,
            source: 'GitHubStarsButton',
          }
        );

        // Set error state for user feedback
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStars().catch((err) => {
      // Additional catch to prevent unhandled promise rejection
      logger.error(
        'Unhandled error in fetchStars',
        err instanceof Error ? err : new Error(String(err))
      );
    });
  }, []);

  const handleClick = () => {
    window.open(SOCIAL_LINKS.github, '_blank', 'noopener,noreferrer');
  };

  // Build button props dynamically to avoid type issues
  const buttonProps = {
    variant: 'outline' as const,
    size: 'sm' as const,
    onClick: handleClick,
    className: `gap-2 ${className}`,
    'aria-label': `Star us on GitHub${stars ? ` - ${stars} stars` : ''}${error ? ' (star count unavailable)' : ''}`,
    ...(error && { title: 'Star count temporarily unavailable. Click to visit GitHub.' }),
  };

  return (
    <Button {...buttonProps}>
      <Github className="h-4 w-4" aria-hidden="true" />
      {!loading && stars !== null && !error && (
        <span className="font-medium tabular-nums">{stars.toLocaleString()}</span>
      )}
    </Button>
  );
}
