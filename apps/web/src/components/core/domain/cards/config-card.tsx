'use client';

/** ConfigCard consuming componentConfigs for runtime-tunable card behaviors */

import type { Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { addBookmark } from '@heyclaude/web-runtime/actions/add-bookmark';
import {
  ensureStringArray,
  formatViewCount,
  getContentItemUrl,
  getMetadata,
  isValidCategory,
  logClientWarning,
  logger,
  logUnhandledPromise,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { useCopyToClipboard, usePulse } from '@heyclaude/web-runtime/hooks';
import {
  Award,
  Bookmark,
  BookmarkPlus,
  ExternalLink,
  Eye,
  Github,
  Layers,
  Sparkles,
} from '@heyclaude/web-runtime/icons';
import type { ConfigCardProps, ContentItem } from '@heyclaude/web-runtime/types/component.types';
import {
  BADGE_COLORS,
  getDisplayTitle,
  SEMANTIC_COLORS,
  toasts,
  UI_CLASSES,
} from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { BookmarkButton } from '@/src/components/core/buttons/interaction/bookmark-button';
import { SimpleCopyButton } from '@/src/components/core/buttons/shared/simple-copy-button';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { BaseCard } from '@/src/components/core/domain/cards/content-card-base';
import { HighlightedText } from '@/src/components/core/shared/highlighted-text';
import { BorderBeam } from '@/src/components/primitives/animation/border-beam';
import { ReviewRatingCompact } from '@/src/components/primitives/feedback/review-rating-compact';
import { Button } from '@/src/components/primitives/ui/button';
import { useComponentCardConfig } from '@/src/components/providers/component-config-context';
import { usePinboard } from '@/src/hooks/use-pinboard';

// Experience level validation helper
function isExperienceLevel(
  value: unknown
): value is Database['public']['Enums']['experience_level'] {
  // Use enum values directly from @heyclaude/database-types Constants
  const EXPERIENCE_LEVEL_VALUES = Constants.public.Enums.experience_level;
  return (
    typeof value === 'string' &&
    EXPERIENCE_LEVEL_VALUES.includes(value as Database['public']['Enums']['experience_level'])
  );
}

/**
 * Validate and sanitize repository URL
 * Only allows HTTPS URLs from trusted repository hosts (GitHub, GitLab)
 * Returns sanitized URL (with query/fragment removed) or null if invalid
 */
function getSafeRepositoryUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    // Require HTTPS and trusted hostname
    if (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'github.com' ||
        parsed.hostname === 'www.github.com' ||
        parsed.hostname === 'gitlab.com' ||
        parsed.hostname === 'www.gitlab.com')
    ) {
      // Remove query string and fragment for redirect
      parsed.search = '';
      parsed.hash = '';
      // Remove username/password if present
      parsed.username = '';
      parsed.password = '';
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate and sanitize documentation URL
 * Returns sanitized URL (strip credentials, normalize host) or null if invalid
 */
function isTrustedDocumentationUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Require HTTPS protocol
    if (parsed.protocol !== 'https:') {
      return null;
    }

    // Strip credentials
    parsed.username = '';
    parsed.password = '';

    // Normalize hostname (remove trailing dot, lowercase)
    parsed.hostname = parsed.hostname.replace(/\.$/, '').toLowerCase();

    // Remove default HTTPS port
    if (parsed.port === '443') {
      parsed.port = '';
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validate category and slug are safe for URL construction
 * Only allows alphanumeric, hyphens, and underscores
 */
function isSafeCategoryAndSlug(category: unknown, slug: unknown): boolean {
  const SAFE = /^[a-zA-Z0-9_-]+$/;
  return (
    typeof category === 'string' &&
    typeof slug === 'string' &&
    SAFE.test(category) &&
    SAFE.test(slug)
  );
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

export const ConfigCard = memo(
  ({
    item,
    variant = 'default',
    showCategory = true,
    showActions = true,
    enableSwipeGestures = true, // Enable mobile swipe gestures (copy/bookmark)
    useViewTransitions = true, // Enable smooth page morphing with View Transitions API (Baseline as of October 2025)
    showBorderBeam, // Auto-enable for featured items if not explicitly set
    searchQuery, // Optional search query for highlighting
  }: ConfigCardProps) => {
    const displayTitle = getDisplayTitle({
      title: 'title' in item ? (typeof item.title === 'string' ? item.title : null) : null,
      slug: 'slug' in item ? (typeof item.slug === 'string' ? item.slug : null) : null,
      category: 'category' in item && isValidCategory(item.category) ? item.category : null,
    });
    const cardCategory: Database['public']['Enums']['content_category'] = isValidCategory(
      item.category ?? 'agents'
    )
      ? ((item.category ?? 'agents') as Database['public']['Enums']['content_category'])
      : 'agents';
    const cardSlug = typeof item.slug === 'string' ? item.slug : null;
    const { togglePin, isPinned } = usePinboard();
    const pinned = cardSlug ? isPinned(cardCategory, cardSlug) : false;

    // Use pre-highlighted HTML from edge function (unified-search)
    // All highlighting is now done server-side at the edge
    const highlightedTitle = useMemo(() => {
      if ('title_highlighted' in item && item.title_highlighted) {
        return <HighlightedText html={item.title_highlighted as string} fallback={displayTitle} />;
      }
      return displayTitle;
    }, [displayTitle, item]);

    const highlightedDescription = useMemo(() => {
      if ('description_highlighted' in item && item.description_highlighted && item.description) {
        return (
          <HighlightedText
            html={item.description_highlighted as string}
            fallback={item.description}
          />
        );
      }
      return item.description;
    }, [item.description, item]);

    // Get tags from item
    const tags = ensureStringArray(
      'tags' in item ? (item.tags as string[] | null | undefined) : []
    );

    // Use pre-highlighted tags from edge function
    const highlightedTags = useMemo(() => {
      if (!tags.length) return [];

      if ('tags_highlighted' in item && item.tags_highlighted) {
        const highlightedTagsArray = item.tags_highlighted as string[];
        return tags.map((tag, index) => ({
          original: tag,
          highlighted: <HighlightedText html={highlightedTagsArray[index] || tag} fallback={tag} />,
        }));
      }

      // No highlighting - return original tags
      return tags.map((tag) => ({
        original: tag,
        highlighted: tag,
      }));
    }, [tags, item]);

    // Use pre-highlighted author from edge function
    const highlightedAuthor = useMemo(() => {
      if (!('author' in item && item.author)) {
        return null;
      }

      if ('author_highlighted' in item && item.author_highlighted) {
        return <HighlightedText html={item.author_highlighted as string} fallback={item.author} />;
      }

      return item.author;
    }, [item]);

    const metadata = useMemo(() => getMetadata(item as ContentItem), [item]);
    const packageName = metadata['package'] as string | undefined;
    const configurationObject =
      metadata['configuration'] && typeof metadata['configuration'] === 'object'
        ? metadata['configuration']
        : null;
    const pnpmCommand = packageName ? `pnpm add ${packageName}` : null;

    // Initialize all hooks at the top level (before any conditional returns)
    const pulse = usePulse();
    const router = useRouter();
    const { copy: copyLink } = useCopyToClipboard({
      context: {
        component: 'ConfigCard',
        action: 'swipe_copy',
      },
    });
    const cardConfig = useComponentCardConfig();

    // Track highlight visibility for analytics (fire and forget)
    const hasTrackedHighlight = useRef(false);

    // Extract position metadata (needed for click tracking)
    const position: number | undefined =
      'position' in item && typeof item.position === 'number' ? item.position : undefined;

    // Track card clicks
    const handleCardClickPulse = useCallback(() => {
      if (!item.slug) return;
      const category = isValidCategory(item.category ?? 'agents')
        ? (item.category ?? 'agents')
        : 'agents';
      pulse
        .click({
          category: category as Database['public']['Enums']['content_category'],
          slug: item.slug,
          metadata: {
            action: 'card_click',
            source: 'card_grid',
            ...(position !== undefined && { position }),
            ...(searchQuery?.trim() && { search_query: searchQuery.trim() }),
          },
        })
        .catch((error) => {
          logUnhandledPromise('ConfigCard: card click pulse failed', error, {
            category: (item.category ??
              'agents') as Database['public']['Enums']['content_category'],
            slug: item.slug ?? '',
          });
        });
    }, [pulse, item.category, item.slug, position, searchQuery]);

    useEffect(() => {
      if (searchQuery?.trim() && !hasTrackedHighlight.current) {
        // Check if any highlighting occurred (edge function provides pre-highlighted fields)
        const hasHighlights =
          ('title_highlighted' in item && item.title_highlighted) ||
          ('description_highlighted' in item && item.description_highlighted) ||
          ('tags_highlighted' in item && item.tags_highlighted) ||
          ('author_highlighted' in item && item.author_highlighted);

        if (hasHighlights && item.slug) {
          hasTrackedHighlight.current = true;
          // Track highlight interaction (non-blocking)
          const category = isValidCategory(item.category ?? 'agents')
            ? (item.category ?? 'agents')
            : 'agents';
          pulse
            .search({
              category: category as Database['public']['Enums']['content_category'],
              slug: item.slug,
              query: searchQuery.trim(),
              metadata: {
                has_title_highlight: Boolean('title_highlighted' in item && item.title_highlighted),
                has_description_highlight: Boolean(
                  'description_highlighted' in item &&
                    item.description_highlighted &&
                    item.description
                ),
                has_tag_highlight: Boolean('tags_highlighted' in item && item.tags_highlighted),
                has_author_highlight: Boolean(
                  'author_highlighted' in item && item.author_highlighted
                ),
              },
            })
            .catch((error) => {
              logUnhandledPromise('ConfigCard: highlight analytics pulse failed', error, {
                category: category as Database['public']['Enums']['content_category'],
                slug: item.slug ?? '',
              });
            });
        }
      }
    }, [searchQuery, item, pulse]);

    // Compute targetPath early (before hooks that use it)
    const targetPath = item.slug
      ? getContentItemUrl({
          category: (isValidCategory(item.category ?? 'agents')
            ? (item.category ?? 'agents')
            : 'agents') as Database['public']['Enums']['content_category'],
          slug: item.slug,
          subcategory:
            'subcategory' in item ? (item.subcategory as string | null | undefined) : undefined,
        })
      : '';

    // Swipe gesture handlers for mobile quick actions
    const handleSwipeRightCopy = useCallback(async () => {
      if (!(item.slug && targetPath)) return;
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}${targetPath}`;
      await copyLink(url);

      // Track user interaction for analytics and personalization
      const category = isValidCategory(item.category ?? 'agents')
        ? (item.category ?? 'agents')
        : 'agents';
      pulse
        .copy({
          category: category as Database['public']['Enums']['content_category'],
          slug: item.slug,
        })
        .catch((error) => {
          logUnhandledPromise('ConfigCard: swipe copy pulse failed', error, {
            category: category as Database['public']['Enums']['content_category'],
            slug: item.slug ?? undefined,
          });
        });

      toasts.success.copied();
    }, [targetPath, copyLink, item, pulse]);

    const handleSwipeLeftBookmark = useCallback(async () => {
      if (!item.slug) return;
      // Type guard validation
      const categoryValue = item.category ?? 'agents';
      if (!isValidCategory(categoryValue)) {
        const normalized = normalizeError(
          'Invalid content type',
          'Invalid content type for bookmark'
        );
        logger.error('Invalid content type for bookmark', normalized, {
          contentType: categoryValue,
          contentSlug: item.slug,
        });
        toasts.error.fromError(new Error(`Invalid content type: ${categoryValue}`));
        return;
      }

      const validatedCategory = categoryValue as Database['public']['Enums']['content_category'];

      try {
        const result = await addBookmark({
          content_type: validatedCategory,
          content_slug: item.slug,
          notes: '',
        });

        if (result?.data?.success) {
          toasts.success.bookmarkAdded();

          // Track bookmark addition
          pulse
            .bookmark({
              category: validatedCategory,
              slug: item.slug,
              action: 'add',
            })
            .catch((error) => {
              logClientWarning('ConfigCard: bookmark addition pulse failed', error, {
                category: validatedCategory,
                slug: item.slug ?? undefined,
              });
            });

          router.refresh();
        }
      } catch (error) {
        const normalized = normalizeError(error, 'ConfigCard: Failed to add bookmark via swipe');
        logger.error('ConfigCard: Failed to add bookmark via swipe', normalized, {
          contentType: validatedCategory,
          contentSlug: item.slug,
        });
        if (error instanceof Error && error.message.includes('signed in')) {
          toasts.error.authRequired();
        } else {
          toasts.error.actionFailed('bookmark');
        }
      }
    }, [item.category, item.slug, router, pulse]);

    const copyInlineValue = useCallback(
      async (value: string, successDescription: string, metadata?: Record<string, unknown>) => {
        try {
          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
          } else {
            await copyLink(value);
          }
          toasts.raw.success('Copied!', { description: successDescription });
          if (cardSlug) {
            pulse
              .copy({
                category: cardCategory,
                slug: cardSlug,
                ...(metadata ? { metadata } : {}),
              })
              .catch((error) => {
                // Log but don't throw - tracking failures shouldn't break user experience
                logger.error('Failed to track copy action', error as Error, {
                  context: 'config_card_quick_copy',
                  category: cardCategory,
                  slug: cardSlug,
                });
              });
          }
        } catch (error) {
          logger.error(
            'ConfigCard: quick action copy failed',
            error instanceof Error ? error : new Error(String(error))
          );
          toasts.raw.error('Copy failed', { description: 'Unable to copy to clipboard.' });
        }
      },
      [cardCategory, cardSlug, copyLink, pulse]
    );

    const handlePinToggle = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (!cardSlug) {
          toasts.raw.error('Unable to save item', {
            description: 'Missing identifier for this configuration.',
          });
          return;
        }

        const pinPayload = {
          category: cardCategory,
          slug: cardSlug,
          title: displayTitle || cardSlug,
          description: typeof item.description === 'string' ? item.description.slice(0, 240) : '',
          typeName: item.category ?? 'configuration',
          tags,
        };

        try {
          togglePin(pinPayload);
          toasts.raw.success(pinned ? 'Removed from pinboard' : 'Pinned for later', {
            description: pinned
              ? 'Removed from your local pinboard.'
              : 'Open the pinboard to review your saved configs.',
          });
        } catch (error) {
          logger.error(
            'ConfigCard: failed to toggle pinboard state',
            error instanceof Error ? error : new Error(String(error))
          );
          toasts.raw.error('Unable to update pinboard', {
            description: 'Please try again.',
          });
        }
      },
      [
        cardCategory,
        cardSlug,
        displayTitle,
        item.description,
        item.category,
        tags,
        togglePin,
        pinned,
      ]
    );

    // Extract sponsored metadata - use snake_case directly from database types
    const isSponsored: boolean | undefined =
      'is_sponsored' in item && typeof item.is_sponsored === 'boolean'
        ? item.is_sponsored
        : undefined;
    const sponsoredId: string | undefined =
      'sponsored_content_id' in item && typeof item.sponsored_content_id === 'string'
        ? item.sponsored_content_id
        : undefined;
    const sponsorTier: Database['public']['Enums']['sponsorship_tier'] | null | undefined =
      'sponsorship_tier' in item &&
      item.sponsorship_tier !== null &&
      item.sponsorship_tier !== undefined
        ? (item.sponsorship_tier as Database['public']['Enums']['sponsorship_tier']) // Cast to ENUM type
        : undefined;
    const viewCount =
      'view_count' in item && typeof item.view_count === 'number' ? item.view_count : undefined;

    // copyCount is a runtime property added by analytics (not in schema) - use snake_case
    const copyCount =
      'copy_count' in item && typeof item.copy_count === 'number' ? item.copy_count : undefined;

    // bookmarkCount is a runtime property added by analytics (not in schema) - use snake_case
    const bookmarkCount =
      'bookmark_count' in item && typeof item.bookmark_count === 'number'
        ? item.bookmark_count
        : undefined;

    // Extract featured metadata (weekly algorithm selection)
    // Note: _featured is a computed property added by trending algorithm, not in schema
    const featuredData = (item as { _featured?: { rank: number; score: number } })._featured;
    const isFeatured = !!featuredData;
    const featuredRank = featuredData?.rank;

    // Auto-enable border beam for featured items if not explicitly set
    const shouldShowBeam = showBorderBeam !== undefined ? showBorderBeam : isFeatured;

    // Extract rating metadata (if available)
    // Note: _rating is a computed property added by rating aggregator, not in schema
    const ratingData = (item as { _rating?: { average: number; count: number } })._rating;
    const hasRating = ratingData && ratingData.count > 0;

    // Extract collection-specific metadata (tree-shakeable - only loaded for collections)
    const isCollection = item.category === ('collections' as const);
    const collectionType = 'collectionType' in item ? item.collectionType : undefined;
    const collectionDifficulty = 'difficulty' in item ? item.difficulty : undefined;
    const itemCount = 'itemCount' in item ? item.itemCount : undefined;
    // Tags already declared above

    // Collection type label mapping (tree-shakeable)
    const COLLECTION_TYPE_LABELS = isCollection
      ? {
          'starter-kit': 'Starter Kit',
          workflow: 'Workflow',
          'advanced-system': 'Advanced System',
          'use-case': 'Use Case',
        }
      : undefined;

    return (
      <div className="relative">
        {/* BorderBeam animation - auto-enabled for featured items */}
        {shouldShowBeam && (
          <BorderBeam
            size={200}
            duration={15}
            colorFrom={featuredRank === 1 ? '#ffaa40' : '#9333ea'}
            colorTo={featuredRank === 1 ? '#ffd700' : '#a855f7'}
            borderWidth={1.5}
          />
        )}

        <BaseCard
          targetPath={targetPath}
          displayTitle={highlightedTitle}
          description={highlightedDescription}
          {...('author' in item && item.author
            ? {
                author: highlightedAuthor ?? item.author,
              }
            : {})}
          {...('author_profile_url' in item && item.author_profile_url
            ? { authorProfileUrl: item.author_profile_url }
            : {})}
          {...('source' in item && item.source ? { source: item.source as string } : {})}
          {...(tags.length
            ? {
                tags: highlightedTags.map((t) => t.original),
                ...(highlightedTags.length > 0 ? { highlightedTags } : {}),
              }
            : {})}
          variant={variant}
          showActions={showActions}
          ariaLabel={`${displayTitle} - ${item.category ?? 'content'} by ${('author' in item && item.author) || 'Community'}`}
          {...(isSponsored !== undefined ? { isSponsored } : {})}
          {...(sponsoredId !== undefined ? { sponsoredId } : {})}
          {...(position !== undefined ? { position } : {})}
          enableSwipeGestures={enableSwipeGestures}
          onSwipeRight={handleSwipeRightCopy}
          onSwipeLeft={handleSwipeLeftBookmark}
          useViewTransitions={useViewTransitions}
          {...(item.slug ? { viewTransitionSlug: item.slug } : {})}
          onBeforeNavigate={handleCardClickPulse}
          renderTopBadges={() => {
            // Runtime type guard ensures category is valid ContentCategory (excludes 'changelog' and 'jobs')
            // Type assertion is safe because isValidCategory() validates at runtime
            const rawCategory = item.category ?? 'agents';
            const category: Database['public']['Enums']['content_category'] = isValidCategory(
              rawCategory
            )
              ? (rawCategory as Database['public']['Enums']['content_category'])
              : 'agents';
            return (
              <>
                {showCategory && (
                  <UnifiedBadge variant="category" category={category}>
                    {(() => {
                      switch (category) {
                        case 'mcp':
                          return 'MCP';
                        case 'agents':
                          return 'Agent';
                        case 'commands':
                          return 'Command';
                        case 'hooks':
                          return 'Hook';
                        case 'rules':
                          return 'Rule';
                        case 'statuslines':
                          return 'Statusline';
                        case 'collections':
                          return 'Collection';
                        case 'guides':
                          return 'Guide';
                        case 'skills':
                          return 'Skill';
                        case 'jobs':
                          return 'Job';
                        case 'changelog':
                          return 'Changelog';
                        default:
                          return 'Agent';
                      }
                    })()}
                  </UnifiedBadge>
                )}

                {/* Collection-specific badges (tree-shakeable) */}
                {isCollection && collectionType && COLLECTION_TYPE_LABELS && (
                  <UnifiedBadge
                    variant="base"
                    style="outline"
                    className={`${UI_CLASSES.TEXT_BADGE} ${BADGE_COLORS.collectionType[collectionType as keyof typeof BADGE_COLORS.collectionType] || ''}`}
                  >
                    <Layers className={UI_CLASSES.ICON_XS_LEADING} aria-hidden="true" />
                    {COLLECTION_TYPE_LABELS[collectionType as keyof typeof COLLECTION_TYPE_LABELS]}
                  </UnifiedBadge>
                )}

                {isCollection &&
                  collectionDifficulty &&
                  typeof collectionDifficulty === 'string' &&
                  isExperienceLevel(collectionDifficulty) && (
                    <UnifiedBadge
                      variant="base"
                      style="outline"
                      className={`${UI_CLASSES.TEXT_BADGE} ${BADGE_COLORS.difficulty[collectionDifficulty]}`}
                    >
                      {collectionDifficulty}
                    </UnifiedBadge>
                  )}

                {isCollection && itemCount !== undefined && typeof itemCount === 'number' && (
                  <UnifiedBadge
                    variant="base"
                    style="outline"
                    className={`${UI_CLASSES.BADGE_METADATA} ${UI_CLASSES.TEXT_BADGE}`}
                  >
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </UnifiedBadge>
                )}

                {/* Featured badge - weekly algorithm selection */}
                {isFeatured && (
                  <UnifiedBadge
                    variant="base"
                    style="secondary"
                    className={`fade-in slide-in-from-top-2 animate-in ${UI_CLASSES.SPACE_TIGHT} font-semibold shadow-sm transition-all duration-300 hover:from-amber-500/15 hover:to-yellow-500/15 hover:shadow-md ${SEMANTIC_COLORS.FEATURED}`}
                  >
                    {featuredRank && featuredRank <= 3 ? (
                      <Award
                        className={`${UI_CLASSES.ICON_XS} text-amber-500`}
                        aria-hidden="true"
                      />
                    ) : (
                      <Sparkles className={UI_CLASSES.ICON_XS} aria-hidden="true" />
                    )}
                    Featured
                    {featuredRank && <span className="text-xs opacity-75">#{featuredRank}</span>}
                  </UnifiedBadge>
                )}
                {isSponsored && sponsorTier && (
                  <UnifiedBadge variant="sponsored" tier={sponsorTier} showIcon={true} />
                )}

                {/* New indicator - 0-7 days old content (server-computed) */}
                {'isNew' in item && item.isNew && (
                  <UnifiedBadge variant="new-indicator" label="New content" className="ml-0.5" />
                )}
              </>
            );
          }}
          renderMetadataBadges={() => (
            <>
              {/* Rating badge - shows average rating and count */}
              {cardConfig.showRating && hasRating && ratingData && (
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                  className="cursor-default border-0 bg-transparent p-0"
                >
                  <ReviewRatingCompact
                    average={ratingData.average}
                    count={ratingData.count}
                    size="sm"
                  />
                </button>
              )}
            </>
          )}
          renderActions={() => (
            <>
              {'repository' in item && item.repository && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${UI_CLASSES.ICON_BUTTON_SM} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!item.slug) return;
                    const category = isValidCategory(item.category ?? 'agents')
                      ? (item.category ?? 'agents')
                      : 'agents';
                    pulse
                      .click({
                        category: category as Database['public']['Enums']['content_category'],
                        slug: item.slug,
                        metadata: {
                          action: 'external_link',
                          link_type: 'github',
                          target_url: item.repository as string,
                        },
                      })
                      .catch((error) => {
                        logUnhandledPromise('ConfigCard: GitHub link click pulse failed', error, {
                          category: category as Database['public']['Enums']['content_category'],
                          slug: item.slug ?? undefined,
                        });
                      });
                    const safeRepoUrl = getSafeRepositoryUrl(item.repository as string);
                    if (safeRepoUrl) {
                      // Explicit validation: getSafeRepositoryUrl guarantees the URL is safe
                      // It validates protocol (HTTPS only), hostname (GitHub/GitLab only),
                      // removes credentials, query strings, and fragments
                      // At this point, safeRepoUrl is validated and safe for use in window.open
                      const validatedUrl: string = safeRepoUrl;
                      window.open(validatedUrl, '_blank');
                    } else {
                      logClientWarning('ConfigCard: Unsafe repository URL blocked', {
                        url: item.repository,
                        slug: item.slug,
                      });
                      toasts.raw.error('Repository link is invalid or untrusted.');
                    }
                  }}
                  aria-label={`View ${displayTitle} repository on GitHub`}
                >
                  <Github className={UI_CLASSES.ICON_XS} aria-hidden="true" />
                </Button>
              )}

              {'documentation_url' in item && item.documentation_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${UI_CLASSES.ICON_BUTTON_SM} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!item.slug) return;
                    const category = isValidCategory(item.category ?? 'agents')
                      ? (item.category ?? 'agents')
                      : 'agents';
                    pulse
                      .click({
                        category: category as Database['public']['Enums']['content_category'],
                        slug: item.slug,
                        metadata: {
                          action: 'external_link',
                          link_type: 'documentation',
                          target_url: item.documentation_url as string,
                        },
                      })
                      .catch((error) => {
                        logUnhandledPromise(
                          'ConfigCard: documentation link click pulse failed',
                          error,
                          {
                            category,
                            slug: item.slug ?? undefined,
                          }
                        );
                      });
                    const safeDocUrl = isTrustedDocumentationUrl(item.documentation_url as string);
                    if (safeDocUrl) {
                      // Explicit validation: isTrustedDocumentationUrl guarantees the URL is safe
                      // It validates protocol (HTTPS only), hostname (trusted TLDs only),
                      // removes credentials, query strings, and fragments
                      // At this point, safeDocUrl is validated and safe for use in window.open
                      const validatedUrl: string = safeDocUrl;
                      window.open(validatedUrl, '_blank');
                    } else {
                      logClientWarning('ConfigCard: Blocked untrusted documentation URL', {
                        url: item.documentation_url,
                      });
                      toasts.raw.error?.('Invalid or unsafe documentation link.', {
                        description: 'Documentation link is not available.',
                      });
                    }
                  }}
                  aria-label={`View ${displayTitle} documentation`}
                >
                  <ExternalLink className={UI_CLASSES.ICON_XS} aria-hidden="true" />
                </Button>
              )}

              {/* Bookmark button with count overlay */}
              {cardConfig.showBookmark && (
                <div className="relative">
                  {item.slug && (
                    <BookmarkButton
                      contentType={
                        isValidCategory(item.category ?? 'agents')
                          ? (item.category as Database['public']['Enums']['content_category'])
                          : 'agents'
                      }
                      contentSlug={item.slug}
                    />
                  )}
                  {bookmarkCount !== undefined && bookmarkCount > 0 && (
                    <UnifiedBadge
                      variant="notification-count"
                      count={bookmarkCount}
                      type="bookmark"
                    />
                  )}
                </div>
              )}

              <div className="relative">
                <Button
                  variant={pinned ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`${UI_CLASSES.ICON_BUTTON_SM} ${pinned ? '' : UI_CLASSES.BUTTON_GHOST_ICON}`}
                  onClick={handlePinToggle}
                  aria-label={pinned ? 'Remove from pinboard' : 'Pin for later'}
                >
                  {pinned ? (
                    <Bookmark className={UI_CLASSES.ICON_XS} aria-hidden="true" />
                  ) : (
                    <BookmarkPlus className={UI_CLASSES.ICON_XS} aria-hidden="true" />
                  )}
                </Button>
              </div>

              {pnpmCommand && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={UI_CLASSES.ICON_BUTTON_SM}
                  onClick={(event) => {
                    event.stopPropagation();
                    copyInlineValue(pnpmCommand, pnpmCommand, {
                      action_type: 'copy_install',
                      manager: 'pnpm',
                    }).catch((error) => {
                      logger.error('Failed to copy pnpm command', error as Error);
                    });
                  }}
                >
                  pnpm add
                </Button>
              )}

              {configurationObject && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={UI_CLASSES.ICON_BUTTON_SM}
                  onClick={(event) => {
                    event.stopPropagation();
                    copyInlineValue(
                      JSON.stringify(configurationObject, null, 2),
                      'Configuration JSON copied',
                      {
                        action_type: 'copy_configuration',
                      }
                    ).catch((error) => {
                      logger.error('Failed to copy configuration', error as Error);
                    });
                  }}
                >
                  Copy config
                </Button>
              )}

              {/* Copy button with count overlay */}
              {cardConfig.showCopyButton && (
                <div className="relative">
                  <SimpleCopyButton
                    content={`${typeof window !== 'undefined' ? window.location.origin : ''}${targetPath}`}
                    successMessage="Link copied to clipboard!"
                    errorMessage="Failed to copy link"
                    variant="ghost"
                    size="sm"
                    className={UI_CLASSES.ICON_BUTTON_SM}
                    iconClassName={UI_CLASSES.ICON_XS}
                    ariaLabel={`Copy link to ${displayTitle}`}
                    onCopySuccess={() => {
                      const category: Database['public']['Enums']['content_category'] =
                        isValidCategory(item.category ?? 'agents')
                          ? (item.category as Database['public']['Enums']['content_category'])
                          : 'agents';
                      if (item.slug) {
                        pulse.copy({ category, slug: item.slug }).catch((error) => {
                          logUnhandledPromise('ConfigCard: copy button pulse failed', error, {
                            category,
                            slug: item.slug ?? undefined,
                          });
                        });
                      }
                    }}
                  />
                  {cardConfig.showCopyCount && copyCount !== undefined && copyCount > 0 && (
                    <UnifiedBadge variant="notification-count" count={copyCount} type="copy" />
                  )}
                </div>
              )}

              {/* View button with count overlay */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${UI_CLASSES.ICON_BUTTON_SM} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Only redirect if category and slug are valid
                    if (isSafeCategoryAndSlug(item.category, item.slug)) {
                      // Explicit validation: targetPath is constructed from validated category and slug
                      // via getContentItemUrl, which returns a relative path like /category/slug
                      // Additional validation ensures the path is a safe internal path
                      if (!isValidInternalPath(targetPath)) {
                        logClientWarning('ConfigCard: Blocked invalid internal path', {
                          attemptedCategory: item.category,
                          attemptedSlug: item.slug,
                          targetPath,
                        });
                        return;
                      }
                      // At this point, targetPath is validated and safe for use in window.location.href
                      const validatedPath: string = targetPath;
                      window.location.href = validatedPath;
                    } else {
                      logClientWarning('ConfigCard: Blocked potentially unsafe redirect', {
                        attemptedCategory: item.category,
                        attemptedSlug: item.slug,
                        targetPath,
                      });
                    }
                  }}
                  aria-label={`View details for ${displayTitle}${cardConfig.showViewCount && viewCount !== undefined && typeof viewCount === 'number' ? ` - ${formatViewCount(viewCount)}` : ''}`}
                >
                  <Eye className={UI_CLASSES.ICON_XS} aria-hidden="true" />
                </Button>
                {cardConfig.showViewCount &&
                  viewCount !== undefined &&
                  typeof viewCount === 'number' &&
                  viewCount > 0 && (
                    <UnifiedBadge variant="notification-count" count={viewCount} type="view" />
                  )}
              </div>
            </>
          )}
          customMetadataText={
            viewCount === undefined &&
            'popularity' in item &&
            typeof item.popularity === 'number' ? (
              <>
                <span>?</span>
                <span>{item.popularity}% popular</span>
              </>
            ) : undefined
          }
        />
      </div>
    );
  }
);

ConfigCard.displayName = 'ConfigCard';
