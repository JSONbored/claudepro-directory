'use client';

/**
 * Profile Contributions Section
 * 
 * Client component for displaying user's contributions with hover animations
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  NavLink,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { MICROINTERACTIONS } from '@heyclaude/web-runtime/design-system';
import type { Database } from '@heyclaude/database-types';

export interface ProfileContributionsSectionProps {
  contributions: Database['public']['Functions']['get_user_profile']['Returns']['contributions'];
  getSafeContentUrl: (type: string, slug: string) => null | string;
}

/**
 * Displays user's contributions
 */
export function ProfileContributionsSection({
  contributions,
  getSafeContentUrl,
}: ProfileContributionsSectionProps) {
  if (!contributions || contributions.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {contributions
        .filter(
          (
            item
          ): item is typeof item & {
            content_type: Database['public']['Enums']['content_category'];
            id: string;
            name: null | string;
            slug: string;
          } =>
            item.id !== null &&
            item.content_type !== null &&
            item.slug !== null &&
            item.name !== null
        )
        .map((item) => {
          const safeContentUrl = getSafeContentUrl(item.content_type, item.slug);
          if (!safeContentUrl) {
            return null;
          }
          return (
            <motion.div
              key={item.id}
              whileHover={MICROINTERACTIONS.card.hover}
              whileTap={MICROINTERACTIONS.card.tap}
              transition={MICROINTERACTIONS.card.transition}
            >
              <Card className="border-border/50 cursor-pointer">
                <NavLink href={safeContentUrl}>
                  <CardHeader>
                    <div className="mb-2 flex items-center justify-between">
                      <UnifiedBadge variant="base" style="secondary" className="text-xs">
                        {item.content_type}
                      </UnifiedBadge>
                      {item.featured ? (
                        <UnifiedBadge variant="base" style="default" className="text-xs">
                          Featured
                        </UnifiedBadge>
                      ) : null}
                    </div>
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <span>{item.view_count ?? 0} views</span>
                      <span>•</span>
                      <span>{item.download_count ?? 0} downloads</span>
                    </div>
                  </CardContent>
                </NavLink>
              </Card>
            </motion.div>
          );
        })}
    </div>
  );
}
