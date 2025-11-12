'use client';

/**
 * ContributorsSidebar - Sticky sidebar showing trending contributors
 *
 * Architecture:
 * - Sticky positioning for persistent visibility
 * - Compact profile cards optimized for sidebar
 * - Configuration-driven sorting/filtering
 * - Performance: React.memo
 *
 * @module components/features/community/contributors-sidebar
 */

import Image from 'next/image';
import Link from 'next/link';
import { memo } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/unified-badge';
import type { UserProfile } from '@/src/components/core/domain/cards/profile-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';
import { Award, Medal, TrendingUp } from '@/src/lib/icons';
import { POSITION_PATTERNS, UI_CLASSES } from '@/src/lib/ui-constants';

export interface ContributorsSidebarProps {
  topContributors: UserProfile[];
  newMembers: UserProfile[];
}

function ContributorsSidebarComponent({ topContributors, newMembers }: ContributorsSidebarProps) {
  return (
    <aside className={`${POSITION_PATTERNS.STICKY_TOP_4} space-y-6`}>
      {/* Trending Contributors */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className={`${UI_CLASSES.ICON_SM} text-accent`} />
            <CardTitle className="text-sm">Trending Contributors</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {topContributors.slice(0, 5).map((contributor, index) => {
            const slug = contributor.slug || 'unknown';
            const displayName = contributor.name || `@${slug}`;
            return (
              <Link
                key={slug}
                href={`/u/${slug}`}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
              >
                <div className="relative flex-shrink-0">
                  {contributor.image ? (
                    <Image
                      src={contributor.image}
                      alt={displayName}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-bold text-sm">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {index < 3 && (
                    <div className="-bottom-1 -right-1 absolute rounded-full bg-background p-1">
                      <Medal
                        className={`h-3 w-3 ${
                          index === 0
                            ? 'text-amber-500'
                            : index === 1
                              ? 'text-slate-400'
                              : 'text-amber-700'
                        }`}
                      />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{displayName}</p>
                  {contributor.total_contributions !== undefined && (
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Award className={UI_CLASSES.ICON_XS} />
                      <span>{contributor.total_contributions} contributions</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* New Members */}
      {newMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">New Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {newMembers.slice(0, 5).map((member) => {
              const slug = member.slug || 'unknown';
              const displayName = member.name || `@${slug}`;
              return (
                <Link
                  key={slug}
                  href={`/u/${slug}`}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={displayName}
                      width={32}
                      height={32}
                      className={`${UI_CLASSES.ICON_XL} flex-shrink-0 rounded-full object-cover`}
                    />
                  ) : (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent font-bold text-xs">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{displayName}</p>
                    {member.work && (
                      <p className="truncate text-muted-foreground text-xs">{member.work}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Community Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Community Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
            <span className="text-muted-foreground text-xs">Total Members</span>
            <UnifiedBadge variant="base" style="secondary" className="text-xs">
              {topContributors.length + newMembers.length}
            </UnifiedBadge>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

export const ContributorsSidebar = memo(ContributorsSidebarComponent);
ContributorsSidebar.displayName = 'ContributorsSidebar';
