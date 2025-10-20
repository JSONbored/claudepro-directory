'use client';

/**
 * ViewCountBadge - Client-side view count display
 * 
 * OPTIMIZATION: Fetches view counts from cached API instead of server-side enrichment
 * Part of optimization to remove Redis calls from ISR page rebuilds
 * 
 * Features:
 * - Progressive enhancement (loads after page)
 * - Graceful fallback on error
 * - No layout shift (placeholder shown)
 * - Batched fetching via context provider
 */

import { useEffect, useState } from 'react';
import { Eye } from '@/src/lib/icons';

interface ViewCountBadgeProps {
  category: string;
  slug: string;
  className?: string;
}

export function ViewCountBadge({ category, slug, className = '' }: ViewCountBadgeProps) {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchViewCount() {
      try {
        const response = await fetch('/api/stats/view-counts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{ category, slug }],
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch view count');
        }

        const data = await response.json();
        const key = `${category}:${slug}`;
        setCount(data.counts[key] || 0);
      } catch {
        // Silent failure - show fallback
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    }

    fetchViewCount();
  }, [category, slug]);

  if (isLoading) {
    return (
      <span className={`inline-flex items-center gap-1 text-sm text-muted-foreground ${className}`}>
        <Eye className="h-3.5 w-3.5" />
        <span className="animate-pulse">...</span>
      </span>
    );
  }

  if (count === null) {
    return null; // Error state - hide badge
  }

  return (
    <span className={`inline-flex items-center gap-1 text-sm text-muted-foreground ${className}`}>
      <Eye className="h-3.5 w-3.5" />
      <span>{count.toLocaleString()}</span>
    </span>
  );
}
