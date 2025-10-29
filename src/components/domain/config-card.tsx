'use client';

/**
 * ConfigCard Component - Refactored to use BaseCard
 *
 * Displays configuration content (agents, mcp, commands, rules, hooks, guides)
 * with consistent card structure using BaseCard component.
 *
 * Refactoring Benefits:
 * - Eliminates ~100 lines of duplicated code
 * - Leverages BaseCard for shared structure
 * - Maintains all existing features (sponsored tracking, view counts, etc.)
 * - Easier to maintain and extend
 */

import { useRouter } from 'next/navigation';
import { memo, useCallback } from 'react';
import { BaseCard } from '@/src/components/domain/base-card';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { UnifiedButton } from '@/src/components/domain/unified-button';
import { UnifiedReview } from '@/src/components/domain/unified-review';
import { BorderBeam } from '@/src/components/magic/border-beam';
import { Button } from '@/src/components/primitives/button';
import { useCopyToClipboard } from '@/src/hooks/use-copy-to-clipboard';
import { addBookmark } from '@/src/lib/actions/user.actions';
import { isValidCategory } from '@/src/lib/config/category-config';
import {
  Award,
  Copy as CopyIcon,
  ExternalLink,
  Eye,
  Github,
  Layers,
  Sparkles,
} from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { ConfigCardProps } from '@/src/lib/schemas/component.schema';
import { BADGE_COLORS, UI_CLASSES } from '@/src/lib/ui-constants';
import { CARD_BEHAVIORS } from '@/src/lib/ui-constants-categories';
import { getDisplayTitle } from '@/src/lib/utils';
import { formatCopyCount, formatViewCount, getContentItemUrl } from '@/src/lib/utils/content.utils';
import { toasts } from '@/src/lib/utils/toast.utils';

