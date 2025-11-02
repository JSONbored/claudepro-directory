/**
 * GalleryCard - Code screenshot preview card for masonry grid
 * Pinterest-style hover effects with engagement metrics
 */

'use client';

import { motion } from 'motion/react';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { Camera, Share2, TrendingUp } from '@/src/lib/icons';

export interface GalleryCardProps {
  category: string;
  slug: string;
  title: string;
  description: string;
  author: string;
  tags: string[];
  screenshot_count: number;
  share_count: number;
  copy_count: number;
  view_count: number;
  trending_score: number;
}

export function GalleryCard({
  category,
  slug,
  title,
  description,
  author,
  tags,
  screenshot_count,
  share_count,
  trending_score,
}: GalleryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '100px' }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <a
        href={`/${category}/${slug}`}
        className="relative block overflow-hidden rounded-xl border-2 border-border bg-card shadow-lg transition-all duration-300 hover:border-primary/30 hover:shadow-2xl"
      >
        {/* Preview Image Placeholder */}
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-primary/10">
          {/* Hover Overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Camera Icon Placeholder */}
          <div className="relative z-0 flex h-full w-full items-center justify-center">
            <Camera className="h-16 w-16 text-muted-foreground/30 transition-transform duration-300 group-hover:scale-110" />
          </div>

          {/* Category Badge */}
          <div className="absolute top-3 right-3 z-20">
            <UnifiedBadge
              variant="base"
              style="secondary"
              className="bg-background/80 backdrop-blur-sm"
            >
              {category}
            </UnifiedBadge>
          </div>

          {/* Engagement Metrics on Hover */}
          <div className="absolute right-0 bottom-0 left-0 z-20 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex items-center gap-4 text-sm text-white">
              <div className="flex items-center gap-1.5">
                <Camera className="h-4 w-4" />
                <span className="font-medium">{screenshot_count}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Share2 className="h-4 w-4" />
                <span className="font-medium">{share_count}</span>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">{Math.round(trending_score)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="space-y-3 p-4">
          <h3 className="line-clamp-2 font-bold text-lg transition-colors duration-200 group-hover:text-primary">
            {title}
          </h3>

          <p className="line-clamp-2 text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md border border-primary/10 bg-primary/5 px-2 py-0.5 text-primary/80 text-xs"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-muted-foreground text-xs">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Author */}
          <div className="flex items-center gap-2 border-border/50 border-t pt-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="font-medium text-primary text-xs">
                {author.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">{author}</span>
          </div>
        </div>
      </a>
    </motion.div>
  );
}
