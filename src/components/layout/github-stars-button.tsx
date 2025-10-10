'use client';

/**
 * GitHub Stars Button Component
 *
 * Shimmer button displaying GitHub repository stars count.
 * Client component wrapper for shimmer animation.
 *
 * @module components/layout/github-stars-button
 */

import { Github, Star } from 'lucide-react';
import { ShimmerButton } from '@/src/components/ui/magic/shimmer-button';
import { SOCIAL_LINKS } from '@/src/lib/constants';

interface GitHubStarsButtonProps {
  /**
   * Number of GitHub stars (null if unavailable)
   */
  stars: number | null;
}

/**
 * GitHubStarsButton Component
 *
 * Displays GitHub stars count with shimmer effect.
 * Falls back to generic text if stars count unavailable.
 *
 * @example
 * ```tsx
 * <GitHubStarsButton stars={42} />
 * ```
 */
export function GitHubStarsButton({ stars }: GitHubStarsButtonProps) {
  return (
    <ShimmerButton
      variant="ghost"
      size="sm"
      onClick={() => window.open(SOCIAL_LINKS.github, '_blank', 'noopener,noreferrer')}
      className="w-fit text-xs font-medium"
      shimmerDuration={4}
      aria-label={stars ? `Star us on GitHub - ${stars} stars` : 'Star us on GitHub'}
    >
      <Star className="h-3.5 w-3.5 fill-current" />
      {stars !== null ? (
        <>
          <span className="font-semibold">{stars.toLocaleString()}</span>
          <span className="text-muted-foreground">stars</span>
        </>
      ) : (
        <span>Star us on GitHub</span>
      )}
      <Github className="h-3.5 w-3.5" />
    </ShimmerButton>
  );
}
