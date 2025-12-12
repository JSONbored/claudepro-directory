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
  NavLink,
  UI_CLASSES,
} from '@heyclaude/web-runtime/ui';
import { FolderOpen } from '@heyclaude/web-runtime/icons';
import { motion } from 'motion/react';
import { MICROINTERACTIONS } from '@heyclaude/web-runtime/design-system';
import type { Database } from '@heyclaude/database-types';

export interface ProfileCollectionsSectionProps {
  collections: Database['public']['Functions']['get_user_profile']['Returns']['collections'];
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
  if (!collections || collections.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <FolderOpen className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground">No public collections yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
              whileHover={MICROINTERACTIONS.card.hover}
              whileTap={MICROINTERACTIONS.card.tap}
              transition={MICROINTERACTIONS.card.transition}
            >
              <Card className={UI_CLASSES.CARD_INTERACTIVE}>
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
                      className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} text-sm`}
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
