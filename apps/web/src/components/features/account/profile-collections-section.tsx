'use client';

/**
 * Profile Collections Section
 * 
 * Client component for displaying user's public collections with hover animations
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  NavLink
} from '@heyclaude/web-runtime/ui';
import { FolderOpen } from '@heyclaude/web-runtime/icons';
import { motion } from 'motion/react';
import { MICROINTERACTIONS, between, paddingY, marginBottom, gap } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import type { GetUserProfileReturns } from '@heyclaude/database-types/postgres-types';

export interface ProfileCollectionsSectionProps {
  collections: GetUserProfileReturns['collections'];
  slug: string;
  getSafeCollectionUrl: (userSlug: string, collectionSlug: string) => null | string;
}

/**
 * Displays user's public collections
 */
export function ProfileCollectionsSection({
  collections,
  slug,
  getSafeCollectionUrl,
}: ProfileCollectionsSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!collections || collections.length === 0) {
    return (
      <Card>
        <CardContent className={`flex flex-col items-center ${paddingY.section}`}>
          <FolderOpen className={`text-muted-foreground ${marginBottom.default} h-12 w-12`} />
          <p className="text-muted-foreground">No public collections yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`grid ${gap.default} sm:grid-cols-2`}>
      {collections
        .filter(
          (
            collection
          ): collection is typeof collection & {
            id: string;
            name: null | string;
            slug: string;
          } =>
            collection.id !== null &&
            collection.slug !== null &&
            collection.name !== null
        )
        .map((collection) => {
          const safeCollectionUrl = getSafeCollectionUrl(slug, collection.slug);
          if (!safeCollectionUrl) {
            return null;
          }
          return (
            <motion.div
              key={collection.id}
              whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.card.hover}
              whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.card.tap}
              transition={MICROINTERACTIONS.card.transition}
            >
              <Card className="card-gradient transition-smooth group cursor-pointer border-border/50">
                <NavLink href={safeCollectionUrl}>
                  <CardHeader>
                    <CardTitle className="text-lg">{collection.name}</CardTitle>
                    {collection.description ? (
                      <CardDescription className="line-clamp-2">
                        {collection.description}
                      </CardDescription>
                    ) : null}
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`${between.center} text-sm`}
                    >
                      <span className="text-muted-foreground">
                        {collection.item_count ?? 0}{' '}
                        {(collection.item_count ?? 0) === 1 ? 'item' : 'items'}
                      </span>
                      <span className="text-muted-foreground">
                        {collection.view_count ?? 0} views
                      </span>
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
