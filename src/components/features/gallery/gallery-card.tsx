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
        className="block relative rounded-xl border-2 border-border bg-card overflow-hidden shadow-lg hover:shadow-2xl hover:border-primary/30 transition-all duration-300"
      >
        {/* Preview Image Placeholder */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/5 via-transparent to-primary/10 flex items-center justify-center overflow-hidden">
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

          {/* Camera Icon Placeholder */}
          <div className="relative z-0 flex items-center justify-center w-full h-full">
            <Camera className="w-16 h-16 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-300" />
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
          <div className="absolute bottom-0 left-0 right-0 p-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-4 text-white text-sm">
              <div className="flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                <span className="font-medium">{screenshot_count}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Share2 className="w-4 h-4" />
                <span className="font-medium">{share_count}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">{Math.round(trending_score)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-3">
          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-primary/5 text-primary/80 border border-primary/10"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs text-muted-foreground">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Author */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {author.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{author}</span>
          </div>
        </div>
      </a>
    </motion.div>
  );
}