export const ConfigCard = memo(
  ({
    item,
    variant = 'default',
    showCategory = true,
    showActions = true,
    renderSponsoredWrapper,
    enableSwipeGestures = false, // Enable mobile swipe gestures (copy/bookmark)
    useViewTransitions = true, // Enable smooth page morphing with View Transitions API (Baseline as of October 2025)
    showBorderBeam = false, // Position-based BorderBeam animation (top 3 featured items)
  }: ConfigCardProps) => {
    const displayTitle = getDisplayTitle(item);
    const targetPath = getContentItemUrl(item as any);
    const router = useRouter();
    const { copy } = useCopyToClipboard({
      context: {
        component: 'ConfigCard',
        action: 'swipe_copy',
      },
    });

    // Get behavior configuration for this content type
    const behavior =
      CARD_BEHAVIORS[item.category as keyof typeof CARD_BEHAVIORS] || CARD_BEHAVIORS.default;

    // Swipe gesture handlers for mobile quick actions
    const handleSwipeRightCopy = useCallback(async () => {
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}${targetPath}`;
      await copy(url);
      toasts.success.copied();
    }, [targetPath, copy]);

    const handleSwipeLeftBookmark = useCallback(async () => {
      // Type guard validation
      if (!isValidCategory(item.category)) {
        logger.error('Invalid content type for bookmark', new Error('Invalid content type'), {
          contentType: item.category,
          contentSlug: item.slug,
        });
        toasts.error.fromError(new Error(`Invalid content type: ${item.category}`));
        return;
      }

      const validatedCategory = item.category;

      try {
        const result = await addBookmark({
          content_type: validatedCategory,
          content_slug: item.slug,
        });

        if (result?.data?.success) {
          toasts.success.bookmarkAdded();
          router.refresh();
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('signed in')) {
          toasts.error.authRequired();
        } else {
          toasts.error.actionFailed('bookmark');
        }
        logger.error('Failed to add bookmark via swipe', error as Error, {
          contentType: validatedCategory,
          contentSlug: item.slug,
        });
      }
    }, [item.category, item.slug, router]);

    // Extract sponsored metadata - ContentItem already includes these properties (when from enriched RPC)
    const isSponsored: boolean | undefined =
      'isSponsored' in item && typeof item.isSponsored === 'boolean' ? item.isSponsored : undefined;
    const sponsoredId: string | undefined =
      'sponsoredId' in item && typeof item.sponsoredId === 'string' ? item.sponsoredId : undefined;
    const sponsorTier = 'sponsorTier' in item ? item.sponsorTier : undefined;
    const position: number | undefined =
      'position' in item && typeof item.position === 'number' ? item.position : undefined;
    const viewCount = 'viewCount' in item ? item.viewCount : undefined;

    // copyCount is a runtime property added by analytics (not in schema)
    const copyCount = (item as { copyCount?: number }).copyCount;

    // Extract featured metadata (weekly algorithm selection)
    // Note: _featured is a computed property added by trending algorithm, not in schema
    const featuredData = (item as { _featured?: { rank: number; score: number } })._featured;
    const isFeatured = !!featuredData;
    const featuredRank = featuredData?.rank;

    // Extract rating metadata (if available)
    // Note: _rating is a computed property added by rating aggregator, not in schema
    const ratingData = (item as { _rating?: { average: number; count: number } })._rating;
    const hasRating = ratingData && ratingData.count > 0;

    // Extract collection-specific metadata (tree-shakeable - only loaded for collections)
    const isCollection = item.category === 'collections';
    const collectionType = 'collectionType' in item ? item.collectionType : undefined;
    const collectionDifficulty = 'difficulty' in item ? item.difficulty : undefined;
    const itemCount = 'itemCount' in item ? item.itemCount : undefined;

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
        {/* BorderBeam animation - position-based (top 3 featured items per category) */}
        {showBorderBeam && (
          <BorderBeam
            duration={8}
            colorFrom={featuredRank === 1 ? '#ffaa40' : '#9333ea'}
            colorTo={featuredRank === 1 ? '#ffd700' : '#a855f7'}
            borderWidth={1.5}
          />
        )}

        <BaseCard
          {...({
            targetPath,
            displayTitle,
            description: item.description,
            author: 'author' in item && item.author ? item.author : undefined,
            authorProfileUrl:
              'author_profile_url' in item && item.author_profile_url
                ? item.author_profile_url
                : undefined,
            source: 'source' in item && item.source ? (item.source as string) : undefined,
            tags:
              'tags' in item && item.tags && Array.isArray(item.tags)
                ? (item.tags as string[])
                : undefined,
            variant,
            showActions,
            ariaLabel: `${displayTitle} - ${item.category} by ${('author' in item && item.author) || 'Community'}`,
            isSponsored,
            sponsoredId,
            position,
            enableSwipeGestures,
            onSwipeRight: handleSwipeRightCopy,
            onSwipeLeft: handleSwipeLeftBookmark,
            useViewTransitions,
            viewTransitionSlug: item.slug,
          } as any)}
          renderTopBadges={() => (
            <>
              {showCategory && (
                <UnifiedBadge
                  variant="category"
                  category={
                    (item.category || 'agents') as
                      | 'hooks'
                      | 'agents'
                      | 'mcp'
                      | 'rules'
                      | 'commands'
                      | 'guides'
                      | 'collections'
                      | 'skills'
                      | 'statuslines'
                  }
                >
                  {item.category === 'mcp'
                    ? 'MCP'
                    : item.category === 'agents'
                      ? 'Agent'
                      : item.category === 'commands'
                        ? 'Command'
                        : item.category === 'hooks'
                          ? 'Hook'
                          : item.category === 'rules'
                            ? 'Rule'
                            : item.category === 'statuslines'
                              ? 'Statusline'
                              : item.category === 'collections'
                                ? 'Collection'
                                : item.category === 'guides'
                                  ? 'Guide'
                                  : item.category === 'skills'
                                    ? 'Skill'
                                    : 'Agent'}
                </UnifiedBadge>
              )}

              {/* Collection-specific badges (tree-shakeable) */}
              {isCollection && collectionType && COLLECTION_TYPE_LABELS && (
                <UnifiedBadge
                  variant="base"
                  style="outline"
                  className={`text-xs ${BADGE_COLORS.collectionType[collectionType as keyof typeof BADGE_COLORS.collectionType] || ''}`}
                >
                  <Layers className="h-3 w-3 mr-1" aria-hidden="true" />
                  {COLLECTION_TYPE_LABELS[collectionType as keyof typeof COLLECTION_TYPE_LABELS]}
                </UnifiedBadge>
              )}

              {isCollection &&
                collectionDifficulty &&
                (collectionDifficulty === 'beginner' ||
                  collectionDifficulty === 'intermediate' ||
                  collectionDifficulty === 'advanced') && (
                  <UnifiedBadge
                    variant="base"
                    style="outline"
                    className={`text-xs ${BADGE_COLORS.difficulty[collectionDifficulty as 'beginner' | 'intermediate' | 'advanced']}`}
                  >
                    {collectionDifficulty}
                  </UnifiedBadge>
                )}

              {isCollection && itemCount !== undefined && typeof itemCount === 'number' && (
                <UnifiedBadge
                  variant="base"
                  style="outline"
                  className={'text-xs border-muted-foreground/20 text-muted-foreground'}
                >
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </UnifiedBadge>
              )}

              {/* Featured badge - weekly algorithm selection */}
              {isFeatured && (
                <UnifiedBadge
                  variant="base"
                  style="secondary"
                  className="gap-1 border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-600 dark:text-amber-400 hover:from-amber-500/15 hover:to-yellow-500/15 transition-all duration-300 shadow-sm hover:shadow-md font-semibold animate-in fade-in slide-in-from-top-2"
                >
                  {featuredRank && featuredRank <= 3 ? (
                    <Award className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Featured
                  {featuredRank && <span className="text-xs opacity-75">#{featuredRank}</span>}
                </UnifiedBadge>
              )}
              {isSponsored && sponsorTier && (
                <UnifiedBadge
                  variant="sponsored"
                  tier={sponsorTier as 'featured' | 'promoted' | 'spotlight'}
                  showIcon
                />
              )}

              {/* New indicator - 0-7 days old content (server-computed) */}
              {'isNew' in item && item.isNew && (
                <UnifiedBadge variant="new-indicator" label="New content" className="ml-0.5" />
              )}
            </>
          )}
          renderMetadataBadges={() => (
            <>
              {/* View count badge */}
              {behavior.showViewCount &&
                viewCount !== undefined &&
                typeof viewCount === 'number' && (
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                      }
                    }}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    aria-label={`${formatViewCount(viewCount)} views`}
                  >
                    <UnifiedBadge
                      variant="base"
                      style="secondary"
                      className="h-7 px-2.5 gap-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors font-medium"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="text-xs">{formatViewCount(viewCount)}</span>
                    </UnifiedBadge>
                  </button>
                )}

              {/* Copy count badge - social proof for engagement */}
              {behavior.showCopyCount && copyCount !== undefined && copyCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  aria-label={`${formatCopyCount(copyCount)} copies`}
                >
                  <UnifiedBadge
                    variant="base"
                    style="secondary"
                    className="h-7 px-2.5 gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/15 transition-colors font-medium"
                  >
                    <CopyIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-xs">{formatCopyCount(copyCount)}</span>
                  </UnifiedBadge>
                </button>
              )}

              {/* Rating badge - shows average rating and count */}
              {behavior.showRating && hasRating && ratingData && (
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                  className="bg-transparent border-0 p-0 cursor-default"
                >
                  <UnifiedReview
                    variant="rating-compact"
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
                  className={`h-7 w-7 p-0 ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(item.repository as string, '_blank');
                  }}
                  aria-label={`View ${displayTitle} repository on GitHub`}
                >
                  <Github className="h-3 w-3" aria-hidden="true" />
                </Button>
              )}

              {'documentation_url' in item && item.documentation_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-7 p-0 ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(item.documentation_url as string, '_blank');
                  }}
                  aria-label={`View ${displayTitle} documentation`}
                >
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </Button>
              )}

              {/* Bookmark button */}
              <UnifiedButton
                variant="bookmark"
                contentType={item.category || 'agents'}
                contentSlug={item.slug}
              />

              {behavior.showCopyButton && (
                <UnifiedButton
                  variant="card-copy"
                  url={`${typeof window !== 'undefined' ? window.location.origin : ''}${targetPath}`}
                  category={(item.category || 'agents') as any}
                  slug={item.slug}
                  title={displayTitle}
                />
              )}

              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 text-xs ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = targetPath;
                }}
                aria-label={`View details for ${displayTitle}`}
              >
                View
              </Button>
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
