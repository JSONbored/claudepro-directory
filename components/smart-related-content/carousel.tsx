'use client';

import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  trackCarouselNavigation,
  trackRelatedContentClick,
  trackRelatedContentView,
} from '@/lib/analytics/events/related-content';
import type { RelatedCarouselClientProps, RelatedContentItem } from '@/lib/related-content/types';

export function RelatedCarouselClient({
  items,
  performance,
  trackingEnabled = true,
  className = '',
  showTitle = true,
  title = 'Related Content',
}: RelatedCarouselClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track view when component comes into viewport
  useEffect(() => {
    if (!trackingEnabled || hasTrackedView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          trackRelatedContentView(window.location.pathname, items.length, performance.cacheHit);
          setHasTrackedView(true);
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [trackingEnabled, hasTrackedView, items.length, performance.cacheHit]);

  // Handle carousel navigation
  const handleNavigation = (direction: 'next' | 'previous') => {
    const newIndex =
      direction === 'next'
        ? Math.min(currentIndex + 1, Math.max(0, items.length - 3))
        : Math.max(currentIndex - 1, 0);

    setCurrentIndex(newIndex);

    if (trackingEnabled) {
      trackCarouselNavigation(direction, newIndex, items.length);
    }
  };

  // Handle item click
  const handleItemClick = (item: RelatedContentItem, index: number) => {
    if (!trackingEnabled) return;

    // Track click event
    trackRelatedContentClick(window.location.pathname, item.url, index + 1, item.score);
  };

  // Get match type badge color
  const getMatchTypeBadge = (matchType: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> =
      {
        same_category: { label: 'Related', variant: 'default' },
        tag_match: { label: 'Similar Topics', variant: 'secondary' },
        keyword_match: { label: 'Keywords Match', variant: 'secondary' },
        trending: { label: 'Trending', variant: 'default' },
        popular: { label: 'Popular', variant: 'default' },
        cross_category: { label: 'Recommended', variant: 'outline' },
      };

    return badges[matchType] || { label: 'Related', variant: 'outline' };
  };

  // Get category badge color
  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      agents: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      mcp: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      rules: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      commands: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      hooks: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      tutorials: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      comparisons: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      workflows: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'use-cases': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      troubleshooting: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };

    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  if (items.length === 0) return null;

  return (
    <section ref={containerRef} className={`mt-12 space-y-6 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">{title}</h2>
            <Badge variant="outline" className="border-primary/20 bg-primary/5">
              AI Recommended
            </Badge>
          </div>
          {items.length > 3 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleNavigation('previous')}
                disabled={currentIndex === 0}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleNavigation('next')}
                disabled={currentIndex >= items.length - 3}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next</span>
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out gap-4"
          style={{
            transform: `translateX(-${currentIndex * 33.333}%)`,
          }}
        >
          {items.map((item, index) => {
            const matchBadge = getMatchTypeBadge(item.matchType);

            return (
              <div
                key={`${item.category}-${item.slug}`}
                className="min-w-[calc(33.333%-1rem)] lg:min-w-[calc(33.333%-1rem)] md:min-w-[calc(50%-0.5rem)] sm:min-w-full"
              >
                <Link
                  href={item.url}
                  onClick={() => handleItemClick(item, index)}
                  className="block h-full"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow duration-200 hover:border-primary/50">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={getCategoryBadge(item.category)}>{item.category}</Badge>
                        <Badge variant={matchBadge.variant}>{matchBadge.label}</Badge>
                      </div>
                      <CardTitle className="line-clamp-2 text-lg">{item.title}</CardTitle>
                      <CardDescription className="line-clamp-3">{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {item.matchDetails && (
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {item.matchDetails.matchedTags &&
                            item.matchDetails.matchedTags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.matchDetails.matchedTags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          {item.matchDetails.viewCount && item.matchDetails.viewCount > 100 && (
                            <p className="text-xs">
                              {item.matchDetails.viewCount.toLocaleString()} views
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground">
          Performance: {performance.fetchTime}ms | Cache: {performance.cacheHit ? 'Hit' : 'Miss'} |
          Algorithm: {performance.algorithmVersion}
        </div>
      )}
    </section>
  );
}
