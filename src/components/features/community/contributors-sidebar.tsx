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
import type { UserProfile } from '@/src/components/domain/profile-card';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/card';
import { Award, Medal, TrendingUp } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export interface ContributorsSidebarProps {
  topContributors: UserProfile[];
  newMembers: UserProfile[];
}

function ContributorsSidebarComponent({ topContributors, newMembers }: ContributorsSidebarProps) {
  return (
    <aside className="space-y-6 sticky top-4">
      {/* Trending Contributors */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
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
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="relative flex-shrink-0">
                  {contributor.image ? (
                    <Image
                      src={contributor.image}
                      alt={displayName}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {index < 3 && (
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  {contributor.total_contributions !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Award className="h-3 w-3" />
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
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={displayName}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{displayName}</p>
                    {member.work && (
                      <p className="text-xs text-muted-foreground truncate">{member.work}</p>
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
            <span className="text-xs text-muted-foreground">Total Members</span>
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
