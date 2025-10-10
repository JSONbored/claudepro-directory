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
import { ShimmerButton } from '@/src/components/ui/magic/shimmer-button';
import { SOCIAL_LINKS } from '@/src/lib/constants';
import { Github, Star } from '@/src/lib/icons';

interface GitHubStarsButtonProps {
  className?: string;
}

export function GitHubStarsButton({ className }: GitHubStarsButtonProps) {
  const [stars, setStars] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract owner/repo from GitHub URL
    const match = SOCIAL_LINKS.github.match(/github\.com\/([^/]+\/[^/]+)/);
    if (!match) return;

    const repo = match[1];

    // Fetch GitHub stars with caching
    const fetchStars = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${repo}`, {
          next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) throw new Error('Failed to fetch stars');

        const data = await response.json();
        setStars(data.stargazers_count);
      } catch {
        // Fail silently - button still works without star count
      } finally {
        setLoading(false);
      }
    };

    fetchStars().catch(() => {
      // Error already handled in try-catch
    });
  }, []);

  const handleClick = () => {
    window.open(SOCIAL_LINKS.github, '_blank', 'noopener,noreferrer');
  };

  return (
    <ShimmerButton
      onClick={handleClick}
      className={className}
      shimmerSpeed="normal"
      background="var(--color-accent)"
      aria-label={`Star us on GitHub${stars ? ` - ${stars} stars` : ''}`}
    >
      <Github className="h-4 w-4" aria-hidden="true" />
      <span className="font-medium">Star on GitHub</span>
      {!loading && stars !== null && (
        <>
          <span className="mx-1 opacity-50" aria-hidden="true">
            |
          </span>
          <Star className="h-3 w-3" aria-hidden="true" />
          <span className="font-semibold">{stars.toLocaleString()}</span>
        </>
      )}
    </ShimmerButton>
  );
}
