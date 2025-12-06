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

import { sanitizeSlug } from '@heyclaude/web-runtime/core';
import { Award, Medal, TrendingUp } from '@heyclaude/web-runtime/icons';
import {
  POSITION_PATTERNS,
  UI_CLASSES,
  UnifiedBadge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import Image from 'next/image';
import Link from 'next/link';
import { memo } from 'react';

import { type UserProfile } from '@/src/components/core/domain/cards/user-profile-card';

/**
 * Validate slug is safe for use in URLs
 * Only allows alphanumeric characters, hyphens, and underscores
 */
function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string' || slug.length === 0) return false;
  // Strict pattern: only alphanumeric, hyphens, underscores
  // No path separators, no dots, no special chars
  return /^[a-zA-Z0-9-_]+$/.test(slug);
}

/**
 * Validate internal navigation path is safe
 * Only allows relative paths starting with /, no protocol-relative URLs
 */
function isValidInternalPath(path: string): boolean {
  if (typeof path !== 'string' || path.length === 0) return false;
  // Must start with / for relative paths
  if (!path.startsWith('/')) return false;
  // Reject protocol-relative URLs (//example.com)
  if (path.startsWith('//')) return false;
  // Reject dangerous protocols
  if (/^(javascript|data|vbscript|file):/i.test(path)) return false;
  // Basic path validation - allow alphanumeric, slashes, hyphens, underscores
  // This is permissive but safe for Next.js routing
  return /^\/[a-zA-Z0-9/?#\-_.~!*'();:@&=+$,%[\]]*$/.test(path);
}

/**
 * Get safe user profile URL from slug
 * Returns null if slug is invalid or unsafe
 */
function getSafeUserProfileUrl(slug: null | string | undefined): null | string {
  if (!slug || typeof slug !== 'string') return null;
  // Validate slug format
  if (!isValidSlug(slug)) return null;
  // Sanitize to remove any potentially dangerous characters
  const sanitized = sanitizeSlug(slug);
  // Double-check after sanitization
  if (!isValidSlug(sanitized) || sanitized.length === 0) return null;
  // Construct the URL
  const url = `/u/${sanitized}`;
  // Validate the final URL path to ensure it's safe
  if (!isValidInternalPath(url)) return null;
  return url;
}

/**
 * Sanitize display name for safe use in text content and attributes
 * Removes HTML tags, script content, and dangerous characters
 * Limits length to prevent abuse
 */
function sanitizeDisplayName(name: null | string | undefined, fallback: string): string {
  if (!name || typeof name !== 'string') return fallback;
  // Remove all < and > characters to fully prevent incomplete tag removal
  // This is the safest approach for display names which should never contain HTML
  let sanitized = name.replaceAll(/<|>/g, '');
  // Remove control characters and dangerous Unicode by filtering character codes
  // Control characters: 0x00-0x1F, 0x7F-0x9F
  // Dangerous Unicode: RTL override marks, directional isolates
  const dangerousChars = new Set([
    0x20_2e,
    0x20_2d,
    0x20_2c,
    0x20_2b,
    0x20_2a, // RTL override marks
    0x20_0e,
    0x20_0f, // Left-to-right/right-to-left marks
    0x20_66,
    0x20_67,
    0x20_68,
    0x20_69, // Directional isolates
  ]);
  sanitized = sanitized
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      // Filter out control characters (0x00-0x1F, 0x7F-0x9F) and dangerous Unicode
      return (code < 0x20 || (code >= 0x7f && code <= 0x9f)) === false && !dangerousChars.has(code);
    })
    .join('');
  // Trim and limit length (prevent extremely long names)
  sanitized = sanitized.trim().slice(0, 100);
  // Return sanitized name or fallback if empty
  return sanitized.length > 0 ? sanitized : fallback;
}

export interface ContributorsSidebarProps {
  newMembers: UserProfile[];
  topContributors: UserProfile[];
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
            const safeUrl = getSafeUserProfileUrl(slug);
            // Don't render if slug is invalid or unsafe
            if (!safeUrl) return null;
            // Explicit validation at point of use to satisfy static analysis
            // This ensures the URL is a safe internal path before using in Link
            // Type guard: after this check, safeUrl is guaranteed to be a valid internal path
            if (!isValidInternalPath(safeUrl)) return null;
            // At this point, safeUrl is validated and safe for use in Next.js Link
            // Use validated URL directly to satisfy static analysis
            const validatedUrl: string = safeUrl;
            // Sanitize display name to prevent XSS
            const displayName = sanitizeDisplayName(contributor.name, `@${slug}`);
            return (
              <Link
                key={slug}
                href={validatedUrl}
                className="hover:bg-muted/50 flex items-center gap-3 rounded-lg p-2 transition-colors"
              >
                <div className="relative shrink-0">
                  {contributor.image ? (
                    <Image
                      src={contributor.image}
                      alt={displayName}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-accent flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {index < 3 && (
                    <div className="bg-background absolute -right-1 -bottom-1 rounded-full p-1">
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
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  {contributor.total_contributions !== undefined && (
                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
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
              const safeUrl = getSafeUserProfileUrl(slug);
              // Don't render if slug is invalid or unsafe
              if (!safeUrl) return null;
              // Explicit validation at point of use to satisfy static analysis
              // This ensures the URL is a safe internal path before using in Link
              // Type guard: after this check, safeUrl is guaranteed to be a valid internal path
              if (!isValidInternalPath(safeUrl)) return null;
              // At this point, safeUrl is validated and safe for use in Next.js Link
              // Use validated URL directly to satisfy static analysis
              const validatedUrl: string = safeUrl;
              // Sanitize display name to prevent XSS
              const displayName = sanitizeDisplayName(member.name, `@${slug}`);
              return (
                <Link
                  key={slug}
                  href={validatedUrl}
                  className="hover:bg-muted/50 flex items-center gap-3 rounded-lg p-2 transition-colors"
                >
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={displayName}
                      width={32}
                      height={32}
                      className={`${UI_CLASSES.ICON_XL} shrink-0 rounded-full object-cover`}
                    />
                  ) : (
                    <div className="bg-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    {member.work ? (
                      <p className="text-muted-foreground truncate text-xs">{member.work}</p>
                    ) : null}
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
